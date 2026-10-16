// src/components/heroTimeline.js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Creates the scroll-driven hero timeline and renders the OGL shader frame.
 * @param {Object} config
 * @param {HTMLElement} config.section - Pinned container (#hero)
 * @param {HTMLCanvasElement} config.canvas - WebGL canvas
 * @param {HTMLElement} config.plane - Plane cutout DOM element
 * @param {HTMLElement[]} config.titleLetters - Individual 'V', 'A', 'Y', 'A' letter elements
 * @param {HTMLElement} config.tagline1 - "Know before you go" element
 * @param {HTMLElement} config.tagline2 - "Step in, step out" element
 * @param {HTMLElement} config.scrollHint - Scroll hint indicator
 * @param {Object} config.oglCtx - OGL renderer, program, mesh
 * @param {boolean} config.isMobile - Mobile flag
 * @returns {Object} { kill: Function, refresh: Function }
 */
export function initHeroAnimation({
  section,
  canvas,
  plane,
  titleLetters = [],
  tagline1,
  tagline2,
  scrollHint,
  oglCtx,
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

  // IntersectionObserver: render only when hero is in viewport
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

  // Initial states
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

  // Pre-set title letters and taglines hidden below their overflow masks
  titleLetters.forEach((el) => {
    if (el) gsap.set(el, { yPercent: 110, opacity: 0, force3D: true });
  });

  if (tagline1) gsap.set(tagline1, { yPercent: 110, opacity: 0, force3D: true });
  if (tagline2) gsap.set(tagline2, { yPercent: 110, opacity: 0, force3D: true });

  // ─────────────────────────────────────────────────────────────
  // Smooth Damped Animation Loop (uProgress += (target - uProgress) * 0.12)
  // ─────────────────────────────────────────────────────────────
  function tick(now) {
    animId = requestAnimationFrame(tick);

    if (!isVisible) return;

    const delta = targetProgress - currentProgress;
    const isScrollActive = Math.abs(delta) > 0.0001;

    // Rate-limit idle rendering to 30fps to save mobile battery
    if (!isScrollActive && !prefersReducedMotion) {
      if (now - lastFrameTime < 33) return;
    }
    lastFrameTime = now;

    // Critical damping
    currentProgress += delta * 0.12;
    if (!isScrollActive) {
      currentProgress = targetProgress;
    }

    const p = currentProgress;
    const timeSec = now * 0.001;

    // ── 1. Plane Movement (Nose direction: left-bottom to right-up valley) ──
    // At scroll = 0, plane is 100% STATIC (no idle bob, no float, no bank)
    if (plane) {
      if (p <= 0.0005) {
        gsap.set(plane, {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          opacity: 1,
          filter: 'brightness(1) saturate(1)',
        });
      } else if (p < 0.52) {
        // Plane travels toward vanishing point over p 0.00 -> 0.50
        const tFlight = Math.min(1.0, p / 0.50);
        // Strictly monotonic easing (power1.out feel)
        const easeFlight = Math.pow(tFlight, 0.88);

        const targetX = isMobile ? 24 : 27; // in vw
        const targetY = isMobile ? -10 : -7; // in vh

        const curX = targetX * easeFlight;
        const curY = targetY * easeFlight;
        // Strictly monotonic decreasing scale: 1.0 -> 0.15 (never grows!)
        const curScale = 1.0 - (1.0 - 0.15) * easeFlight;
        const curRot = 2 * easeFlight; // 0 to 2deg

        // Atmospheric perspective: tint toward haze as it recedes
        const hazeMix = 1.0 - 0.45 * easeFlight;

        // Plane passes behind cloud puff around p 0.25 - 0.42: softly dip alpha
        let cloudPuffAlpha = 1.0;
        if (p >= 0.24 && p <= 0.42) {
          const puffNorm = (p - 0.24) / (0.42 - 0.24);
          const dip = Math.sin(puffNorm * Math.PI) * 0.55;
          cloudPuffAlpha = 1.0 - dip;
        }

        // Final fade out strictly in the last 15% (0.35 -> 0.50)
        let curOpacity = 1.0;
        if (p >= 0.35) {
          const tFade = (p - 0.35) / 0.15;
          curOpacity = Math.max(0, 1.0 - tFade);
        }

        const finalPlaneOpacity = curOpacity * cloudPuffAlpha;

        gsap.set(plane, {
          x: `${curX}vw`,
          y: `${curY}vh`,
          scale: curScale,
          rotation: curRot,
          opacity: finalPlaneOpacity,
          filter: `brightness(${0.95 + 0.05 * hazeMix}) saturate(${hazeMix})`,
        });
      } else {
        gsap.set(plane, { opacity: 0 });
      }
    }

    // ── 2. Camera Push, Haze Fade & Scene2 Tilt Progress ──
    // 0.00 - 0.50: camera push 0 -> 0.60
    // 0.40 - 0.75: haze fade + uMix 0 -> 1 + scene2 tilt up (+0.06 -> 0)
    let dollyProgress = 0;
    if (p <= 0.50) {
      dollyProgress = (p / 0.50) * 0.60;
    } else {
      const tPost = Math.min(1.0, (p - 0.50) / 0.35);
      dollyProgress = 0.60 + tPost * 0.25;
    }

    // uMix: 0 -> 1 across p 0.40 -> 0.75
    let uMix = 0;
    if (p >= 0.40) {
      const tMix = Math.min(1.0, (p - 0.40) / 0.35);
      uMix = 0.5 - 0.5 * Math.cos(tMix * Math.PI);
    }

    // uHaze: 0 -> 0.50 (peak ~0.58) -> 0 across 0.40 -> 0.75
    let uHaze = 0;
    if (p >= 0.40 && p <= 0.75) {
      const tHaze = (p - 0.40) / 0.35;
      uHaze = Math.sin(tHaze * Math.PI) * 0.50;
    }

    // uTilt: scene2 down-to-up movie camera pan (+0.06 -> 0.0)
    let uTilt = 0.06 * (1.0 - uMix);

    // Update OGL Shader uniforms
    if (oglCtx && oglCtx.program && oglCtx.renderer) {
      const { program, renderer, mesh } = oglCtx;
      program.uniforms.uProgress.value = dollyProgress;
      program.uniforms.uMix.value = uMix;
      program.uniforms.uHaze.value = uHaze;
      program.uniforms.uTilt.value = uTilt;
      program.uniforms.uTime.value = prefersReducedMotion ? 0 : timeSec;
      renderer.render({ scene: mesh });
    }

    // ── 3. Movie-Style DOWN TO UP Title Reveal (0.62 -> 0.92) ──
    // Letter-by-letter stagger for 'V', 'A', 'Y', 'A'
    const letterStarts = [0.62, 0.67, 0.72, 0.77];
    titleLetters.forEach((el, idx) => {
      if (!el) return;
      const startP = letterStarts[idx];
      if (p < startP) {
        gsap.set(el, { yPercent: 110, opacity: 0 });
      } else {
        const t = Math.min(1.0, (p - startP) / 0.10);
        // power3.out easing: 1 - (1 - t)^3
        const ease = 1 - Math.pow(1 - t, 3);
        gsap.set(el, {
          yPercent: (1 - ease) * 110,
          opacity: ease,
        });
      }
    });

    // Tagline 1: "Know before you go" (0.78 -> 0.88)
    if (tagline1) {
      if (p < 0.78) {
        gsap.set(tagline1, { yPercent: 110, opacity: 0 });
      } else {
        const t = Math.min(1.0, (p - 0.78) / 0.10);
        const ease = 1 - Math.pow(1 - t, 3);
        gsap.set(tagline1, {
          yPercent: (1 - ease) * 110,
          opacity: ease,
        });
      }
    }

    // Tagline 2: "Step in, step out" (0.84 -> 0.94)
    if (tagline2) {
      if (p < 0.84) {
        gsap.set(tagline2, { yPercent: 110, opacity: 0 });
      } else {
        const t = Math.min(1.0, (p - 0.84) / 0.10);
        const ease = 1 - Math.pow(1 - t, 3);
        gsap.set(tagline2, {
          yPercent: (1 - ease) * 110,
          opacity: ease,
        });
      }
    }

    // ── 4. Scroll Indicator (Disappears as soon as scroll begins p > 0.05) ──
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
