/**
 * VAYA – Floating cards engine (framework agnostic)
 *
 * What it does
 *  - Floats N cards in a stage (Shopify-Editions style: ghost cards drifting at different depths).
 *  - Exactly one card is "active" (sharp, bigger, orange glow via CSS class `is-active`).
 *  - Dotted spokes connect the active card (hub) to every other card.
 *  - A paper plane rests on the active card and flies along the dotted spoke to the next card.
 *
 * Why it never looks crooked
 *  - Card positions are COMPUTED here every frame (not measured from the DOM), and the very same
 *    numbers drive both the card transforms and the SVG paths + plane. So lines are always attached.
 *  - Cycle order must alternate left / right column (slots below do), so the plane always leaves from
 *    the inner edge of a card and lands on the inner edge of the next one.
 */

export type Slot = { x: number; y: number }; // centre of the card, 0..1 of the stage

export type FloatingCardsOptions = {
  stage: HTMLElement; // position: relative
  cards: HTMLElement[]; // in cycle order (alternate left/right)
  svg: SVGSVGElement; // connector layer, must contain one <path class="fc-spoke"> per card
  plane: HTMLElement; // plane wrapper, drawn pointing to +x, positioned at 0,0
  slots?: Slot[];
  depths?: number[]; // 0 = near, 1 = mid, 2 = far (per card)
  intervalMs?: number; // time a card stays active before the plane leaves
  reducedMotion?: boolean;
  onActiveChange?: (index: number) => void;
};

type Phase = 'rest' | 'turn' | 'fly' | 'settle';

const DEFAULT_SLOTS: Slot[] = [
  { x: 0.23, y: 0.14 }, // L
  { x: 0.77, y: 0.2 }, //  R
  { x: 0.2, y: 0.5 }, //   L
  { x: 0.8, y: 0.55 }, //  R
  { x: 0.26, y: 0.86 }, // L
  { x: 0.74, y: 0.88 }, // R
];
const DEFAULT_DEPTHS = [1, 2, 0, 1, 0, 2];
const DEPTH = [
  { scale: 1.04, drift: 1.0, parallax: 14 }, // near
  { scale: 1.0, drift: 0.85, parallax: 9 }, //  mid
  { scale: 0.95, drift: 0.7, parallax: 5 }, //  far
];

const REST_MS = 2600;
const TURN_MS = 380;
const FLY_MS = 1000;
const SETTLE_MS = 650;
const ACTIVE_BONUS = 0.12; // extra scale for the active card
const SPOKE_GAP = 14; // px between card edge and the first dot (plane uses the same gap so it flies exactly on the dotted line)
const PLANE_GAP = SPOKE_GAP;

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);
const angDelta = (a0: number, a1: number) => ((((a1 - a0 + Math.PI) % TAU) + TAU) % TAU) - Math.PI;

type CardState = {
  el: HTMLElement;
  w: number;
  h: number;
  depth: number;
  cx: number;
  cy: number;
  scale: number;
  rot: number;
  activeAmt: number; // 0..1 smoothed
  // drift params
  ax: number;
  ay: number;
  wx: number;
  wy: number;
  wr: number;
  px: number;
  py: number;
  pr: number;
};

type Pt = { x: number; y: number };

export class FloatingCardsEngine {
  private o: FloatingCardsOptions;
  private slots: Slot[];
  private cs: CardState[] = [];
  private spokes: SVGPathElement[] = [];
  private spokeAlpha: number[] = [];
  private W = 0;
  private H = 0;
  private t = 0;
  private last = 0;
  private raf = 0;
  private running = false;
  private visible = true;
  private ro?: ResizeObserver;
  private io?: IntersectionObserver;
  private reduced: boolean;
  private baseY: number[] = [];
  private fit = 1;

  private hub = 0;
  private prev: number;
  private target = 1;
  private pending: number | null = null;
  private phase: Phase = 'rest';
  private phaseStart = 0;
  private paused = false;
  private resumeTimer = 0;
  private activeApplied = -1;

  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private cleanup: Array<() => void> = [];

