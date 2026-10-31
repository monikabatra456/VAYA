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
    { x: 0.25, y: 0.1 },
    //  top-left
    { x: 0.75, y: 0.1 },
    //  top-right
    { x: 0.75, y: 0.5 },
    //  mid-right
    { x: 0.75, y: 0.9 },
    //  bottom-right
    { x: 0.25, y: 0.9 },
    //  bottom-left
    { x: 0.25, y: 0.5 }
    //  mid-left
  ];
  var DEFAULT_DEPTHS = [1, 2, 0, 1, 2, 0];
  var DEPTH = [
    { scale: 1.02, drift: 1, parallax: 8 },
    // near
    { scale: 1, drift: 0.85, parallax: 5 },
    // mid
    { scale: 0.97, drift: 0.7, parallax: 3 }
    // far
  ];
  var REST_MS = 2800;
  var TURN_MS = 320;
  var FLY_MS_ONE = 950;
  var FLY_MS_LEG = 520;
  var SETTLE_MS = 650;
  var ACTIVE_BONUS = 0.06;
  var PORT_GAP = 14;
  var DRIFT_X = 7;
  var DRIFT_Y = 6;
  var ROUTE_ALPHA = 0.5;
  var ROUTE_LIVE = 0.95;
  var TAU = Math.PI * 2;
  var clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  var easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  var damp = (rate, dt) => 1 - Math.exp(-rate * dt);
  var angDelta = (a0, a1) => ((a1 - a0 + Math.PI) % TAU + TAU) % TAU - Math.PI;
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = a + 1831565813 >>> 0;
      let t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var FloatingCardsEngine = class {
    o;
    cs = [];
    gs = [];
    spokes = [];
    spokeAlpha = [];
    baseY = [];
    baseX = [];
    fit = 1;
    channel = 150;
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
    hub = 0;
    target = 1;
    legs = 1;
    pending = null;
    phase = "rest";
    phaseStart = 0;
    paused = false;
    resumeTimer = 0;
    activeApplied = -1;
    landAngle = 0;
    pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    cleanup = [];
    constructor(opts) {
      this.o = opts;
      this.reduced = !!opts.reducedMotion;
      const slots = opts.slots ?? DEFAULT_SLOTS;
      const depths = opts.depths ?? DEFAULT_DEPTHS;
      this.cs = opts.cards.map((el, i) => {
        const d = depths[i % depths.length] ?? 1;
        const k = DEPTH[d];
        const slot = slots[i % slots.length];
        return {
          el,
          col: slot.x < 0.5 ? 0 : 1,
          w: 0,
          h: 0,
          depth: d,
          cx: 0,
          cy: 0,
          scale: k.scale,
          activeAmt: 0,
          ax: DRIFT_X * k.drift,
          ay: DRIFT_Y * k.drift,
          wx: TAU / (11 + i * 1.7 % 4),
          wy: TAU / (12 + i * 2.3 % 4),
          wr: TAU / (15 + i * 1.3 % 5),
          px: i * 1.9,
          py: i * 2.7 + 1,
          pr: i * 0.8
        };
      });
      const rand = rng(20261031);
      this.gs = (opts.ghosts ?? []).map((el, i) => {
        const layer = i % 5 < 3 ? 1 : 0;
        return {
          el,
          layer,
          fx: -0.04 + rand() * 1.08,
          fy: -0.04 + rand() * 1.08,
          sw: layer ? 0.5 + rand() * 0.6 : 0.6 + rand() * 0.5,
          ar: 0.34 + rand() * 0.18,
          ax: 12 + rand() * 14,
          ay: 10 + rand() * 12,
          wx: TAU / (14 + rand() * 10),
          wy: TAU / (15 + rand() * 10),
          px: rand() * TAU,
          py: rand() * TAU,
          rot: (rand() - 0.5) * 3,
          w: 0,
          h: 0
        };
      });
      this.spokes = Array.from(opts.svg.querySelectorAll(".fc-spoke"));
      this.spokeAlpha = this.cs.map(() => ROUTE_ALPHA);
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
    /** make card `i` the active one; the plane flies there along the dotted route */
    goTo(i) {
      if (i === this.hub && this.phase !== "fly" && this.phase !== "turn") return;
      if (this.phase === "fly" || this.phase === "turn") {
        if (i !== this.target) this.pending = i;
        return;
      }
      this.begin(i);
    }
    setReducedMotion(v) {
      this.reduced = v;
    }
    debug() {
      return {
        hub: this.hub,
        target: this.target,
        phase: this.phase,
        fit: this.fit,
        cards: this.cs.map((c) => ({ cx: c.cx, cy: c.cy, hw: c.w * c.scale / 2, hh: c.h * c.scale / 2, col: c.col })),
        ports: this.cs.map((_, i) => this.port(i)),
        plane: this.planePos(performance.now()),
        ghosts: this.gs.length,
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
      const refW = this.cs[0]?.w ?? 300;
      const refH = this.cs[0]?.h ?? 120;
      for (const g of this.gs) {
        g.w = Math.round(refW * g.sw);
        g.h = Math.round(Math.max(refH * 0.55, g.w * g.ar));
        g.el.style.width = g.w + "px";
        g.el.style.height = g.h + "px";
        g.el.dataset.layer = String(g.layer);
      }
      this.o.svg.setAttribute("viewBox", `0 0 ${this.W} ${this.H}`);
      this.layout();
    }
    /**
     * Real card heights decide the vertical rhythm, so cards can never overlap at any screen size.
     * Right column is staggered down by 0.4 gap. If the stage is too small, all cards shrink a little (`fit`).
     */
    layout() {
      const m = 14;
      const minGapY = 36;
      const sMax = (c) => DEPTH[c.depth].scale + ACTIVE_BONUS;
      const cols = [[], []];
      this.cs.forEach((c, i) => cols[c.col].push(i));
      cols.forEach((col) => col.sort((a, b) => ((this.o.slots ?? DEFAULT_SLOTS)[a % 6]?.y ?? 0) - ((this.o.slots ?? DEFAULT_SLOTS)[b % 6]?.y ?? 0)));
      let fit = 1;
      for (const col of cols) {
        if (!col.length) continue;
        const tot = col.reduce((a, i) => a + this.cs[i].h * sMax(this.cs[i]), 0);
        const need = tot + (col.length - 1 + 0.4) * minGapY + 2 * m;
        if (need > this.H && tot > 0) fit = Math.min(fit, (this.H - 2 * m - (col.length - 1 + 0.4) * minGapY) / tot);
      }
      const wMax = Math.max(...this.cs.map((c) => c.w * sMax(c)), 1);
      const channel = clamp(wMax * 0.5, 120, 190);
      if (2 * wMax + channel + 2 * m > this.W) fit = Math.min(fit, (this.W - channel - 2 * m) / (2 * wMax));
      this.fit = clamp(fit, 0.55, 1);
      this.channel = channel * Math.min(1, 0.5 + 0.5 * this.fit);
      this.baseY = this.cs.map(() => this.H / 2);
      this.baseX = this.cs.map(() => this.W / 2);
      cols.forEach((col, ci) => {
        const hs = col.map((i) => this.cs[i].h * sMax(this.cs[i]) * this.fit);
        const tot = hs.reduce((a, b) => a + b, 0);
        const free = Math.max(0, this.H - 2 * m - tot);
        const gap = col.length > 1 ? free / (col.length - 1 + 0.4) : 0;
        let cursor = m + (ci === 1 && col.length > 1 ? 0.4 * gap : 0);
        col.forEach((i, k) => {
          this.baseY[i] = col.length === 1 ? this.H / 2 : cursor + hs[k] / 2;
          cursor += hs[k] + gap;
          const hw = this.cs[i].w * sMax(this.cs[i]) * this.fit / 2;
          this.baseX[i] = ci === 0 ? this.W / 2 - this.channel / 2 - hw : this.W / 2 + this.channel / 2 + hw;
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
        if (this.visible && !this.running) this.start();
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
    n() {
      return this.cs.length;
    }
    flyMs() {
      return this.legs === 1 ? FLY_MS_ONE : Math.min(2300, FLY_MS_LEG * this.legs);
    }
    begin(target) {
      this.target = target;
      this.legs = (target - this.hub + this.n()) % this.n() || this.n();
      if (this.reduced) {
        this.land(performance.now());
        return;
      }
      this.phase = this.o.plane ? "turn" : "fly";
      this.phaseStart = performance.now();
    }
    land(now) {
      const lastLeg = (this.hub + this.legs - 1) % this.n();
      const tan = this.bezTan(this.seg(lastLeg), 1);
      this.landAngle = Math.atan2(tan.y, tan.x);
      this.hub = this.target;
      this.phase = "settle";
      this.phaseStart = now;
      this.setActive(this.hub);
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
          if (!this.paused && el > REST_MS) this.begin((this.hub + 1) % this.n());
          break;
        case "turn":
          if (el > TURN_MS) {
            this.phase = "fly";
            this.phaseStart = now;
          }
          break;
        case "fly": {
          const p = clamp(el / this.flyMs(), 0, 1);
          if (p > 0.2 && this.activeApplied === this.hub) this.clearActive();
          if (p > 0.8 && this.activeApplied !== this.target) this.setActive(this.target);
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
    /* ───────────── geometry ───────────── */
    /** inner-edge middle of a card (left column -> right edge, right column -> left edge), PORT_GAP outside it */
    port(i) {
      const c = this.cs[i];
      const hw = c.w * c.scale / 2;
      return { x: c.col === 0 ? c.cx + hw + PORT_GAP : c.cx - hw - PORT_GAP, y: c.cy };
    }
    /** route segment i: card i -> card i+1 */
    seg(i) {
      const j = (i + 1) % this.n();
      const A = this.port(i);
      const B = this.port(j);
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      if (this.cs[i].col === this.cs[j].col) {
        const toward = this.cs[i].col === 0 ? 1 : -1;
        const bow2 = toward * Math.min(22, Math.abs(dy) * 0.12);
        return { p0: A, p1: { x: A.x + bow2, y: A.y + dy * 0.33 }, p2: { x: B.x + bow2, y: B.y - dy * 0.33 }, p3: B };
      }
      const top = (A.y + B.y) / 2 < this.H / 2;
      const bow = (top ? -1 : 1) * Math.min(26, Math.abs(dx) * 0.1);
      return { p0: A, p1: { x: A.x + dx * 0.38, y: A.y + bow }, p2: { x: B.x - dx * 0.38, y: B.y + bow }, p3: B };
    }
    bez(s, t) {
      const u = 1 - t;
      const a = u * u * u;
      const b = 3 * u * u * t;
      const c = 3 * u * t * t;
      const d = t * t * t;
      return { x: a * s.p0.x + b * s.p1.x + c * s.p2.x + d * s.p3.x, y: a * s.p0.y + b * s.p1.y + c * s.p2.y + d * s.p3.y };
    }
    bezTan(s, t) {
      const tt = clamp(t, 1e-3, 0.999);
      const u = 1 - tt;
      return {
        x: 3 * u * u * (s.p1.x - s.p0.x) + 6 * u * tt * (s.p2.x - s.p1.x) + 3 * tt * tt * (s.p3.x - s.p2.x),
        y: 3 * u * u * (s.p1.y - s.p0.y) + 6 * u * tt * (s.p2.y - s.p1.y) + 3 * tt * tt * (s.p3.y - s.p2.y)
      };
    }
    restAngle() {
      return this.cs[this.hub].col === 0 ? Math.PI : 0;
    }
    planePos(now) {
      const el = now - this.phaseStart;
      const bob = Math.sin(this.t * 2.1) * 1.5;
      const P = this.port(this.hub);
      if (this.phase === "rest") return { x: P.x, y: P.y + bob, a: this.restAngle() };
      if (this.phase === "settle") {
        const k = easeInOut(clamp(el / (SETTLE_MS * 0.7), 0, 1));
        const rest = this.restAngle();
        return { x: P.x, y: P.y + bob * k, a: this.landAngle + angDelta(this.landAngle, rest) * k };
      }
      if (this.phase === "turn") {
        const k = easeInOut(clamp(el / TURN_MS, 0, 1));
        const tan2 = this.bezTan(this.seg(this.hub), 0);
        const to = Math.atan2(tan2.y, tan2.x);
        const rest = this.restAngle();
        return { x: P.x, y: P.y + bob * (1 - k), a: rest + angDelta(rest, to) * k };
      }
      const u = easeInOut(clamp(el / this.flyMs(), 0, 1)) * this.legs;
      const leg = Math.min(Math.floor(u), this.legs - 1);
      const s = this.seg((this.hub + leg) % this.n());
      const tl = u - leg;
      const pos = this.bez(s, tl);
      const tan = this.bezTan(s, tl);
      return { x: pos.x, y: pos.y, a: Math.atan2(tan.y, tan.x) };
    }
    /* ───────────── frame ───────────── */
    frame(now) {
      const dt = Math.min(0.05, (now - this.last) / 1e3);
      this.last = now;
      this.t += dt;
      const mv = this.reduced ? 0 : 1;
      const pk = damp(5, dt);
      this.pointer.x += (this.pointer.tx - this.pointer.x) * pk;
      this.pointer.y += (this.pointer.ty - this.pointer.y) * pk;
      this.advance(now);
      for (const g of this.gs) {
        const par = g.layer ? 4 : 7;
        const x = g.fx * this.W + mv * (Math.sin(this.t * g.wx + g.px) * g.ax - this.pointer.x * par);
        const y = g.fy * this.H + mv * (Math.sin(this.t * g.wy + g.py) * g.ay - this.pointer.y * par);
        g.el.style.transform = `translate3d(${(x - g.w / 2).toFixed(1)}px,${(y - g.h / 2).toFixed(1)}px,0) rotate(${(g.rot * mv).toFixed(2)}deg)`;
      }
      this.cs.forEach((c, i) => {
        const k = DEPTH[c.depth];
        c.cx = this.baseX[i] + mv * (Math.sin(this.t * c.wx + c.px) * c.ax - this.pointer.x * k.parallax);
        c.cy = this.baseY[i] + mv * (Math.sin(this.t * c.wy + c.py) * c.ay - this.pointer.y * k.parallax);
        const rot = mv * Math.sin(this.t * c.wr + c.pr) * 0.4;
        c.activeAmt += ((this.activeApplied === i ? 1 : 0) - c.activeAmt) * damp(7, dt);
        c.scale = (k.scale + ACTIVE_BONUS * c.activeAmt) * this.fit;
        c.el.style.transform = `translate3d(${(c.cx - c.w / 2).toFixed(2)}px,${(c.cy - c.h / 2).toFixed(2)}px,0) rotate(${rot.toFixed(3)}deg) scale(${c.scale.toFixed(4)})`;
      });
      const flying = this.phase === "fly";
      const live = /* @__PURE__ */ new Set();
      if (flying) for (let l = 0; l < this.legs; l++) live.add((this.hub + l) % this.n());
      this.spokes.forEach((path, i) => {
        const target = live.has(i) ? ROUTE_LIVE : ROUTE_ALPHA;
        this.spokeAlpha[i] += (target - this.spokeAlpha[i]) * damp(live.has(i) ? 8 : 2.5, dt);
        const s = this.seg(i);
        path.setAttribute("d", `M${s.p0.x.toFixed(1)} ${s.p0.y.toFixed(1)}C${s.p1.x.toFixed(1)} ${s.p1.y.toFixed(1)} ${s.p2.x.toFixed(1)} ${s.p2.y.toFixed(1)} ${s.p3.x.toFixed(1)} ${s.p3.y.toFixed(1)}`);
        path.style.strokeDashoffset = String(-(mv * this.t * 14));
        path.style.opacity = this.spokeAlpha[i].toFixed(3);
      });
      if (!this.o.plane) return;
      const pp = this.planePos(now);
      this.o.plane.style.transform = `translate3d(${pp.x.toFixed(2)}px,${pp.y.toFixed(2)}px,0) rotate(${(pp.a * 180 / Math.PI).toFixed(2)}deg)`;
    }
  };
  return __toCommonJS(floatingCardsEngine_exports);
})();
