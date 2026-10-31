var FloatingCardsEngine = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/floatingCardsEngine.ts
  var floatingCardsEngine_exports = {};
  __export(floatingCardsEngine_exports, {
    FloatingCardsEngine: () => FloatingCardsEngine
  });
  var DEFAULT_SLOTS = [
    { x: 0.23, y: 0.14 },
    // L
    { x: 0.77, y: 0.2 },
    //  R
    { x: 0.2, y: 0.5 },
    //   L
    { x: 0.8, y: 0.55 },
    //  R
    { x: 0.26, y: 0.86 },
    // L
    { x: 0.74, y: 0.88 }
    // R
  ];
  var DEFAULT_DEPTHS = [1, 2, 0, 1, 0, 2];
  var DEPTH = [
    { scale: 1.04, drift: 1, parallax: 14 },
    // near
    { scale: 1, drift: 0.85, parallax: 9 },
    //  mid
    { scale: 0.95, drift: 0.7, parallax: 5 }
    //  far
  ];
  var REST_MS = 2600;
  var TURN_MS = 380;
  var FLY_MS = 1e3;
  var SETTLE_MS = 650;
  var ACTIVE_BONUS = 0.12;
  var SPOKE_GAP = 14;
  var PLANE_GAP = SPOKE_GAP;
  var TAU = Math.PI * 2;
  var clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  var lerp = (a, b, t) => a + (b - a) * t;
  var easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  var damp = (rate, dt) => 1 - Math.exp(-rate * dt);
  var angDelta = (a0, a1) => ((a1 - a0 + Math.PI) % TAU + TAU) % TAU - Math.PI;
  var FloatingCardsEngine = class {
    o;
    slots;
    cs = [];
    spokes = [];
    spokeAlpha = [];
    W = 0;
    H = 0;
    t = 0;
    last = 0;
    raf = 0;
    running = false;
    visible = true;
    ro;
    io;
    reduced;
    baseY = [];
    fit = 1;
    hub = 0;
    prev;
    target = 1;
    pending = null;
    phase = "rest";
    phaseStart = 0;
    paused = false;
    resumeTimer = 0;
    activeApplied = -1;
    pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    cleanup = [];
    constructor(opts) {
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
          wx: TAU / (8 + i * 1.7 % 4),
          wy: TAU / (9 + i * 2.3 % 4),
          wr: TAU / (11 + i * 1.3 % 5),
          px: i * 1.9,
          py: i * 2.7 + 1,
          pr: i * 0.8
        };
      });
      this.spokes = Array.from(opts.svg.querySelectorAll(".fc-spoke"));
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
    goTo(i) {
      if (i === this.hub && this.phase !== "fly") return;
      if (this.phase === "fly" || this.phase === "turn") {
        if (i !== this.target) this.pending = i;
        return;
      }
      this.begin(i);
    }
    setReducedMotion(v) {
      this.reduced = v;
    }
    /** geometry snapshot, used by tests */
    debug() {
      return {
        hub: this.hub,
        target: this.target,
        phase: this.phase,
        cards: this.cs.map((c) => ({ cx: c.cx, cy: c.cy, hw: c.w * c.scale / 2, hh: c.h * c.scale / 2, rot: c.rot })),
        plane: this.planePos(performance.now()),
        stage: { W: this.W, H: this.H }
      };
    }
    /* ───────────── setup ───────────── */
    measure() {
      const r = this.o.stage.getBoundingClientRect();
      this.W = r.width;
      this.H = r.height;
      for (const c of this.cs) {
        c.w = c.el.offsetWidth;
        c.h = c.el.offsetHeight;
      }
      this.o.svg.setAttribute("viewBox", `0 0 ${this.W} ${this.H}`);
      this.layout();
    }
    /**
     * Vertical rhythm is computed from the REAL card heights, so cards can never overlap, whatever the
     * screen size. Left column starts at the top, right column is staggered down by 0.4 gap.
     * If the stage is too small even then, everything is scaled down a little (`fit`).
     */
    layout() {
      const m = 16;
      const minGapY = 48;
      const sMax = (c) => DEPTH[c.depth].scale + ACTIVE_BONUS;
      const cols = [[], []];
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
    bind() {
      const { stage } = this.o;
      this.ro = new ResizeObserver(() => this.measure());
      this.ro.observe(stage);
      this.cs.forEach((c) => this.ro.observe(c.el));
      this.io = new IntersectionObserver((es) => {
        this.visible = es[0]?.isIntersecting ?? true;
        if (this.visible) {
          this.last = performance.now();
          if (!this.running) this.start();
        }
      });
      this.io.observe(stage);
      const on = (el, ev, fn) => {
        el.addEventListener(ev, fn);
        this.cleanup.push(() => el.removeEventListener(ev, fn));
      };
      on(stage, "pointermove", (e) => {
        const r = stage.getBoundingClientRect();
        this.pointer.tx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1);
        this.pointer.ty = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1);
      });
      on(stage, "pointerleave", () => {
        this.pointer.tx = 0;
        this.pointer.ty = 0;
        this.resume(1200);
      });
      on(stage, "pointerenter", () => {
        this.paused = true;
        clearTimeout(this.resumeTimer);
      });
      this.cs.forEach((c, i) => {
        on(c.el, "pointerenter", () => this.goTo(i));
        on(c.el, "focus", () => this.goTo(i));
      });
    }
    resume(ms) {
      clearTimeout(this.resumeTimer);
      this.resumeTimer = window.setTimeout(() => {
        this.paused = false;
        this.phaseStart = performance.now() - REST_MS * 0.6;
      }, ms);
    }
    start() {
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      this.phaseStart = this.last;
      const loop = (now) => {
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
    begin(target) {
      this.target = target;
      if (this.reduced) {
        this.land(performance.now());
        return;
      }
      this.phase = "turn";
      this.phaseStart = performance.now();
    }
    land(now) {
      this.prev = this.hub;
      this.hub = this.target;
      this.phase = "settle";
      this.phaseStart = now;
      this.setActive(this.hub);
      this.spokeAlpha[this.hub] = 0;
    }
    nextAuto() {
      return (this.hub + 1) % this.cs.length;
    }
    setActive(i, silent = false) {
      if (this.activeApplied === i) return;
      this.activeApplied = i;
      this.cs.forEach((c, k) => {
        c.el.classList.toggle("is-active", k === i);
        c.el.setAttribute("aria-current", k === i ? "true" : "false");
      });
      if (!silent) this.o.onActiveChange?.(i);
    }
    clearActive() {
      if (this.activeApplied === -1) return;
      this.activeApplied = -1;
      this.cs.forEach((c) => {
        c.el.classList.remove("is-active");
        c.el.setAttribute("aria-current", "false");
      });
    }
    advance(now) {
      const el = now - this.phaseStart;
      switch (this.phase) {
        case "rest":
          if (!this.paused && el > REST_MS) this.begin(this.nextAuto());
          break;
        case "turn":
          if (el > TURN_MS) {
            this.phase = "fly";
            this.phaseStart = now;
          }
          break;
        case "fly": {
          const p = clamp(el / FLY_MS, 0, 1);
          if (p > 0.25 && this.activeApplied === this.hub) this.clearActive();
          if (p > 0.72 && this.activeApplied !== this.target) this.setActive(this.target);
          if (p >= 1) this.land(now);
          break;
        }
        case "settle":
          if (el > SETTLE_MS) {
            this.phase = "rest";
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
    anchor(i, dirX, dirY, gap) {
      const c = this.cs[i];
      const len = Math.hypot(dirX, dirY) || 1;
      const ux = dirX / len;
      const uy = dirY / len;
      const hw = c.w * c.scale / 2;
      const hh = c.h * c.scale / 2;
      const tx = Math.abs(ux) < 1e-6 ? Infinity : hw / Math.abs(ux);
      const ty = Math.abs(uy) < 1e-6 ? Infinity : hh / Math.abs(uy);
      const t = Math.min(tx, ty);
      let x = c.cx + ux * t;
      let y = c.cy + uy * t;
      if (tx < ty) x += Math.sign(ux) * gap;
      else y += Math.sign(uy) * gap;
      return { x, y };
    }
    /** cubic bezier hub -> card, attached to both card edges */
    spoke(a, b, gap = SPOKE_GAP) {
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
      }
      const bow = d * 0.1;
      const p1 = { x: p0.x + ux * d * 0.38 + nx * bow, y: p0.y + uy * d * 0.38 + ny * bow };
      const p2 = { x: p3.x - ux * d * 0.38 + nx * bow, y: p3.y - uy * d * 0.38 + ny * bow };
      return { p0, p1, p2, p3 };
    }
    bez(s, t) {
      const u = 1 - t;
      const a = u * u * u;
      const b = 3 * u * u * t;
      const c = 3 * u * t * t;
      const d = t * t * t;
      return {
        x: a * s.p0.x + b * s.p1.x + c * s.p2.x + d * s.p3.x,
        y: a * s.p0.y + b * s.p1.y + c * s.p2.y + d * s.p3.y
      };
    }
    bezTan(s, t) {
      const u = 1 - t;
      return {
        x: 3 * u * u * (s.p1.x - s.p0.x) + 6 * u * t * (s.p2.x - s.p1.x) + 3 * t * t * (s.p3.x - s.p2.x),
        y: 3 * u * u * (s.p1.y - s.p0.y) + 6 * u * t * (s.p2.y - s.p1.y) + 3 * t * t * (s.p3.y - s.p2.y)
      };
    }
    /** plane position + angle for the current phase */
    planePos(now) {
      const H = this.cs[this.hub];
      const el = now - this.phaseStart;
      const bob = Math.sin(this.t * 2.1) * 1.6;
      const P = this.cs[this.prev];
      const restPos = this.anchor(this.hub, P.cx - H.cx, P.cy - H.cy, PLANE_GAP);
      const intoA = Math.atan2(H.cy - restPos.y, H.cx - restPos.x);
      if (this.phase === "rest" || this.phase === "settle") {
        return { x: restPos.x, y: restPos.y + bob, a: intoA };
      }
      const T = this.cs[this.target];
      const dirX = T.cx - H.cx;
      const dirY = T.cy - H.cy;
      if (this.phase === "turn") {
        const k = easeInOut(clamp(el / TURN_MS, 0, 1));
        const depart = this.anchor(this.hub, dirX, dirY, PLANE_GAP);
        const toward = Math.atan2(dirY, dirX);
        return {
          x: lerp(restPos.x, depart.x, k),
          y: lerp(restPos.y, depart.y, k) + bob * (1 - k),
          a: intoA + angDelta(intoA, toward) * k
        };
      }
      const s = this.spoke(this.hub, this.target, PLANE_GAP);
      const p = easeInOut(clamp(el / FLY_MS, 0, 1));
      const pos = this.bez(s, p);
      const tan = this.bezTan(s, Math.min(0.999, Math.max(1e-3, p)));
      return { x: pos.x, y: pos.y, a: Math.atan2(tan.y, tan.x) };
    }
    /* ───────────── frame ───────────── */
    frame(now) {
      const dt = Math.min(0.05, (now - this.last) / 1e3);
      this.last = now;
      this.t += dt;
      const pk = damp(5, dt);
      this.pointer.x += (this.pointer.tx - this.pointer.x) * pk;
      this.pointer.y += (this.pointer.ty - this.pointer.y) * pk;
      this.advance(now);
      const m = 14;
      this.cs.forEach((c, i) => {
        const slot = this.slots[i % this.slots.length];
        const k = DEPTH[c.depth];
        const mv = this.reduced ? 0 : 1;
        const hw = c.w * c.scale / 2;
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
      const flying = this.phase === "fly";
      this.spokes.forEach((path, i) => {
        if (i === this.hub) {
          path.style.display = "none";
          return;
        }
        path.style.display = "";
        let target = 0.7;
        if (flying) target = i === this.target ? 0.9 : 0;
        const rate = target > this.spokeAlpha[i] ? 5 : 9;
        this.spokeAlpha[i] += (target - this.spokeAlpha[i]) * damp(rate, dt);
        const s = this.spoke(this.hub, i);
        path.setAttribute("d", `M${s.p0.x.toFixed(1)} ${s.p0.y.toFixed(1)}C${s.p1.x.toFixed(1)} ${s.p1.y.toFixed(1)} ${s.p2.x.toFixed(1)} ${s.p2.y.toFixed(1)} ${s.p3.x.toFixed(1)} ${s.p3.y.toFixed(1)}`);
        path.style.strokeDashoffset = String(-((this.reduced ? 0 : this.t) * 14));
        path.style.opacity = this.spokeAlpha[i].toFixed(3);
      });
      const pp = this.planePos(now);
      this.o.plane.style.transform = `translate3d(${pp.x.toFixed(2)}px,${pp.y.toFixed(2)}px,0) rotate(${(pp.a * 180 / Math.PI).toFixed(2)}deg)`;
    }
  };
  return __toCommonJS(floatingCardsEngine_exports);
})();
