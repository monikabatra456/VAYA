// src/components/on-its-way/onItsWayTimeline.ts
// Master GSAP animation timelines for the "On Its Way" page patch.

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RESTING_PLANE } from './pathConstants';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface TimelineElements {
  container: HTMLElement | null;
  svg: SVGSVGElement | null;
  bg: HTMLElement | null;
  navbar: HTMLElement | null;
  eyebrowLeftLine: HTMLElement | null;
  eyebrowRightLine: HTMLElement | null;
  eyebrowText: HTMLElement | null;
  headlineSerif: HTMLElement | null;
  headlineScript: HTMLElement | null;
  swooshPath: SVGPathElement | null;
  subtextLines: HTMLElement[];
  flightPath: SVGPathElement | null;
  maskPath: SVGPathElement | null;
  planeWrapper: HTMLElement | null;
  planeFloat: HTMLElement | null;
  contrailStreaks: HTMLElement[];
  cloudsLayer: HTMLElement | null;
  comingSoonLineLeft: HTMLElement | null;
  comingSoonLineRight: HTMLElement | null;
  comingSoonText: HTMLElement | null;
  goldDivider: HTMLElement | null;
}

/**
 * Maps an SVG viewBox coordinate (1707x921 with preserveAspectRatio="xMidYMid slice")
 * to actual pixel coordinates relative to the container element.
 */
export function getSvgPointInContainer(
  x: number,
  y: number,
  svg: SVGSVGElement | null,
  container: HTMLElement | null
): { x: number; y: number } {
  if (!svg || !container) return { x, y };

  try {
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const rect = container.getBoundingClientRect();
      return {
        x: ctm.a * x + ctm.c * y + ctm.e - rect.left,
        y: ctm.b * x + ctm.d * y + ctm.f - rect.top,
      };
    }
  } catch {
    // fallback if CTM not yet available
  }

  const rect = container.getBoundingClientRect();
  const s = Math.max(rect.width / 1707, rect.height / 921);
  const ox = (rect.width - 1707 * s) / 2;
  const oy = (rect.height - 921 * s) / 2;
  return {
    x: ox + x * s,
    y: oy + y * s,
  };
}

/**
 * Builds and starts the load animation sequence, flight trail, idle float, and Coming Soon reveal.
 */
