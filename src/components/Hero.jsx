// src/components/Hero.jsx – Section 1: Cinematic Hero v4
// Native scroll + gsap.ticker. No ScrollTrigger, no Lenis.
// Fixes: depth/flying feel, vignette, even plane speed, scene-B birds+balloon.
// Cloud photo layers only — zero procedural cloud sprites.
"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { HERO_CONFIG as C } from "@/app/heroConfig";

// ── Asset paths ──────────────────────────────────────────────────────────────
const PLANE_SRC   = "/assets/plane-1000.webp";
const SCENE_B_SRC = "/hero/scene-b.jpg";

// ── Z-index hierarchy ────────────────────────────────────────────────────────
// base(10) < cloud-far(20) < cloud-mid(30) < PLANE(40) < cloud-near(50)
// < scene-b(60) < vignette(65) < scrim(90) < text(100) < cue(110) < scene2-fx(120)
const Z = {
  base:     10,
  far:      20,
  mid:      30,
  plane:    40,
  near:     50,
  sceneB:   60,
  vignette: 65,
  scrim:    90,
  text:     100,
  cue:      110,
  scene2:   120,
};

// ── Math helpers ─────────────────────────────────────────────────────────────
const clamp     = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp      = (a, b, t)   => a + (b - a) * t;
const sineInOut = (t)         => 0.5 * (1 - Math.cos(Math.PI * t));
const eout      = (t)         => 1 - Math.pow(1 - t, 3);

// Single consistent ease for ALL phase-1 motion (flying into mountains).
// sineInOut: symmetrical acceleration/deceleration, no sudden speed changes.
function flyEase(p) {
  return sineInOut(clamp(p, 0, 1));
}

// ── Bird definitions (Scene B) ───────────────────────────────────────────────
const BIRD_DEFS = [
  { xPct: 8,  yVh: 14, scale: 1.00, bob: 6  },
  { xPct: 14, yVh: 17, scale: 0.75, bob: 5  },
  { xPct: 5,  yVh: 20, scale: 0.60, bob: 4  },
  { xPct: 20, yVh: 13, scale: 0.85, bob: 7  },
  { xPct: 11, yVh: 23, scale: 0.55, bob: 3  },
];