  constructor(opts: FloatingCardsOptions) {
    this.o = opts;
    this.slots = opts.slots ?? DEFAULT_SLOTS;
    this.reduced = !!opts.reducedMotion;
    const n = opts.cards.length;
    this.prev = n - 1;
    this.target = 1 % n;
    const depths = opts.depths ?? DEFAULT_DEPTHS;

    this.cs = opts.cards.map((el, i) => {
      const d = depths[i % depths.length] ?? 1;
      const k = DEPTH[d];
      return {
        el,
        w: 0,
        h: 0,
        depth: d,
        cx: 0,
        cy: 0,
        scale: k.scale,
        rot: 0,
        activeAmt: 0,
        ax: 15 * k.drift,
        ay: 13 * k.drift,
        wx: TAU / (8 + ((i * 1.7) % 4)),
        wy: TAU / (9 + ((i * 2.3) % 4)),
        wr: TAU / (11 + ((i * 1.3) % 5)),
        px: i * 1.9,
        py: i * 2.7 + 1,
        pr: i * 0.8,
      };
    });
    this.spokes = Array.from(opts.svg.querySelectorAll<SVGPathElement>('.fc-spoke'));
    this.spokeAlpha = this.cs.map(() => 0);

    this.measure();
    this.bind();
    this.setActive(0, true);
    this.start();
  }