export function createOnItsWayTimeline(
  elements: TimelineElements,
  isReducedMotion: boolean = false
) {
  const {
    container,
    svg,
    bg,
    navbar,
    eyebrowLeftLine,
    eyebrowRightLine,
    eyebrowText,
    headlineSerif,
    headlineScript,
    swooshPath,
    subtextLines,
    flightPath,
    maskPath,
    planeWrapper,
    planeFloat,
    contrailStreaks,
    cloudsLayer,
    comingSoonLineLeft,
    comingSoonLineRight,
    comingSoonText,
    goldDivider,
  } = elements;

  // Configure ticker lagSmoothing for this page's timeline
  gsap.ticker.lagSmoothing(500, 33);

  // Path lengths
  const flightLength = flightPath ? flightPath.getTotalLength() : 1200;
  const swooshLength = swooshPath ? swooshPath.getTotalLength() : 200;

  // Setup initial path dash offsets
  if (swooshPath) {
    swooshPath.style.strokeDasharray = `${swooshLength}`;
    swooshPath.style.strokeDashoffset = `${swooshLength}`;
  }

  if (maskPath) {
    maskPath.style.strokeDasharray = `${flightLength}`;
    maskPath.style.strokeDashoffset = `${flightLength}`;
  }

  const REST_ROT = RESTING_PLANE.rotation; // +6deg
  const MIN_ROT = REST_ROT - 14; // -8deg
  const MAX_ROT = REST_ROT + 10; // +16deg

  // -------------------------------------------------------------
  // REDUCED MOTION: Skip animation, reveal final state immediately
  // -------------------------------------------------------------
  if (isReducedMotion) {
    if (bg) gsap.set(bg, { opacity: 1 });
    if (navbar) gsap.set(navbar, { opacity: 1 });
    if (eyebrowLeftLine) gsap.set(eyebrowLeftLine, { scaleX: 1, opacity: 0.9 });
    if (eyebrowRightLine) gsap.set(eyebrowRightLine, { scaleX: 1, opacity: 0.9 });
    if (eyebrowText) gsap.set(eyebrowText, { opacity: 1 });
    if (headlineSerif) gsap.set(headlineSerif, { opacity: 1, y: 0 });
    if (headlineScript) gsap.set(headlineScript, { opacity: 1, y: 0 });
    if (swooshPath) gsap.set(swooshPath, { strokeDashoffset: 0 });
    subtextLines.forEach((line) => line && gsap.set(line, { opacity: 1, y: 0 }));

    if (maskPath) maskPath.style.strokeDashoffset = '0';
    if (planeWrapper && flightPath) {
      const pt = flightPath.getPointAtLength(flightLength);
      const pixelPos = getSvgPointInContainer(pt.x, pt.y, svg, container);
      gsap.set(planeWrapper, {
        transformOrigin: '3% 78%',
        xPercent: -3,
        yPercent: -78,
        x: pixelPos.x,
        y: pixelPos.y,
        rotation: REST_ROT,
        force3D: true,
        opacity: 1,
      });
    }

    if (contrailStreaks.length > 0) {
      gsap.set(contrailStreaks, { opacity: 0.35 });
    }

    if (comingSoonLineLeft) gsap.set(comingSoonLineLeft, { scaleX: 1, opacity: 0.7 });
    if (comingSoonLineRight) gsap.set(comingSoonLineRight, { scaleX: 1, opacity: 0.7 });
    if (comingSoonText) gsap.set(comingSoonText, { opacity: 0.92, y: 0 });
    if (goldDivider) gsap.set(goldDivider, { opacity: 0.85 });

    return {
      masterTl: null,
      idleFloatAnim: null,
      cloudsAnim: null,
      scrollTrigger: null,
    };
  }

  // -------------------------------------------------------------
  // INITIAL HIDDEN STATES (Set via GSAP inside context)
  // -------------------------------------------------------------
  if (bg) gsap.set(bg, { opacity: 0 });
  if (navbar) gsap.set(navbar, { opacity: 0 });
  if (eyebrowLeftLine) gsap.set(eyebrowLeftLine, { scaleX: 0, opacity: 0 });
  if (eyebrowRightLine) gsap.set(eyebrowRightLine, { scaleX: 0, opacity: 0 });
  if (eyebrowText) gsap.set(eyebrowText, { opacity: 0, letterSpacing: '0.22em' });
  if (headlineSerif) gsap.set(headlineSerif, { opacity: 0, y: 16 });
  if (headlineScript) gsap.set(headlineScript, { opacity: 0, y: 16 });
  subtextLines.forEach((line) => {
    if (line) gsap.set(line, { opacity: 0, y: 12 });
  });

  if (planeWrapper) {
    gsap.set(planeWrapper, {
      transformOrigin: '3% 78%',
      xPercent: -3,
      yPercent: -78,
      force3D: true,
      opacity: 0,
    });
  }

  if (planeFloat) {
    gsap.set(planeFloat, { y: 0 });
  }

  if (contrailStreaks.length > 0) {
    gsap.set(contrailStreaks, { opacity: 0 });
  }

  // Bottom Coming Soon initial states
  if (comingSoonLineLeft) gsap.set(comingSoonLineLeft, { scaleX: 0, opacity: 0 });
  if (comingSoonLineRight) gsap.set(comingSoonLineRight, { scaleX: 0, opacity: 0 });
  if (comingSoonText) gsap.set(comingSoonText, { opacity: 0, y: 20 });
  if (goldDivider) gsap.set(goldDivider, { opacity: 0 });

  // -------------------------------------------------------------
  // MASTER TIMELINE
  // -------------------------------------------------------------
  const masterTl = gsap.timeline({
    paused: true,
    defaults: { ease: 'power2.out' },
  });

  // t=0.0s background fades in (0.9s)
  if (bg) {
    masterTl.to(bg, { opacity: 1, duration: 0.9, ease: 'sine.inOut' }, 0.0);
  }

  // t=0.3s navbar fades in (0.6s)
  if (navbar) {
    masterTl.to(navbar, { opacity: 1, duration: 0.6, ease: 'sine.out' }, 0.3);
  }

  // t=0.5s eyebrow: side lines scale-x from 0 to 1, text fades in (0.7s)
  if (eyebrowLeftLine && eyebrowRightLine) {
    masterTl.to(
      [eyebrowLeftLine, eyebrowRightLine],
      {
        scaleX: 1,
        opacity: 0.9,
        duration: 0.7,
        ease: 'power2.out',
      },
      0.5
    );
  }
  if (eyebrowText) {
    masterTl.to(
      eyebrowText,
      {
        opacity: 1,
        letterSpacing: '0.28em',
        duration: 0.7,
        ease: 'power2.out',
      },
      0.5
    );
  }

  // t=0.7s "On Its" fades + rises 16px (0.9s)
  if (headlineSerif) {
    masterTl.to(
      headlineSerif,
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power2.out',
      },
      0.7
    );
  }

  // "Way" follows 0.25s later (t=0.95s)
  if (headlineScript) {
    masterTl.to(
      headlineScript,
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power2.out',
      },
      0.95
    );
  }

  // swoosh underline draws left-to-right (0.8s) right after "Way" lands (~ t=1.2s)
  if (swooshPath) {
    masterTl.to(
      swooshPath,
      {
        strokeDashoffset: 0,
        duration: 0.8,
        ease: 'sine.inOut',
      },
      1.2
    );
  }

  // t=1.5s subtext fades in line by line (0.7s each, 0.15s stagger)
  if (subtextLines.length > 0) {
    masterTl.to(
      subtextLines,
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power2.out',
      },
      1.5
    );
  }

  // -------------------------------------------------------------
  // t=2.0s FLIGHT ANIMATION: ONE gsap tween (5.5s, ease sine.inOut)
  // Rest rotation: +6deg. Lerp rotation each tick, clamp [-8deg, +16deg],
  // and ease to rest in the last 0.6s.
  // -------------------------------------------------------------
  let currentAngle = REST_ROT;
  const flightProgress = { value: 0 };
  let idleFloatAnim: gsap.core.Tween | null = null;
  let hasLanded = false;

  if (flightPath && maskPath && planeWrapper) {
    masterTl.to(
      flightProgress,
      {
        value: 1,
        duration: 6.0,
        ease: 'power1.inOut',
        onStart: () => {
          planeWrapper.style.willChange = 'transform';
          gsap.set(planeWrapper, { opacity: 1 });
        },
        onUpdate: () => {
          const progress = flightProgress.value;
          const currentDist = progress * flightLength;
          const pt = flightPath.getPointAtLength(currentDist);
          const pixelPos = getSvgPointInContainer(pt.x, pt.y, svg, container);

          // Animate rotation gently from +8deg (climbing) to +2deg (leveling off) across the 6s
          const rotationAngle = 8 - 6 * progress;

          // Transform only: x, y, rotation (force3D: true)
          gsap.set(planeWrapper, {
            x: pixelPos.x,
            y: pixelPos.y,
            rotation: rotationAngle,
            force3D: true,
          });

          // Reveal dashed trail via mask stroke-dashoffset smoothly
          const offset = flightLength * (1 - progress);
          maskPath.style.strokeDashoffset = `${offset.toFixed(2)}`;
        },
        onComplete: () => {
          hasLanded = true;
          planeWrapper.style.willChange = 'auto';

          // Snap to resting position
          const pt = flightPath.getPointAtLength(flightLength);
          const pixelPos = getSvgPointInContainer(pt.x, pt.y, svg, container);
          gsap.set(planeWrapper, {
            x: pixelPos.x,
            y: pixelPos.y,
            rotation: REST_ROT,
            force3D: true,
          });
          maskPath.style.strokeDashoffset = '0';

          // After landing: continuous float (+-3px, 9s round trip cycle, sine.inOut) and tiny breathing scale (1 to 1.01)
          if (planeFloat) {
            idleFloatAnim = gsap.to(planeFloat, {
              y: 3,
              scale: 1.01,
              duration: 4.5,
              ease: 'sine.inOut',
              yoyo: true,
              repeat: -1,
            });
          }
        },
      },
      2.0
    );
  }

  // -------------------------------------------------------------
  // CONTRAILS: Fade in once the plane arrives (t=7.55s)
  // -------------------------------------------------------------
  if (contrailStreaks.length > 0) {
    masterTl.to(
      contrailStreaks,
      {
        opacity: 0.35,
        duration: 1.2,
        ease: 'power2.out',
      },
      7.55
    );
  }

  // -------------------------------------------------------------
  // "COMING SOON" REVEAL: Plays once after plane lands (t=7.55s)
  // -------------------------------------------------------------
  if (comingSoonLineLeft && comingSoonLineRight) {
    masterTl.to(
      [comingSoonLineLeft, comingSoonLineRight],
      {
        scaleX: 1,
        opacity: 0.7,
        duration: 0.8,
        ease: 'power2.out',
      },
      7.55
    );
  }

  if (comingSoonText) {
    masterTl.to(
      comingSoonText,
      {
        opacity: 0.92,
        y: 0,
        duration: 1.1,
        ease: 'power2.out',
      },
      7.6
    );
  }

  if (goldDivider) {
    masterTl.to(
      goldDivider,
      {
        opacity: 0.85,
        duration: 0.8,
        ease: 'power2.out',
      },
      8.1
    );
  }

  // -------------------------------------------------------------
  // CLOUDS FRONT: subtle horizontal drift and tiny scale
  // -------------------------------------------------------------
  let cloudsAnim: gsap.core.Tween | null = null;
  if (cloudsLayer) {
    cloudsAnim = gsap.to(cloudsLayer, {
      x: 14,
      scale: 1.02,
      duration: 35.0,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  // Helper to reset elements to their initial hidden states
  const resetElements = () => {
    flightProgress.value = 0;
    currentAngle = REST_ROT;
    hasLanded = false;
    if (idleFloatAnim) {
      idleFloatAnim.kill();
      idleFloatAnim = null;
    }
    if (bg) gsap.set(bg, { opacity: 0 });
    if (navbar) gsap.set(navbar, { opacity: 0 });
    if (eyebrowLeftLine) gsap.set(eyebrowLeftLine, { scaleX: 0, opacity: 0 });
    if (eyebrowRightLine) gsap.set(eyebrowRightLine, { scaleX: 0, opacity: 0 });
    if (eyebrowText) gsap.set(eyebrowText, { opacity: 0, letterSpacing: '0.22em' });
    if (headlineSerif) gsap.set(headlineSerif, { opacity: 0, y: 16 });
    if (headlineScript) gsap.set(headlineScript, { opacity: 0, y: 16 });
    if (swooshPath) swooshPath.style.strokeDashoffset = `${swooshLength}`;
    if (maskPath) maskPath.style.strokeDashoffset = `${flightLength}`;
    subtextLines.forEach((line) => {
      if (line) gsap.set(line, { opacity: 0, y: 12 });
    });
    if (planeWrapper) {
      planeWrapper.style.willChange = 'auto';
      gsap.set(planeWrapper, { opacity: 0 });
    }
    if (planeFloat) {
      gsap.set(planeFloat, { y: 0 });
    }
    if (contrailStreaks.length > 0) {
      gsap.set(contrailStreaks, { opacity: 0 });
    }
    if (comingSoonLineLeft) gsap.set(comingSoonLineLeft, { scaleX: 0, opacity: 0 });
    if (comingSoonLineRight) gsap.set(comingSoonLineRight, { scaleX: 0, opacity: 0 });
    if (comingSoonText) gsap.set(comingSoonText, { opacity: 0, y: 20 });
    if (goldDivider) gsap.set(goldDivider, { opacity: 0 });
  };

  // -------------------------------------------------------------
  // ScrollTrigger: Bound to section entering viewport (start: "top 60%")
  // On leave/leave-back, reset so it replays every time user comes to this page.
  // -------------------------------------------------------------
  let st: ScrollTrigger | null = null;
  if (container) {
    st = ScrollTrigger.create({
      trigger: container,
      start: 'top 60%',
      onEnter: () => {
        masterTl.restart();
      },
      onEnterBack: () => {
        masterTl.restart();
      },
      onLeave: () => {
        masterTl.pause(0);
        resetElements();
      },
      onLeaveBack: () => {
        masterTl.pause(0);
        resetElements();
      },
    });

    ScrollTrigger.refresh();
  }

  // Resize handler to keep the resting plane precisely attached on window resize
  const handleResize = () => {
    if (planeWrapper && flightPath && (hasLanded || isReducedMotion)) {
      const pt = flightPath.getPointAtLength(flightLength);
      const pixelPos = getSvgPointInContainer(pt.x, pt.y, svg, container);
      gsap.set(planeWrapper, {
        x: pixelPos.x,
        y: pixelPos.y,
        rotation: REST_ROT,
        force3D: true,
      });
    }
  };

  window.addEventListener('resize', handleResize);

  return {
    masterTl,
    idleFloatAnim,
    cloudsAnim,
    scrollTrigger: st,
    cleanup: () => {
      window.removeEventListener('resize', handleResize);
      if (st) st.kill();
      if (idleFloatAnim) idleFloatAnim.kill();
      if (cloudsAnim) cloudsAnim.kill();
      masterTl.kill();
    },
  };
}