function BirdSVG({ scale }) {
  const w = 38 * scale;
  const h = 16 * scale;
  return (
    <svg width={w} height={h} viewBox="0 0 38 16" fill="none" aria-hidden="true" style={{ display: "block", overflow: "visible" }}>
      <path d="M19 9 C13 5, 7 2, 0 4"  stroke="rgba(20,33,61,0.55)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M19 9 C25 5, 31 2, 38 4" stroke="rgba(20,33,61,0.55)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function BalloonSVG({ size }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 120 168" aria-hidden="true" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <radialGradient id="bal-sky" cx="45%" cy="38%" r="60%">
          <stop offset="0%"   stopColor="#fde8c8"/>
          <stop offset="45%"  stopColor="#f5b97a"/>
          <stop offset="100%" stopColor="#e07b4a"/>
        </radialGradient>
        <radialGradient id="bal-stripe" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.22)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        <radialGradient id="bal-shadow" cx="30%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="rgba(150,80,30,0)"/>
          <stop offset="100%" stopColor="rgba(150,80,30,0.28)"/>
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="62" rx="46" ry="56" fill="url(#bal-sky)"/>
      <ellipse cx="60" cy="62" rx="46" ry="56" fill="url(#bal-shadow)"/>
      <ellipse cx="46" cy="52" rx="18" ry="28" fill="url(#bal-stripe)"/>
      {[0,60,120,180,240,300].map((a,i) => {
        const rad = (a*Math.PI)/180;
        return <line key={i} x1={60+Math.sin(rad)*10} y1={12} x2={60+Math.sin(rad)*6} y2={116} stroke="rgba(190,110,50,0.22)" strokeWidth="1"/>;
      })}
      <line x1="44" y1="116" x2="44" y2="138" stroke="rgba(120,70,20,0.55)" strokeWidth="1.5"/>
      <line x1="76" y1="116" x2="76" y2="138" stroke="rgba(120,70,20,0.55)" strokeWidth="1.5"/>
      <line x1="52" y1="114" x2="50" y2="138" stroke="rgba(120,70,20,0.45)" strokeWidth="1.2"/>
      <line x1="68" y1="114" x2="70" y2="138" stroke="rgba(120,70,20,0.45)" strokeWidth="1.2"/>
      <rect x="40" y="138" width="40" height="22" rx="4" fill="#c8864a"/>
      <rect x="40" y="138" width="40" height="4"  rx="2" fill="#a86030"/>
      <line x1="53" y1="142" x2="53" y2="160" stroke="rgba(100,50,20,0.35)" strokeWidth="1"/>
      <line x1="67" y1="142" x2="67" y2="160" stroke="rgba(100,50,20,0.35)" strokeWidth="1"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Hero() {
  const wrapperRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Photo layers
  const baseRef      = useRef(null);
  const cloudFarRef  = useRef(null);
  const cloudMidRef  = useRef(null);
  const cloudNearRef = useRef(null);
  const sceneBRef    = useRef(null);

  // Overlays
  const vignetteRef = useRef(null);

  // Plane
  const planeRef    = useRef(null);
  const contrailRef = useRef(null);

  // Text
  const textRef    = useRef(null);
  const letterRefs = useRef([null, null, null, null]);
  const tag1Ref    = useRef(null);
  const tag2Ref    = useRef(null);
  const cueRef     = useRef(null);

  // Scene 2 — birds + balloon
  const birdRefs   = useRef([]);
  const balloonRef = useRef(null);
  const scene2Ref  = useRef(null);

  // Idle loops
  const idleLoopsRef = useRef([]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let W      = window.innerWidth;
    let H      = window.innerHeight;
    let mobile = W < 768;
    setIsMobile(mobile);

    let wrapperTop  = 0;
    let scrollMax   = 1;
    let planeW = 0, planeH = 0;
    let planeStartX = 0, planeStartY = 0;
    let planeEndX   = 0, planeEndY   = 0;

    function computeLayout() {
      W      = window.innerWidth;
      H      = window.innerHeight;
      mobile = W < 768;
      setIsMobile(mobile);

      const scrollLen = ((mobile ? C.SCROLL_LENGTH_MOBILE : C.SCROLL_LENGTH) / 100) * H;
      scrollMax = Math.max(1, scrollLen - H);

      const rect = wrapper.getBoundingClientRect();
      wrapperTop = rect.top + window.scrollY;

      const planeVw = mobile ? C.PLANE_WIDTH_MOBILE : C.PLANE_WIDTH_DESKTOP;
      planeW = (planeVw / 100) * W;
      planeH = planeW * 0.31;

      planeStartX = W * C.PLANE_START.xVw - planeW * 0.5;
      planeStartY = H * C.PLANE_START.yVh - planeH * 0.5;

      // End near vanishing point (62% x, 49% y), accounting for end scale 0.35
      planeEndX = W * 0.62 - planeW * 0.35 * 0.5;
      planeEndY = H * 0.49 - planeH * 0.35 * 0.5;
    }
    computeLayout();

    const onResize = () => computeLayout();
    window.addEventListener("resize", onResize, { passive: true });

    // Intersection + tab visibility
    let isVisible    = true;
    let isTabVisible = !document.hidden;

    const io = new IntersectionObserver(([e]) => {
      isVisible = e.isIntersecting;
      idleLoopsRef.current.forEach(tl => isVisible ? tl.resume() : tl.pause());
    }, { threshold: 0 });
    io.observe(wrapper);

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
      idleLoopsRef.current.forEach(tl => isTabVisible ? tl.resume() : tl.pause());
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // prefers-reduced-motion
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      if (baseRef.current)      baseRef.current.style.opacity      = "0";
      if (cloudFarRef.current)  cloudFarRef.current.style.opacity  = "0";
      if (cloudMidRef.current)  cloudMidRef.current.style.opacity  = "0";
      if (cloudNearRef.current) cloudNearRef.current.style.opacity = "0";
      if (sceneBRef.current)    sceneBRef.current.style.opacity    = "1";
      if (textRef.current) {
        textRef.current.style.visibility = "visible";
        textRef.current.style.opacity    = "1";
      }
      letterRefs.current.forEach(el => { if (el) el.style.transform = "translateY(0)"; });
      [tag1Ref, tag2Ref].forEach(r => {
        if (r.current) { r.current.style.opacity = "1"; r.current.style.transform = "translateY(0)"; }
      });
      if (cueRef.current)   cueRef.current.style.opacity = "0";
      if (scene2Ref.current) scene2Ref.current.style.display = "none";
      return () => {
        io.disconnect();
        document.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("resize", onResize);
      };
    }

    // Idle loops — bird bob + wing flap + balloon sway
    birdRefs.current.forEach((el, i) => {
      if (!el) return;
      const def = BIRD_DEFS[i] || BIRD_DEFS[0];

      // Bob
      const bobTl = gsap.timeline({ repeat: -1, yoyo: true, paused: true });
      bobTl.to(el, { y: `+=${def.bob}`, duration: 0.7 + i * 0.12, ease: "sine.inOut" });
      idleLoopsRef.current.push(bobTl);
      bobTl.play();

      // Wing flap (animate the path d attribute of the two wing paths)
      const paths = el.querySelectorAll("path");
      if (paths.length >= 2) {
        const flapTl = gsap.timeline({ repeat: -1, yoyo: true, paused: true });
        flapTl.to(paths[0], { attr: { d: "M19 9 C13 12, 7 10, 0 13" }, duration: 0.36 + i * 0.05, ease: "sine.inOut" }, 0);
        flapTl.to(paths[1], { attr: { d: "M19 9 C25 12, 31 10, 38 13" }, duration: 0.36 + i * 0.05, ease: "sine.inOut" }, 0);
        idleLoopsRef.current.push(flapTl);
        flapTl.play();
      }
    });

    if (balloonRef.current) {
      const swayTl = gsap.timeline({ repeat: -1, yoyo: true, paused: true });
      swayTl.to(balloonRef.current, { rotation: 2, y: -8, duration: 3.5, ease: "sine.inOut" });
      idleLoopsRef.current.push(swayTl);
      swayTl.play();
    }

    // Scroll loop
    let current = 0;

    function applyTransforms(p) {
      const t = performance.now() / 1000;

      // ─── Phase 1: p 0→SWAP_END, single flyEase drives everything ─────────
      const pPhase1 = clamp(p / C.SWAP_END, 0, 1);
      const fP1     = flyEase(pPhase1);

      // Idle sway (subtle, winds down as we zoom)
      const swayFreq = (2 * Math.PI) / 40;
      const swayAmp  = W * (C.CAMERA_SWAY_VW / 100);
      const sway = (phase) => Math.sin(t * swayFreq + phase) * swayAmp * (1 - fP1 * 0.7);

      // Layer scales — all driven by fP1 (same ease, different amounts for parallax)
      const scaleBase  = 1 + 0.35 * fP1;
      const scaleFar   = 1 + 0.48 * fP1;
      const scaleMid   = 1 + 0.62 * fP1;
      const scaleNear  = 1 + 0.95 * fP1;

      // Camera drift toward vanishing point: subtle x nudge
      const driftBaseX = -W * 0.015 * fP1;   // -1.5vw
      const driftFarX  = -W * 0.020 * fP1;
      const driftMidX  =  W * 0.010 * fP1;   // opposite (passes by)
      const driftMidY  =  H * 0.012 * fP1;
      const driftNearX = -W * 0.030 * fP1;
      const driftNearY = -H * 0.025 * fP1;

      // ─── Opacities ────────────────────────────────────────────────────────
      const swapFrac  = clamp((p - C.SWAP_START) / (C.SWAP_END - C.SWAP_START), 0, 1);
      const swapP     = sineInOut(swapFrac);
      const baseOp    = 1 - swapP;
      const sceneBOp  = swapP;

      const cldFadeFrac   = clamp((p - C.CLOUDS_FADE_START) / (C.CLOUDS_FADE_END - C.CLOUDS_FADE_START), 0, 1);
      const cloudFarMidOp = 1 - sineInOut(cldFadeFrac);

      const win = C.PLANE_CLOUD_WINDOW;
      let cloudNearOp = 0;
      if      (p < win.rampStart) { cloudNearOp = 0; }
      else if (p <= win.rampEnd)  { cloudNearOp = lerp(0, win.peakOpacity, sineInOut((p-win.rampStart)/(win.rampEnd-win.rampStart))); }
      else if (p <= win.holdEnd)  { cloudNearOp = win.peakOpacity; }
      else if (p <= win.easeEnd)  { cloudNearOp = lerp(win.peakOpacity, win.easedOpacity, sineInOut((p-win.holdEnd)/(win.easeEnd-win.holdEnd))); }
      else if (p <= C.CLOUDS_FADE_END) { cloudNearOp = lerp(win.easedOpacity, 0, (p-win.easeEnd)/(C.CLOUDS_FADE_END-win.easeEnd)); }

      // ─── Scene B scale (continues zooming post-swap) ──────────────────────
      let scaleSceneB;
      if (p <= C.SWAP_END) {
        scaleSceneB = scaleBase;
      } else {
        const postF = clamp((p - C.SWAP_END) / (1 - C.SWAP_END), 0, 1);
        scaleSceneB = lerp(1 + 0.35, C.SCENE_B_SCALE_END, sineInOut(postF));
      }

      // ─── Apply layer transforms ───────────────────────────────────────────
      if (baseRef.current) {
        baseRef.current.style.transform = `translate3d(${(sway(0)+driftBaseX).toFixed(1)}px,0px,0) scale3d(${scaleBase.toFixed(4)},${scaleBase.toFixed(4)},1)`;
        baseRef.current.style.opacity   = baseOp.toFixed(4);
      }
      if (cloudFarRef.current) {
        cloudFarRef.current.style.transform = `translate3d(${(sway(1.2)+driftFarX).toFixed(1)}px,0px,0) scale3d(${scaleFar.toFixed(4)},${scaleFar.toFixed(4)},1)`;
        cloudFarRef.current.style.opacity   = (cloudFarMidOp * baseOp).toFixed(4);
      }
      if (cloudMidRef.current) {
        cloudMidRef.current.style.transform = `translate3d(${(sway(2.4)+driftMidX).toFixed(1)}px,${driftMidY.toFixed(1)}px,0) scale3d(${scaleMid.toFixed(4)},${scaleMid.toFixed(4)},1)`;
        cloudMidRef.current.style.opacity   = (cloudFarMidOp * baseOp).toFixed(4);
      }
      if (cloudNearRef.current) {
        cloudNearRef.current.style.transform = `translate3d(${(sway(3.6)+driftNearX).toFixed(1)}px,${driftNearY.toFixed(1)}px,0) scale3d(${scaleNear.toFixed(4)},${scaleNear.toFixed(4)},1)`;
        cloudNearRef.current.style.opacity   = cloudNearOp.toFixed(4);
      }
      if (sceneBRef.current) {
        sceneBRef.current.style.transform = `scale3d(${scaleSceneB.toFixed(4)},${scaleSceneB.toFixed(4)},1)`;
        sceneBRef.current.style.opacity   = sceneBOp.toFixed(4);
      }

      // ─── Vignette "walls closing in" ──────────────────────────────────────
      // Opacity 0→0.18, scale 1→1.25, only during phase 1
      if (vignetteRef.current) {
        const vigOp    = (0.18 * fP1).toFixed(4);
        const vigScale = (1 + 0.25 * fP1).toFixed(4);
        vignetteRef.current.style.opacity   = vigOp;
        vignetteRef.current.style.transform = `scale3d(${vigScale},${vigScale},1)`;
      }

      // ─── Plane — ONE continuous sineInOut ease for everything ─────────────
      if (planeRef.current) {
        const pRise = clamp(p / C.PLANE_SCROLL_END, 0, 1);
        const pp    = flyEase(pRise); // same ease family

        const px = lerp(planeStartX, planeEndX, pp);
        const py = lerp(planeStartY, planeEndY, pp);
        const ps = lerp(1, 0.35, pp);  // scale 1→0.35

        // Gentle banking arc: 0° → peak 3° → 0°
        const bankRot = Math.sin(pp * Math.PI) * 3;

        // Altitude micro-float (alive), dies out near vanishing point
        const altFloat = Math.sin(t * 1.6) * 3 * (1 - pp * 0.85);

        // Soft veil as plane passes through cloud-near band
        let veil = 1.0;
        if (p >= 0.16 && p <= 0.32) {
          veil = 1.0 - Math.sin(((p - 0.16) / 0.16) * Math.PI) * 0.28;
        }

        // Fade out last 15% of path (deep in mist)
        const fadeOut = 1 - clamp((pp - 0.85) / 0.15, 0, 1);
        const planeOp = (fadeOut * veil).toFixed(4);

        planeRef.current.style.transform = `translate3d(${px.toFixed(1)}px,${(py + altFloat).toFixed(1)}px,0) scale3d(${ps.toFixed(4)},${ps.toFixed(4)},1) rotate(${bankRot.toFixed(2)}deg)`;
        planeRef.current.style.opacity   = planeOp;

        if (contrailRef.current) {
          contrailRef.current.style.opacity = Math.max(0, 1 - pRise * 1.2).toFixed(2);
        }
      }

      // ─── Scroll cue ───────────────────────────────────────────────────────
      if (cueRef.current) {
        cueRef.current.style.opacity = Math.max(0, 1 - p / 0.05).toFixed(4);
      }

      // ─── Text (Columbus layout) ───────────────────────────────────────────
      if (p >= C.TEXT_START) {
        if (textRef.current) {
          if (textRef.current.style.visibility !== "visible") textRef.current.style.visibility = "visible";
          textRef.current.style.opacity = "1";
        }
        const textP  = clamp((p - C.TEXT_START) / C.TEXT_REVEAL_SPAN, 0, 1);
        const driftY = -24 * clamp((p - C.TEXT_START) / (1 - C.TEXT_START), 0, 1);
        if (textRef.current) textRef.current.style.transform = `translateY(${driftY.toFixed(2)}px)`;

        letterRefs.current.forEach((el, i) => {
          if (!el) return;
          const lp = eout(clamp((textP - i * 0.08) / 0.6, 0, 1));
          el.style.transform = `translateY(${((1 - lp) * 110).toFixed(2)}%)`;
        });

        [[tag1Ref, 0.28], [tag2Ref, 0.48]].forEach(([ref, delay]) => {
          if (!ref.current) return;
          const tp = eout(clamp((textP - delay) / 0.45, 0, 1));
          ref.current.style.opacity   = tp.toFixed(4);
          ref.current.style.transform = `translateY(${((1 - tp) * 24).toFixed(2)}px)`;
        });
      } else {
        if (textRef.current && textRef.current.style.visibility !== "hidden") {
          textRef.current.style.visibility = "hidden";
          textRef.current.style.opacity    = "0";
        }
      }

      // ─── Scene 2 fx wrapper — fades in exactly with scene-B ──────────────
      if (scene2Ref.current) {
        scene2Ref.current.style.opacity = sceneBOp.toFixed(4);
      }
    }

    function tick() {
      if (!isVisible || !isTabVisible) return;
      const target = clamp((window.scrollY - wrapperTop) / scrollMax, 0, 1);
      current += (target - current) * C.DAMPING;
      applyTransforms(current);
    }

    gsap.ticker.add(tick);
    applyTransforms(0);

    return () => {
      gsap.ticker.remove(tick);
      idleLoopsRef.current.forEach(tl => tl.kill());
      idleLoopsRef.current = [];
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Shared style for full-frame photo layers
  const layerStyle = (zIdx, extra) => ({
    position:        "absolute",
    inset:           0,
    width:           "100%",
    height:          "100%",
    pointerEvents:   "none",
    zIndex:          zIdx,
    transformOrigin: "62% 49%",  // vanishing point — all layers zoom toward here
    willChange:      "transform, opacity",
    ...extra,
  });

  return (
    <section
      id="hero"
      ref={wrapperRef}
      className="hero-wrapper relative w-full"
      style={{ height: `${isMobile ? C.SCROLL_LENGTH_MOBILE : C.SCROLL_LENGTH}vh` }}
      aria-label="VAYA cinematic hero"
    >
      <div className="hero-sticky">

        {/* ── 1. BASE (z10) ────────────────────────────────────────────────── */}
        <div ref={baseRef} style={layerStyle(Z.base)}>
          <picture>
            <source media="(max-width: 767px)" srcSet="/hero/real/mobile/base.webp"/>
            <img src="/hero/real/base.webp" alt="VAYA Valley Base" className="hero-bg-layer" style={{ objectPosition: "62% 49%" }} draggable={false}/>
          </picture>
        </div>

        {/* ── 2. CLOUD-FAR (z20) ───────────────────────────────────────────── */}
        <div ref={cloudFarRef} style={layerStyle(Z.far)}>
          <picture>
            <source media="(max-width: 767px)" srcSet="/hero/real/mobile/cloud-far.webp"/>
            <img src="/hero/real/cloud-far.webp" alt="" className="hero-bg-layer" style={{ objectPosition: "62% 49%" }} draggable={false}/>
          </picture>
        </div>

        {/* ── 3. CLOUD-MID (z30) ───────────────────────────────────────────── */}
        <div ref={cloudMidRef} style={layerStyle(Z.mid)}>
          <picture>
            <source media="(max-width: 767px)" srcSet="/hero/real/mobile/cloud-mid.webp"/>
            <img src="/hero/real/cloud-mid.webp" alt="" className="hero-bg-layer" style={{ objectPosition: "62% 49%" }} draggable={false}/>
          </picture>
        </div>

        {/* ── 4. PLANE (z40) ───────────────────────────────────────────────── */}
        <div ref={planeRef} className="hero-plane" style={{ zIndex: Z.plane, opacity: 1 }}>
          <img src={PLANE_SRC} alt="VAYA airliner" draggable={false}/>
          <div ref={contrailRef} className="hero-contrail"/>
        </div>

        {/* ── 5. CLOUD-NEAR (z50, ABOVE PLANE) ─────────────────────────────── */}
        <div ref={cloudNearRef} style={layerStyle(Z.near, { opacity: 0 })}>
          <picture>
            <source media="(max-width: 767px)" srcSet="/hero/real/mobile/cloud-near.webp"/>
            <img src="/hero/real/cloud-near.webp" alt="" className="hero-bg-layer" style={{ objectPosition: "62% 49%" }} draggable={false}/>
          </picture>
        </div>

        {/* ── 6. SCENE B (z60) ─────────────────────────────────────────────── */}
        <div ref={sceneBRef} style={layerStyle(Z.sceneB, { transformOrigin: "50% 50%", opacity: 0 })}>
          <img src={SCENE_B_SRC} alt="VAYA Alpine Lake" className="hero-bg-layer" style={{ objectPosition: "50% 50%" }} draggable={false}/>
        </div>

        {/* ── 7. VIGNETTE — "mountain walls closing in" (z65) ──────────────── */}
        <div
          ref={vignetteRef}
          style={{
            position:        "absolute",
            inset:           0,
            zIndex:          Z.vignette,
            pointerEvents:   "none",
            transformOrigin: "50% 50%",
            willChange:      "transform, opacity",
            opacity:         0,
            background: [
              "linear-gradient(to right,",
              "  rgba(20,33,61,0.80) 0%,",
              "  rgba(20,33,61,0.10) 20%,",
              "  rgba(20,33,61,0)    40%,",
              "  rgba(20,33,61,0)    60%,",
              "  rgba(20,33,61,0.10) 80%,",
              "  rgba(20,33,61,0.80) 100%",
              ")",
            ].join(""),
          }}
        />

        {/* ── 8. SCENE 2 FX — Birds + Balloon (z120, fades with scene-B) ───── */}
        <div
          ref={scene2Ref}
          style={{ position: "absolute", inset: 0, zIndex: Z.scene2, pointerEvents: "none", opacity: 0 }}
        >
          {BIRD_DEFS.map((def, i) => {
            if (isMobile && i >= 3) return null;
            const bSize = isMobile ? def.scale * 0.7 : def.scale;
            return (
              <div
                key={i}
                ref={el => { birdRefs.current[i] = el; }}
                style={{
                  position:      "absolute",
                  left:          `${def.xPct + (i % 2 === 0 ? 0 : 3)}%`,
                  top:           `${def.yVh}vh`,
                  willChange:    "transform",
                  pointerEvents: "none",
                }}
              >
                <BirdSVG scale={bSize}/>
              </div>
            );
          })}

          {/* Balloon — upper right, clear of tagline text */}
          <div
            ref={balloonRef}
            style={{
              position:      "absolute",
              right:         isMobile ? "8%" : "22%",
              top:           isMobile ? "10vh" : "14vh",
              willChange:    "transform",
              pointerEvents: "none",
            }}
          >
            <BalloonSVG size={isMobile ? 70 : 108}/>
          </div>
        </div>

        {/* ── 9. TEXT OVERLAY (z100) ────────────────────────────────────────── */}
        <div ref={textRef} className="hero-text" style={{ zIndex: Z.text, visibility: "hidden", opacity: 0 }} aria-hidden="true">
          <div className={`vaya-word ${C.VAYA_ALIGN === "center" ? "vaya-center" : ""}`}>
            {["V","A","Y","A"].map((letter, i) => (
              <div key={i} className="vaya-clip">
                <span ref={el => { letterRefs.current[i] = el; }} className="vaya-letter" style={{ transform: "translateY(110%)" }}>
                  {letter}
                </span>
              </div>
            ))}
          </div>
          <div className="hero-text-scrim" style={{ zIndex: Z.scrim }}/>
          <p ref={tag1Ref} className="hero-tag1" style={{ opacity: 0, transform: "translateY(24px)" }}>Know before you go</p>
          <p ref={tag2Ref} className="hero-tag2" style={{ opacity: 0, transform: "translateY(24px)" }}>Step in, step out</p>
        </div>

        {/* ── 10. SCROLL CUE (z110) ─────────────────────────────────────────── */}
        <div ref={cueRef} className="hero-cue" style={{ zIndex: Z.cue }}>
          SCROLL TO EXPLORE
          <span aria-hidden="true">⌄</span>
        </div>

      </div>
    </section>
  );
}