  /* ───────────── public ───────────── */

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.resumeTimer);
    this.ro?.disconnect();
    this.io?.disconnect();
    this.cleanup.forEach((f) => f());
  }

  /** make `i` the next active card (the plane flies there along the dotted spoke) */
  goTo(i: number) {
    if (i === this.hub && this.phase !== 'fly') return;
    if (this.phase === 'fly' || this.phase === 'turn') {
      if (i !== this.target) this.pending = i;
      return;
    }
    this.begin(i);
  }

  setReducedMotion(v: boolean) {
    this.reduced = v;
  }

  /** geometry snapshot, used by tests */
  debug() {
    return {
      hub: this.hub,
      target: this.target,
      phase: this.phase,
      cards: this.cs.map((c) => ({ cx: c.cx, cy: c.cy, hw: (c.w * c.scale) / 2, hh: (c.h * c.scale) / 2, rot: c.rot })),
      plane: this.planePos(performance.now()),
      stage: { W: this.W, H: this.H },
    };
  }

  /* ───────────── setup ───────────── */

  private measure() {
    const r = this.o.stage.getBoundingClientRect();
    this.W = r.width;
    this.H = r.height;
    for (const c of this.cs) {
      c.w = c.el.offsetWidth;
      c.h = c.el.offsetHeight;
    }
    this.o.svg.setAttribute('viewBox', `0 0 ${this.W} ${this.H}`);
    this.layout();
  }

  /**
   * Vertical rhythm is computed from the REAL card heights, so cards can never overlap, whatever the
   * screen size. Left column starts at the top, right column is staggered down by 0.4 gap.
   * If the stage is too small even then, everything is scaled down a little (`fit`).
   */
  private layout() {
    const m = 16;
    const minGapY = 48; // >= 2 x max drift + parallax + safety
    const sMax = (c: CardState) => DEPTH[c.depth].scale + ACTIVE_BONUS;
    const cols: number[][] = [[], []];
    this.cs.forEach((_, i) => cols[i % 2].push(i));

    let fit = 1;
    for (const col of cols) {
      if (!col.length) continue;
      const tot = col.reduce((a, i) => a + this.cs[i].h * sMax(this.cs[i]), 0);
      const need = tot + (col.length - 1 + 0.4) * minGapY + 2 * m;
      if (need > this.H && tot > 0) fit = Math.min(fit, (this.H - 2 * m - (col.length - 1 + 0.4) * minGapY) / tot);
    }
    const wMax = Math.max(...this.cs.map((c) => c.w * sMax(c)), 1);
    const needX = 2 * wMax + 56 + 2 * m;
    if (needX > this.W) fit = Math.min(fit, (this.W - 56 - 2 * m) / (2 * wMax));
    this.fit = clamp(fit, 0.55, 1);

    this.baseY = this.cs.map(() => this.H / 2);
    cols.forEach((col, ci) => {
      const hs = col.map((i) => this.cs[i].h * sMax(this.cs[i]) * this.fit);
      const tot = hs.reduce((a, b) => a + b, 0);
      const free = Math.max(0, this.H - 2 * m - tot);
      if (col.length === 1) {
        this.baseY[col[0]] = this.H / 2;
        return;
      }
      const gap = free / (col.length - 1 + 0.4);
      let cursor = m + (ci === 1 ? 0.4 * gap : 0);
      col.forEach((i, k) => {
        this.baseY[i] = cursor + hs[k] / 2;
        cursor += hs[k] + gap;
      });
    });
  }

  private bind() {
    const { stage } = this.o;
    this.ro = new ResizeObserver(() => this.measure());
    this.ro.observe(stage);
    this.cs.forEach((c) => this.ro!.observe(c.el));

    this.io = new IntersectionObserver((es) => {
      this.visible = es[0]?.isIntersecting ?? true;
      if (this.visible) {
        this.last = performance.now();
        if (!this.running) this.start();
      }
    });
    this.io.observe(stage);

    const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement, ev: K, fn: (e: HTMLElementEventMap[K]) => void) => {
      el.addEventListener(ev, fn as EventListener);
      this.cleanup.push(() => el.removeEventListener(ev, fn as EventListener));
    };

    on(stage, 'pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      this.pointer.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      this.pointer.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    });
    on(stage, 'pointerleave', () => {
      this.pointer.tx = 0;
      this.pointer.ty = 0;
      this.resume(1200);
    });
    on(stage, 'pointerenter', () => {
      this.paused = true;
      clearTimeout(this.resumeTimer);
    });

    this.cs.forEach((c, i) => {
      on(c.el, 'pointerenter', () => this.goTo(i));
      on(c.el, 'focus', () => this.goTo(i));
    });
  }

  private resume(ms: number) {
    clearTimeout(this.resumeTimer);
    this.resumeTimer = window.setTimeout(() => {
      this.paused = false;
      this.phaseStart = performance.now() - REST_MS * 0.6;
    }, ms);
  }

  private start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.phaseStart = this.last;
    const loop = (now: number) => {
      if (!this.running) return;
      if (!this.visible) {
        this.running = false;
        return;
      }
      this.frame(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  /* ───────────── state machine ───────────── */

  private begin(target: number) {
    this.target = target;
    if (this.reduced) {
      this.land(performance.now());
      return;
    }
    this.phase = 'turn';
    this.phaseStart = performance.now();
  }

  private land(now: number) {
    this.prev = this.hub;
    this.hub = this.target;
    this.phase = 'settle';
    this.phaseStart = now;
    this.setActive(this.hub);
    this.spokeAlpha[this.hub] = 0; // hub has no spoke
  }

  private nextAuto() {
    return (this.hub + 1) % this.cs.length;
  }

  private setActive(i: number, silent = false) {
    if (this.activeApplied === i) return;
    this.activeApplied = i;
    this.cs.forEach((c, k) => {
      c.el.classList.toggle('is-active', k === i);
      c.el.setAttribute('aria-current', k === i ? 'true' : 'false');
    });
    if (!silent) this.o.onActiveChange?.(i);
  }

  private clearActive() {
    if (this.activeApplied === -1) return;
    this.activeApplied = -1;
    this.cs.forEach((c) => {
      c.el.classList.remove('is-active');
      c.el.setAttribute('aria-current', 'false');
    });
  }

  private advance(now: number) {
    const el = now - this.phaseStart;
    switch (this.phase) {
      case 'rest':
        if (!this.paused && el > REST_MS) this.begin(this.nextAuto());
        break;
      case 'turn':
        if (el > TURN_MS) {
          this.phase = 'fly';
          this.phaseStart = now;
        }
        break;
      case 'fly': {
        const p = clamp(el / FLY_MS, 0, 1);
        if (p > 0.25 && this.activeApplied === this.hub) this.clearActive();
        if (p > 0.72 && this.activeApplied !== this.target) this.setActive(this.target);
        if (p >= 1) this.land(now);
        break;
      }
      case 'settle':
        if (el > SETTLE_MS) {
          this.phase = 'rest';
          this.phaseStart = now;
          if (this.pending !== null && this.pending !== this.hub) {
            const p = this.pending;
            this.pending = null;
            this.begin(p);
          } else this.pending = null;
        }
        break;
    }
  }

  /* ───────────── geometry helpers ───────────── */

  private anchor(i: number, dirX: number, dirY: number, gap: number): Pt {
    const c = this.cs[i];
    const len = Math.hypot(dirX, dirY) || 1;
    const ux = dirX / len;
    const uy = dirY / len;
    const hw = (c.w * c.scale) / 2;
    const hh = (c.h * c.scale) / 2;
    const tx = Math.abs(ux) < 1e-6 ? Infinity : hw / Math.abs(ux);
    const ty = Math.abs(uy) < 1e-6 ? Infinity : hh / Math.abs(uy);
    const t = Math.min(tx, ty);
    let x = c.cx + ux * t;
    let y = c.cy + uy * t;
    // push out along the normal of the face that was hit -> distance to the card edge is exactly `gap`
    if (tx < ty) x += Math.sign(ux) * gap;
    else y += Math.sign(uy) * gap;
    return { x, y };
  }

  /** cubic bezier hub -> card, attached to both card edges */
  private spoke(a: number, b: number, gap = SPOKE_GAP) {
    const A = this.cs[a];
    const B = this.cs[b];
    const dx = B.cx - A.cx;
    const dy = B.cy - A.cy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const p0 = this.anchor(a, ux, uy, gap);
    const p3 = this.anchor(b, -ux, -uy, gap);
    const d = Math.hypot(p3.x - p0.x, p3.y - p0.y);
    let nx = -uy;
    let ny = ux;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    } // always bow upwards
    const bow = d * 0.1;
    const p1 = { x: p0.x + ux * d * 0.38 + nx * bow, y: p0.y + uy * d * 0.38 + ny * bow };
    const p2 = { x: p3.x - ux * d * 0.38 + nx * bow, y: p3.y - uy * d * 0.38 + ny * bow };
    return { p0, p1, p2, p3 };
  }

  private bez(s: { p0: Pt; p1: Pt; p2: Pt; p3: Pt }, t: number): Pt {
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    return {
      x: a * s.p0.x + b * s.p1.x + c * s.p2.x + d * s.p3.x,
      y: a * s.p0.y + b * s.p1.y + c * s.p2.y + d * s.p3.y,
    };
  }

  private bezTan(s: { p0: Pt; p1: Pt; p2: Pt; p3: Pt }, t: number): Pt {
    const u = 1 - t;
    return {
      x: 3 * u * u * (s.p1.x - s.p0.x) + 6 * u * t * (s.p2.x - s.p1.x) + 3 * t * t * (s.p3.x - s.p2.x),
      y: 3 * u * u * (s.p1.y - s.p0.y) + 6 * u * t * (s.p2.y - s.p1.y) + 3 * t * t * (s.p3.y - s.p2.y),
    };
  }

  /** plane position + angle for the current phase */
  private planePos(now: number): { x: number; y: number; a: number } {
    const H = this.cs[this.hub];
    const el = now - this.phaseStart;
    const bob = Math.sin(this.t * 2.1) * 1.6;

    // resting spot: inner edge of the hub, on the side it came from
    const P = this.cs[this.prev];
    const restPos = this.anchor(this.hub, P.cx - H.cx, P.cy - H.cy, PLANE_GAP);
    const intoA = Math.atan2(H.cy - restPos.y, H.cx - restPos.x);

    if (this.phase === 'rest' || this.phase === 'settle') {
      return { x: restPos.x, y: restPos.y + bob, a: intoA };
    }

    const T = this.cs[this.target];
    const dirX = T.cx - H.cx;
    const dirY = T.cy - H.cy;

    if (this.phase === 'turn') {
      const k = easeInOut(clamp(el / TURN_MS, 0, 1));
      const depart = this.anchor(this.hub, dirX, dirY, PLANE_GAP);
      const toward = Math.atan2(dirY, dirX);
      return {
        x: lerp(restPos.x, depart.x, k),
        y: lerp(restPos.y, depart.y, k) + bob * (1 - k),
        a: intoA + angDelta(intoA, toward) * k,
      };
    }

    // fly along the very same dotted curve that is drawn
    const s = this.spoke(this.hub, this.target, PLANE_GAP);
    const p = easeInOut(clamp(el / FLY_MS, 0, 1));
    const pos = this.bez(s, p);
    const tan = this.bezTan(s, Math.min(0.999, Math.max(0.001, p)));
    return { x: pos.x, y: pos.y, a: Math.atan2(tan.y, tan.x) };
  }

  /* ───────────── frame ───────────── */

  private frame(now: number) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;

    // pointer smoothing
    const pk = damp(5, dt);
    this.pointer.x += (this.pointer.tx - this.pointer.x) * pk;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * pk;

    this.advance(now);

    // cards
    const m = 14;
    this.cs.forEach((c, i) => {
      const slot = this.slots[i % this.slots.length];
      const k = DEPTH[c.depth];
      const mv = this.reduced ? 0 : 1;
      const hw = (c.w * c.scale) / 2;
      const bx = clamp(slot.x * this.W, hw + m + c.ax, this.W - hw - m - c.ax);
      const by = this.baseY[i];
      c.cx = bx + mv * (Math.sin(this.t * c.wx + c.px) * c.ax - this.pointer.x * k.parallax);
      c.cy = by + mv * (Math.sin(this.t * c.wy + c.py) * c.ay - this.pointer.y * k.parallax);
      c.rot = mv * Math.sin(this.t * c.wr + c.pr) * 0.9;
      const isActive = this.activeApplied === i;
      c.activeAmt += ((isActive ? 1 : 0) - c.activeAmt) * damp(7, dt);
      c.scale = (k.scale + ACTIVE_BONUS * c.activeAmt) * this.fit;
      c.el.style.transform = `translate3d(${(c.cx - c.w / 2).toFixed(2)}px,${(c.cy - c.h / 2).toFixed(2)}px,0) rotate(${c.rot.toFixed(3)}deg) scale(${c.scale.toFixed(4)})`;
    });

    // spokes (hub -> others)
    const flying = this.phase === 'fly';
    this.spokes.forEach((path, i) => {
      if (i === this.hub) {
        path.style.display = 'none';
        return;
      }
      path.style.display = '';
      let target = 0.7;
      if (flying) target = i === this.target ? 0.9 : 0;
      const rate = target > this.spokeAlpha[i] ? 5 : 9;
      this.spokeAlpha[i] += (target - this.spokeAlpha[i]) * damp(rate, dt);
      const s = this.spoke(this.hub, i);
      path.setAttribute('d', `M${s.p0.x.toFixed(1)} ${s.p0.y.toFixed(1)}C${s.p1.x.toFixed(1)} ${s.p1.y.toFixed(1)} ${s.p2.x.toFixed(1)} ${s.p2.y.toFixed(1)} ${s.p3.x.toFixed(1)} ${s.p3.y.toFixed(1)}`);
      path.style.strokeDashoffset = String(-((this.reduced ? 0 : this.t) * 14));
      path.style.opacity = this.spokeAlpha[i].toFixed(3);
    });

    // plane
    const pp = this.planePos(now);
    this.o.plane.style.transform = `translate3d(${pp.x.toFixed(2)}px,${pp.y.toFixed(2)}px,0) rotate(${((pp.a * 180) / Math.PI).toFixed(2)}deg)`;
  }
}
