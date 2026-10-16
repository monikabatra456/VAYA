// src/components/heroTimeline.js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Creates the scroll-driven hero timeline and drives OGL rendering and DOM layers.
 * @param {Object} config
 * @param {HTMLElement} config.section - Pinned container (#hero)
 * @param {HTMLElement} config.plane - Plane cutout DOM element
 * @param {HTMLElement[]} config.titleLetters - 'V', 'A', 'Y', 'A' letter elements
 * @param {HTMLElement} config.tagline1 - "Know before you go" element
 * @param {HTMLElement} config.tagline2 - "Step in, step out" element
 * @param {HTMLElement} config.scrollHint - Scroll hint indicator
 * @param {Object} config.heroScene - HeroScene instance (OGL)
 * @param {Function} config.onScene2Change - Callback when scene2 becomes active
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

  // IntersectionObserver: pauses rendering when offscreen
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

  // Initial states: plane is 100% static at scroll = 0
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

    // Rate-limit idle rendering to 30fps to save battery on mobile
    if (!isMoving && !prefersReducedMotion) {
      if (now - lastFrameTime < 33) return;
    }
    lastFrameTime = now;

    // Damping formula requested: (1.0 - Math.exp(-dt * 8.0))
    const dampFactor = 1.0 - Math.exp(-dt * 8.0);
    currentProgress += delta * dampFactor;
    if (!isMoving) {
      currentProgress = targetProgress;
    }

    const p = currentProgress;
    const timeSec = now * 0.001;

    // ── 1. Plane Movement (Nose direction: left-bottom to right-up valley) ──
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
        // Plane travels toward valley vanishing point over p 0.00 -> 0.50
        const tFlight = Math.min(1.0, p / 0.50);
        const easeFlight = Math.pow(tFlight, 0.88);

        const targetX = isMobile ? 24 : 27; // in vw
        const targetY = isMobile ? -10 : -7; // in vh

        const curX = targetX * easeFlight;
        const curY = targetY * easeFlight;
        // Strictly monotonic decreasing scale: 1.0 -> 0.12 (never grows!)
        const curScale = 1.0 - (1.0 - 0.12) * easeFlight;
        const curRot = 2 * easeFlight; // 0 to 2 deg

        // Atmospheric perspective: tint toward haze as plane recedes
        const hazeMix = 1.0 - 0.45 * easeFlight;

        // Cloud-occlusion: plane alpha softly dips to ~0.20 when passing through mountain cloud puff
        let cloudPuffAlpha = 1.0;
        if (p >= 0.22 && p <= 0.44) {
          const puffNorm = (p - 0.22) / (0.44 - 0.22);
          const dip = Math.sin(puffNorm * Math.PI) * 0.80;
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

    // ── 2. Camera Push, Haze & Scene2 Crossfade Progress ──
    // 0.00 - 0.50: plane flies + camera push 0 -> 0.60
    let dollyProgress = 0;
    if (p <= 0.50) {
      dollyProgress = (p / 0.50) * 0.60;
    } else {
      const tPost = Math.min(1.0, (p - 0.50) / 0.35);
      dollyProgress = 0.60 + tPost * 0.25;
    }

    // uMix: 0 -> 1 across 0.40 -> 0.75
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

    // uTilt: scene2 translateY pan (+0.06 -> 0.0)
    let uTilt = 0.06 * (1.0 - uMix);

    // Notify scene2 active for ambient birds & hot air balloon
    if (onScene2Change) {
      onScene2Change(p >= 0.48);
    }

    // Render OGL shader
    if (heroScene) {
      heroScene.render({
        progress: dollyProgress,
        mix: uMix,
        haze: uHaze,
        tilt: uTilt,
        time: prefersReducedMotion ? 0 : timeSec,
      });
    }

    // ── 3. VAYA Title & Taglines (Untouched transition, triggers as scene2 arrives) ──
    const letterStarts = [0.62, 0.67, 0.72, 0.77];
    titleLetters.forEach((el, idx) => {
      if (!el) return;
      const startP = letterStarts[idx];
      if (p < startP) {
        gsap.set(el, { yPercent: 110, opacity: 0 });
      } else {
        const t = Math.min(1.0, (p - startP) / 0.10);
        const ease = 1 - Math.pow(1 - t, 3); // power3.out
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

    // ── 4. Scroll Indicator: Disappears as soon as scroll begins (p > 0.05) ──
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
