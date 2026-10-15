// src/components/heroTimeline.js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Creates the scroll-driven hero timeline and renders the OGL shader frame.
 * @param {Object} config
 * @param {HTMLElement} config.section - Pinned container (#hero)
 * @param {HTMLCanvasElement} config.canvas - WebGL canvas
 * @param {HTMLElement} config.plane - Plane cutout DOM element
 * @param {HTMLElement} config.title - VAYA title element
 * @param {HTMLElement} config.taglines - Taglines container
 * @param {HTMLElement} config.scrollHint - Scroll hint indicator
 * @param {Object} config.oglCtx - OGL renderer, program, mesh
 * @param {boolean} config.isMobile - Mobile flag
 * @returns {Object} { kill: Function, refresh: Function }
 */
export function initHeroAnimation({
  section,
  canvas,
  plane,
  title,
  taglines,
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

  // Vanishing point constants
  const vp = isMobile ? [0.55, 0.48] : [0.62, 0.45];
  const vp2 = isMobile ? [0.52, 0.52] : [0.57, 0.54];

  // Pin runway: desktop ~450vh (+=350%), mobile ~300vh (+=200%)
  const pinDistance = isMobile ? '+=200%' : '+=350%';

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

  // Pre-set elements
  if (plane) {
    gsap.set(plane, {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: 1,
      force3D: true,
      transformOrigin: '50% 50%',
    });
  }

  if (title) {
    gsap.set(title, {
      opacity: 0,
      y: isMobile ? 24 : 20,
      force3D: true,
    });
  }

  if (taglines) {
    gsap.set(taglines, {
      opacity: 0,
      y: isMobile ? 24 : 20,
      force3D: true,
    });
  }

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

    // ── 1. Plane Movement ──
    // At scroll=0, plane is 100% STATIC (no idle movement, no bobbing)
    if (plane) {
      if (p <= 0.0005) {
        gsap.set(plane, {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          opacity: 1,
        });
      } else if (p < 0.52) {
        // Plane travels toward vanishing point over p 0.00 -> 0.50
        const tFlight = Math.min(1.0, p / 0.50);
        const easeFlight = Math.pow(tFlight, 0.85); // power1.out feel

        const targetX = isMobile ? 24 : 27; // in vw
        const targetY = isMobile ? -10 : -7; // in vh

        const curX = targetX * easeFlight;
        const curY = targetY * easeFlight;
        const curScale = 1.0 - (1.0 - 0.15) * easeFlight;
        const curRot = 2 * easeFlight; // 0 to 2deg

        // Opacity 1 -> 0 strictly in the last 15% (0.35 -> 0.50)
        let curOpacity = 1.0;
        if (p >= 0.35) {
          const tFade = (p - 0.35) / 0.15;
          curOpacity = Math.max(0, 1.0 - tFade);
        }

        gsap.set(plane, {
          x: `${curX}vw`,
          y: `${curY}vh`,
          scale: curScale,
          rotation: curRot,
          opacity: curOpacity,
        });
      } else {
        gsap.set(plane, { opacity: 0 });
      }
    }

    // ── 2. Camera Dolly & Scene Mix Progress ──
    // 0.00 - 0.50: plane door jaata hai + camera dolly 0 -> 0.60
    // 0.40 - 0.75: uMix 0 -> 1 (crossfade scene2) + dolly 0.60 -> 0.85
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
      uMix = Math.min(1.0, (p - 0.40) / 0.35);
      // Smooth cosine interpolation
      uMix = 0.5 - 0.5 * Math.cos(uMix * Math.PI);
    }

    // Update OGL Shader uniforms
    if (oglCtx && oglCtx.program && oglCtx.renderer) {
      const { program, renderer, mesh } = oglCtx;
      program.uniforms.uProgress.value = dollyProgress;
      program.uniforms.uMix.value = uMix;
      program.uniforms.uTime.value = prefersReducedMotion ? 0 : timeSec;
      renderer.render({ scene: mesh });
    }

    // ── 3. Title & Taglines (0.65 -> 0.90) ──
    if (title) {
      if (p < 0.62) {
        gsap.set(title, { opacity: 0, y: isMobile ? 24 : 20 });
      } else {
        const tTitle = Math.min(1.0, (p - 0.62) / 0.20);
        const easeTitle = 1 - Math.pow(1 - tTitle, 2);
        gsap.set(title, {
          opacity: easeTitle,
          y: (1 - easeTitle) * (isMobile ? 24 : 20),
        });
      }
    }

    if (taglines) {
      const tagStart = isMobile ? 0.68 : 0.68;
      if (p < tagStart) {
        gsap.set(taglines, { opacity: 0, y: isMobile ? 24 : 20 });
      } else {
        const tTag = Math.min(1.0, (p - tagStart) / 0.20);
        const easeTag = 1 - Math.pow(1 - tTag, 2);
        gsap.set(taglines, {
          opacity: easeTag,
          y: (1 - easeTag) * (isMobile ? 24 : 20),
        });
      }
    }

    // ── 4. Scroll Indicator ──
    // BUG FIX: Must fully hide once p > 0.05 and never show while scrolling down
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
