import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Creates the exact scroll-driven hero timeline for VAYA
 * @param {Object} config
 * @param {HTMLElement} config.section - Pinned hero container
 * @param {HTMLElement} config.bg1 - Frame 1 background (hero-noplane)
 * @param {HTMLElement} config.bg2 - Frame 2 background (scene2)
 * @param {HTMLElement} config.plane - Plane cutout
 * @param {HTMLElement} config.title - LEFT "VAYA" element
 * @param {HTMLElement} config.taglines - RIGHT tagline block
 * @param {HTMLElement} config.scrim - Subtle white gradient overlay
 * @param {boolean} config.isMobile - Mobile flag
 * @returns {gsap.core.Timeline|null}
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
}) {
  gsap.registerPlugin(ScrollTrigger);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reduced motion: show static final frame
  if (reducedMotion) {
    if (bg1) gsap.set(bg1, { opacity: 0 });
    if (bg2) gsap.set(bg2, { opacity: 1, scale: 1 });
    if (plane) gsap.set(plane, { opacity: 0 });
    if (scrim) gsap.set(scrim, { opacity: 0.35 });
    if (title) gsap.set(title, { opacity: 1, y: 0 });
    if (taglines) gsap.set(taglines, { opacity: 1, y: 0 });
    return null;
  }

  // Pre-set initial states using only transform & opacity
  if (bg1) {
    gsap.set(bg1, {
      scale: 1,
      opacity: 1,
      transformOrigin: isMobile ? '56% 48%' : '62% 49%',
      force3D: true,
    });
  }

  if (bg2) {
    gsap.set(bg2, {
      opacity: 0,
      scale: 1,
      force3D: true,
    });
  }

  if (scrim) {
    gsap.set(scrim, { opacity: 0, force3D: true });
  }

  if (plane) {
    // Plane starting position is anchored in CSS (desktop: left 35%, top 56%; mobile: left 32%, top 58%)
    gsap.set(plane, {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      rotation: 0,
      transformOrigin: '50% 50%',
      force3D: true,
    });
  }

  // Initial title & tagline offsets: translateY 20px, opacity 0
  if (title) {
    gsap.set(title, {
      opacity: 0,
      y: 20,
      force3D: true,
    });
  }

  if (taglines) {
    gsap.set(taglines, {
      opacity: 0,
      y: 20,
      force3D: true,
    });
  }

  // Pin runway duration: desktop ~400vh (+=300vh), mobile ~260vh (+=160vh)
  const pinDistance = isMobile ? '+=160%' : '+=300%';

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: pinDistance,
      scrub: 0.5,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  // ══════════════════════════════════════════════════════════════════
  // 1) 0.00 to 0.55: PLANE DOOR JAATA HAI (Recedes into the valley)
  // ══════════════════════════════════════════════════════════════════
  // Plane flies from starting point toward valley vanishing point (~62% x, ~49% y)
  // Scale 1 to ~0.18, rotate 0 to 2deg, easing power1.out
  const deltaX = isMobile ? '24vw' : '27vw';
  const deltaY = isMobile ? '-10vh' : '-7vh';

  if (plane) {
    tl.to(
      plane,
      {
        x: deltaX,
        y: deltaY,
        scale: isMobile ? 0.16 : 0.18,
        rotation: 2,
        duration: 0.55,
        ease: 'power1.out',
      },
      0
    );

    // Opacity 1 to 0 sirf last 15% mein (0.40 -> 0.55) taaki door clouds mein kho jaye
    tl.to(
      plane,
      {
        opacity: 0,
        duration: 0.15,
        ease: 'power1.in',
      },
      0.40
    );
  }

  // Background 1: halka push-in: scale 1 to 1.05 toward vanishing point
  if (bg1) {
    tl.to(
      bg1,
      {
        scale: 1.05,
        duration: 0.55,
        ease: 'power1.out',
      },
      0
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // 2) 0.45 to 0.75: BACKGROUND CROSSFADE (hero-noplane -> scene2)
  // ══════════════════════════════════════════════════════════════════
  if (bg2) {
    tl.to(
      bg2,
      {
        opacity: 1,
        duration: 0.30,
        ease: 'power1.inOut',
      },
      0.45
    );
  }

  // Very subtle white gradient overlay for pristine text contrast
  if (scrim) {
    tl.to(
      scrim,
      {
        opacity: isMobile ? 0.4 : 0.28,
        duration: 0.25,
        ease: 'power1.out',
      },
      0.55
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // 3) 0.62 to 0.88: TITLE AATA HAI (opacity + translateY 20px to 0)
  // ══════════════════════════════════════════════════════════════════
  // LEFT: "VAYA" slides up 20px -> 0, opacity 0 -> 1
  if (title) {
    tl.to(
      title,
      {
        opacity: 1,
        y: 0,
        duration: 0.20,
        ease: 'power1.out',
      },
      0.62
    );
  }

  // RIGHT: Tagline block comes ~0.06 progress later (0.68 -> 0.88)
  if (taglines) {
    tl.to(
      taglines,
      {
        opacity: 1,
        y: 0,
        duration: 0.20,
        ease: 'power1.out',
      },
      0.68
    );
  }

  // 4) 0.88 to 1.00: Title hold (natural timeline completion with pin release into #next)
  return tl;
}
