// src/components/heroTimeline.js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Creates the exact scroll-driven hero timeline strictly mapped to uProgress.
 * @param {Object} config
 * @param {HTMLElement} config.section - Pinned container (#hero)
 * @param {HTMLElement} config.plane - Plane cutout DOM element
 * @param {HTMLElement[]} config.titleLetters - 'V', 'A', 'Y', 'A' letter elements
 * @param {HTMLElement} config.tagline1 - "Know before you go" element
 * @param {HTMLElement} config.tagline2 - "Step in, step out" element
 * @param {HTMLElement} config.scrollHint - Scroll hint indicator
 * @param {Object} config.heroScene - HeroScene instance (OGL)
 * @param {Function} config.onScene2Change - Callback for ambient objects visibility
 * @param {boolean} config.isMobile - Mobile flag
 * @returns {Object} { kill: Function, refresh: Function }
 */
export function initHeroAnimation({
  section,
  plane,
  titleLetters = [],
  tagline1,
  tagline2,
  scrollHint,
  heroScene,
  onScene2Change,
  isMobile = false,
}) {
  gsap.registerPlugin(ScrollTrigger);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let targetProgress = 0;
  let currentProgress = 0;
  let animId = null;
  let isVisible = true;
  let lastTimeMs = performance.now();
  let lastFrameTime = performance.now();

  // Pin runway duration: desktop ~420vh (+=320%), mobile ~300vh (+=200%)
  const pinDistance = isMobile ? '+=200%' : '+=320%';

  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: pinDistance,
    scrub: true,
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      targetProgress = self.progress;
    },
  });

  // IntersectionObserver: pause rendering when offscreen
  let observer = null;
  if (typeof IntersectionObserver !== 'undefined' && section) {
    observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.01 }
    );
    observer.observe(section);
  }

  // Pre-set plane 100% static at original bbox
  if (plane) {
    gsap.set(plane, {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: 1,
      filter: 'brightness(1) saturate(1)',
      force3D: true,
      transformOrigin: '50% 50%',
    });
  }

  // Pre-set title letters and taglines inside their overflow masks
  titleLetters.forEach((el) => {
    if (el) gsap.set(el, { yPercent: 110, opacity: 0, force3D: true });
  });

  if (tagline1) gsap.set(tagline1, { yPercent: 110, opacity: 0, force3D: true });
  if (tagline2) gsap.set(tagline2, { yPercent: 110, opacity: 0, force3D: true });

  // ─────────────────────────────────────────────────────────────
  // Frame-Rate Independent Damped Loop:
  // uProgress += (target - uProgress) * (1.0 - Math.exp(-dt * 8.0))
  // ─────────────────────────────────────────────────────────────
  function tick(now) {
    animId = requestAnimationFrame(tick);

    if (!isVisible) return;

    const dt = Math.min(0.1, Math.max(0.001, (now - lastTimeMs) * 0.001));
    lastTimeMs = now;

    const delta = targetProgress - currentProgress;
    const isMoving = Math.abs(delta) > 0.0001;

    // Rate-limit idle rendering to 30fps to save mobile battery
    if (!isMoving && !prefersReducedMotion) {
      if (now - lastFrameTime < 33) return;
    }
    lastFrameTime = now;

    const dampFactor = 1.0 - Math.exp(-dt * 8.0);
    currentProgress += delta * dampFactor;
    if (!isMoving) {
      currentProgress = targetProgress;
    }

    const p = currentProgress;
    const timeSec = now * 0.001;

    // ── 1. EXACT MOTION TABLE VARIABLES (strictly function of uProgress) ──

    // A) Camera Zoom:
    // p=0.00: 1.00 | p=0.25: 1.06 | p=0.50: 1.14 | p=0.58: 1.18 | p=0.72: 1.22
    let zoomVal = 1.00;
    if (p <= 0.25) {
      zoomVal = 1.00 + (p / 0.25) * 0.06;
    } else if (p <= 0.50) {
      zoomVal = 1.06 + ((p - 0.25) / 0.25) * 0.08;
    } else if (p <= 0.58) {
      zoomVal = 1.14 + ((p - 0.50) / 0.08) * 0.04;
    } else if (p <= 0.72) {
      zoomVal = 1.18 + ((p - 0.58) / 0.14) * 0.04;
    } else {
      zoomVal = 1.22;
    }
    if (isMobile) {
      zoomVal = Math.min(zoomVal, 1.15);
    }

    // B) uMix across p=0.50 - 0.72 (gentle crossfade scene2):
    let uMix = 0;
    if (p >= 0.50) {
      const tMix = Math.min(1.0, (p - 0.50) / 0.22);
      uMix = 0.5 - 0.5 * Math.cos(tMix * Math.PI);
    }

    // C) uHaze bell curve: peak 0.14 @ p=0.60 across p=0.50 - 0.72 (never exceeds 0.14):
    let uHaze = 0;
    if (p >= 0.50 && p <= 0.72) {
      const tHaze = (p - 0.50) / 0.22;
      uHaze = Math.sin(tHaze * Math.PI) * 0.14;
    }

    // D) uTilt: scene2 1.10x to 1.00x settles translateY (+0.06 -> 0.0):
    const uTilt = 0.06 * (1.0 - uMix);

    // E) Ambient Objects (balloon + birds):
    // Only show when uMix >= 0.85; immediately false otherwise
    if (onScene2Change) {
      onScene2Change(uMix >= 0.85);
    }

    // ── 2. PLANE MOTION (Strictly Monotonic Scale, Nose Direction Flight) ──
    if (plane) {
      // STATE RESET at p=0: exactly original look, no ghosting
      if (p <= 0.0005) {
        gsap.set(plane, {
          x: 0,
          y: 0,
          scale: 1.00,
          rotation: 0,
          opacity: 1.0,
          filter: 'brightness(1) saturate(1)',
        });
      } else if (p < 0.58) {
        // Plane path: P(t) = P0 + (VP - P0) * sineInOut(t), t = p / 0.58
        const tFlight = Math.min(1.0, p / 0.58);
        const sineInOut = 0.5 * (1.0 - Math.cos(tFlight * Math.PI));

        const targetX = isMobile ? 24 : 27; // in vw
        const targetY = isMobile ? -10 : -7; // in vh

        const curX = targetX * sineInOut;
        const curY = targetY * sineInOut;

        // Monotonic Scale from Motion Table:
        // p=0.00: 1.00 | p=0.25: 0.62 | p=0.50: 0.22 | p=0.58: 0.12
        let curScale = 1.00;
        if (p <= 0.25) {
          curScale = 1.00 - (p / 0.25) * (1.00 - 0.62);
        } else if (p <= 0.50) {
          curScale = 0.62 - ((p - 0.25) / 0.25) * (0.62 - 0.22);
        } else {
          curScale = 0.22 - ((p - 0.50) / 0.08) * (0.22 - 0.12);
        }
        curScale = Math.max(0.12, Math.min(1.00, curScale));

        // Rotation: nose direction angle, max 3 deg
        const curRot = sineInOut * 2.8;

        // Plane Alpha from Table:
        // p <= 0.50: alpha 1.0 | p=0.50 -> 0.58: alpha 1.0 -> 0.0
        let baseAlpha = 1.0;
        if (p > 0.50) {
          const tFade = (p - 0.50) / 0.08;
          baseAlpha = Math.max(0, 1.0 - tFade);
        }

        // Cloud-occlusion: softly dips to ~0.25 when passing through cloud puff around 0.24 - 0.42
        let cloudOcc = 1.0;
        if (p >= 0.24 && p <= 0.42) {
          const tPuff = (p - 0.24) / (0.42 - 0.24);
          const dip = Math.sin(tPuff * Math.PI) * 0.75;
          cloudOcc = 1.0 - dip;
        }

        const finalAlpha = baseAlpha * cloudOcc;

        // Atmospheric perspective: mix toward haze (0 -> 0.45)
        const hazeTint = 1.0 - 0.45 * (p / 0.58);

        gsap.set(plane, {
          x: `${curX}vw`,
          y: `${curY}vh`,
          scale: curScale,
          rotation: curRot,
          opacity: finalAlpha,
          filter: `brightness(${0.96 + 0.04 * hazeTint}) saturate(${hazeTint})`,
        });
      } else {
        gsap.set(plane, { opacity: 0 });
      }
    }

    // ── 3. RENDER OGL SHADER ──
    if (heroScene) {
      heroScene.render({
        progress: p,
        mix: uMix,
        haze: uHaze,
        tilt: uTilt,
        zoom: zoomVal,
        time: prefersReducedMotion ? 0 : timeSec,
      });
    }

    // ── 4. VAYA TITLE & TAGLINES (p=0.72 - 0.95, untouched existing transition) ──
    // Letters 'V', 'A', 'Y', 'A' stagger
    const letterStarts = [0.72, 0.75, 0.78, 0.81];
    titleLetters.forEach((el, idx) => {
      if (!el) return;
      const startP = letterStarts[idx];
      if (p < startP) {
        gsap.set(el, { yPercent: 110, opacity: 0 });
      } else {
        const t = Math.min(1.0, (p - startP) / 0.08);
        const ease = 1 - Math.pow(1 - t, 3); // power3.out
        gsap.set(el, {
          yPercent: (1 - ease) * 110,
          opacity: ease,
        });
      }
    });

    // Tagline 1: "Know before you go" (0.80 -> 0.90)
    if (tagline1) {
      if (p < 0.80) {
        gsap.set(tagline1, { yPercent: 110, opacity: 0 });
      } else {
        const t = Math.min(1.0, (p - 0.80) / 0.10);
        const ease = 1 - Math.pow(1 - t, 3);
        gsap.set(tagline1, {
          yPercent: (1 - ease) * 110,
          opacity: ease,
        });
      }
    }

    // Tagline 2: "Step in, step out" (0.85 -> 0.95)
    if (tagline2) {
      if (p < 0.85) {
        gsap.set(tagline2, { yPercent: 110, opacity: 0 });
      } else {
        const t = Math.min(1.0, (p - 0.85) / 0.10);
        const ease = 1 - Math.pow(1 - t, 3);
        gsap.set(tagline2, {
          yPercent: (1 - ease) * 110,
          opacity: ease,
        });
      }
    }

    // ── 5. SCROLL HINT (Hides on scroll p > 0.05) ──
    if (scrollHint) {
      if (p <= 0.05) {
        const hintOpacity = Math.max(0, 1.0 - p / 0.05) * 0.75;
        scrollHint.style.opacity = `${hintOpacity}`;
        scrollHint.style.display = hintOpacity <= 0.01 ? 'none' : 'flex';
      } else {
        scrollHint.style.opacity = '0';
        scrollHint.style.display = 'none';
      }
    }
  }

  animId = requestAnimationFrame(tick);

  return {
    kill: () => {
      if (animId) cancelAnimationFrame(animId);
      if (st) st.kill();
      if (observer) observer.disconnect();
    },
    refresh: () => {
      ScrollTrigger.refresh();
    },
  };
}
