import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Creates the scroll-driven hero timeline for VAYA
 * @param {Object} refs - DOM element references
 * @param {HTMLElement} refs.section - Pinned hero container
 * @param {HTMLElement} refs.bg1 - Frame 1 background (hero-noplane or hero)
 * @param {HTMLElement} refs.bg2 - Frame 2 background (scene2 lake valley)
 * @param {HTMLElement} refs.plane - Transparent plane cutout (Option A)
 * @param {HTMLElement} refs.title - VAYA title element
 * @param {HTMLElement} refs.taglines - Tagline container (Know before you go / Step in, step out)
 * @param {HTMLElement} refs.scrim - Contrast gradient overlay
 * @param {boolean} isMobile - Current viewport is mobile (<= 768px)
 * @param {boolean} isOptionA - Whether Option A (separated plane) or Option B (camera push-in) is active
 * @returns {gsap.core.Timeline}
 */
export function createHeroTimeline({
  section,
  bg1,
  bg2,
  plane,
  title,
  taglines,
  scrim,
  isMobile = false,
  isOptionA = true,
}) {
  gsap.registerPlugin(ScrollTrigger);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reduced motion: set final static layout immediately
  if (reducedMotion) {
    if (bg1) gsap.set(bg1, { opacity: 0 });
    if (bg2) gsap.set(bg2, { opacity: 1, scale: 1 });
    if (plane) gsap.set(plane, { opacity: 0 });
    if (scrim) gsap.set(scrim, { opacity: 0.35 });
    if (title) gsap.set(title, { opacity: 1, x: 0, y: 0 });
    if (taglines) gsap.set(taglines, { opacity: 1, x: 0, y: 0 });
    return null;
  }

  // Pre-set initial states strictly via transform & opacity
  if (bg1) {
    gsap.set(bg1, {
      scale: 1,
      x: 0,
      y: 0,
      opacity: 1,
      transformOrigin: isMobile ? '50% 60%' : '42% 58%',
      force3D: true,
    });
  }

  if (bg2) {
    gsap.set(bg2, {
      opacity: 0,
      scale: isMobile ? 1.05 : 1.08,
      force3D: true,
    });
  }

  if (scrim) {
    gsap.set(scrim, { opacity: 0, force3D: true });
  }

  if (plane && isOptionA) {
    // Initial plane position: lower-left quadrant
    gsap.set(plane, {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      rotation: -3,
      transformOrigin: '50% 50%',
      force3D: true,
    });
  }

  // Initial title & tagline offsets
  if (title) {
    gsap.set(title, {
      opacity: 0,
      x: isMobile ? 0 : -60,
      y: isMobile ? 30 : 0,
      force3D: true,
    });
  }

  if (taglines) {
    gsap.set(taglines, {
      opacity: 0,
      x: isMobile ? 0 : 60,
      y: isMobile ? 30 : 0,
      force3D: true,
    });
  }

  // Master timeline scrubbed by ScrollTrigger
  const pinDuration = isMobile ? '+=180%' : '+=250%';

  const tl = gsap.timeline({
    defaults: { ease: 'none' }, // Direct scrub mapping without non-linear jumps
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: pinDuration,
      scrub: 0.6,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // PHASE 1: Plane Flight & Camera Dolly (Progress 0.00 -> 0.55)
  // ═══════════════════════════════════════════════════════════
  if (isOptionA && plane) {
    // OPTION A (Preferred): Plane glides forward-up into the valley
    // Neeche-left se upar-right, scale 1 -> 1.6, rotate -3deg -> 4deg, power1.inOut
    tl.to(
      plane,
      {
        x: isMobile ? '16vw' : '26vw',
        y: isMobile ? '-18vh' : '-24vh',
        scale: isMobile ? 1.35 : 1.6,
        rotation: 4,
        duration: 0.55,
        ease: 'power1.inOut',
      },
      0
    );

    // Fade plane out smoothly as it reaches the vanishing distance
    tl.to(
      plane,
      {
        opacity: 0,
        duration: 0.14,
        ease: 'power1.in',
      },
      0.44
    );

    // Subtle natural camera push-in on background 1
    if (bg1) {
      tl.to(
        bg1,
        {
          scale: isMobile ? 1.1 : 1.16,
          x: isMobile ? '-2vw' : '-3vw',
          y: isMobile ? '1vh' : '2vh',
          duration: 0.55,
          ease: 'power1.inOut',
        },
        0
      );
    }
  } else if (bg1) {
    // OPTION B (Fallback if plane is baked into hero.webp):
    // Poori hero image par camera push-in: scale 1 to 1.4, origin (~42% x, ~58% y), translate up-right
    tl.to(
      bg1,
      {
        scale: 1.38,
        x: isMobile ? '-4vw' : '-6vw',
        y: isMobile ? '3vh' : '4vh',
        duration: 0.55,
        ease: 'power1.inOut',
      },
      0
    );
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 2: Seamless Crossfade to Frame 2 (Progress 0.48 -> 0.75)
  // ═══════════════════════════════════════════════════════════
  if (bg2) {
    tl.to(
      bg2,
      {
        opacity: 1,
        scale: 1.0,
        duration: 0.27,
        ease: 'power1.inOut',
      },
      0.48
    );
  }

  // Optional subtle contrast scrim for crystal-clear readability
  if (scrim) {
    tl.to(
      scrim,
      {
        opacity: isMobile ? 0.42 : 0.32,
        duration: 0.25,
        ease: 'power1.out',
      },
      0.55
    );
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 3: Columbus-Travel Style Title Transition (Progress 0.65 -> 0.90)
  // ═══════════════════════════════════════════════════════════
  // LEFT: "VAYA" slides in from left (-60px) to 0, opacity 0 -> 1
  if (title) {
    tl.to(
      title,
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.22,
        ease: 'power2.out',
      },
      0.65
    );
  }

  // RIGHT: Tagline block slides in from right (+60px) to 0, staggered by ~0.08 progress
  if (taglines) {
    tl.to(
      taglines,
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.22,
        ease: 'power2.out',
      },
      0.73
    );
  }

  return tl;
}
