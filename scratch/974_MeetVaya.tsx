'use client';

import React, { useEffect, useRef } from 'react';
import { Playfair_Display, Outfit } from 'next/font/google';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MeetPhoneScreen from './meet/MeetPhoneScreen';
import './meet/meet.css';

// Exact constants for hand-phone.png (851x1292) and screen hole
const SCREEN = {
  left: 0.0975,  // 83 / 851
  top: 0.0178,   // 23 / 1292
  width: 0.4559, // 388 / 851
  height: 0.6718, // 868 / 1292
};

const PHONE_BOX = {
  left: '56.94%', // 952 / 1672
  top: '17.96%',  // 169 / 941
  width: '35.11%', // 587 / 1672
};

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-playfair',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
});

interface MeetVayaProps {
  onWaitlist?: () => void;
}

export default function MeetVaya({ onWaitlist }: MeetVayaProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const plateWrapRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const headlineLinesRef = useRef<(HTMLSpanElement | null)[]>([]);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const goldLineRef = useRef<HTMLDivElement>(null);
  const featureItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Phone stage refs
  const phoneStageRef = useRef<HTMLDivElement>(null);
  const screenLayerRef = useRef<HTMLDivElement>(null);
  const screen0Ref = useRef<HTMLDivElement>(null);
  const screen1Ref = useRef<HTMLDivElement>(null);
  const screen2Ref = useRef<HTMLDivElement>(null);
  const content0Ref = useRef<HTMLDivElement>(null);
  const content1Ref = useRef<HTMLDivElement>(null);
  const content2Ref = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);

  // Separate thumb layer refs
  const thumbWrapperRef = useRef<HTMLDivElement>(null);
  const thumbShadowRef = useRef<HTMLDivElement>(null);
  const thumbImgRef = useRef<HTMLImageElement>(null);

  const scrollTriggerInstanceRef = useRef<ScrollTrigger | null>(null);

  const goToStep = (stepIdx: number) => {
    if (!scrollTriggerInstanceRef.current) return;
    const st = scrollTriggerInstanceRef.current;
    const p = stepIdx === 0 ? 0.02 : stepIdx === 1 ? 0.36 : 0.70;
    const targetY = st.start + p * (st.end - st.start);
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isReduced) {
      if (phoneStageRef.current) gsap.set(phoneStageRef.current, { yPercent: 0, opacity: 1 });
      if (leftColRef.current) gsap.set(leftColRef.current, { y: 0, opacity: 1 });
      headlineLinesRef.current.forEach((el) => {
        if (el) gsap.set(el, { yPercent: 0 });
      });
      if (paragraphRef.current) gsap.set(paragraphRef.current, { y: 0, opacity: 1 });
      if (goldLineRef.current) gsap.set(goldLineRef.current, { y: 0, opacity: 1 });
      featureItemRefs.current.forEach((el) => {
        if (el) {
          gsap.set(el, { y: 0, opacity: 1 });
          el.classList.add('active');
        }
      });
      if (screen0Ref.current) gsap.set(screen0Ref.current, { opacity: 1 });
      return;
    }

    // ── CHANGE 1: TEXT ENTRANCE ANIMATION ────────────────────────────────────
    // a) Headline lines: overflow:hidden wrapper, animate inner line yPercent 110 -> 0, stagger 0.08, duration 0.9, ease power3.out
    // b) Small paragraph and 3 feature items fade up after headline: y 30 -> 0, opacity 0 -> 1, stagger 0.1
    const validLines = headlineLinesRef.current.filter(Boolean) as HTMLSpanElement[];
    const validFeatures = featureItemRefs.current.filter(Boolean) as HTMLDivElement[];

    const heroEnterTl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
        once: true,
      },
    });

    if (validLines.length > 0) {
      heroEnterTl.fromTo(
        validLines,
        { yPercent: 110 },
        {
          yPercent: 0,
          stagger: 0.08,
          duration: 0.9,
          ease: 'power3.out',
          force3D: true,
        }
      );
    }

    const fadeUpTargets = [paragraphRef.current, goldLineRef.current, ...validFeatures].filter(Boolean);
    if (fadeUpTargets.length > 0) {
      heroEnterTl.fromTo(
        fadeUpTargets,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power2.out',
          force3D: true,
        },
        '-=0.4'
      );
    }

    // c) When scrolling out of the hero toward the globe section, text moves up (y -40) and fades out smoothly; reverses when scrolling back
    const scrollOutST = gsap.fromTo(
      leftColRef.current,
      { y: -40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        ease: 'power1.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 95%',
          end: 'top 15%',
          scrub: true,
        },
      }
    );

    // Phone stage entrance as hero approaches viewport top
    const phoneEntranceST = gsap.fromTo(
      phoneStageRef.current,
      { yPercent: 8, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          end: 'top top',
          scrub: 0.5,
        },
      }
    );

    // Initial feature 0 active
    validFeatures.forEach((el, i) => {
      if (i === 0) el.classList.add('active');
      else el.classList.remove('active');
    });

    // ── CHANGE 2: MASTER SCRUBBED TIMELINE (THUMB SWIPE + APP CONTENT SCROLL) ─
    // Timeline duration = 3.0s (1.0s per screen). Scrub: 1, force3D: true.
    const masterTl = gsap.timeline({
      paused: true,
      defaults: { ease: 'none', force3D: true },
    });

    // Slow drift/scale of the airplane window frame (1.00 -> 1.04)
    if (plateWrapRef.current) {
      masterTl.to(plateWrapRef.current, { scale: 1.04, duration: 3.0, ease: 'none' }, 0);
    }

    // Set initial states
    const thumbWrap = thumbWrapperRef.current;
    const ripple = rippleRef.current;
    const s0 = screen0Ref.current;
    const s1 = screen1Ref.current;
    const s2 = screen2Ref.current;
    const c0 = content0Ref.current;
    const c1 = content1Ref.current;
    const c2 = content2Ref.current;

    if (s0) gsap.set(s0, { opacity: 1 });
    if (s1) gsap.set(s1, { opacity: 0 });
    if (s2) gsap.set(s2, { opacity: 0 });
    if (thumbWrap) gsap.set(thumbWrap, { yPercent: 40, opacity: 0, scale: 1, y: 0 });
    if (ripple) gsap.set(ripple, { opacity: 0, scale: 0.5 });

    const setActiveFeature = (idx: number) => {
      validFeatures.forEach((el, i) => {
        if (i === idx) el.classList.add('active');
        else el.classList.remove('active');
      });
    };

    // ── SCREEN 0 (0.00 to 1.00) ──────────────────────────────────────────────
    masterTl.call(() => setActiveFeature(0), [], 0.0);

    // 1. Rise: thumb rises from resting position (translateY +40%, opacity 0) to touch point (opacity 1)
    if (thumbWrap) {
      masterTl.fromTo(
        thumbWrap,
        { yPercent: 40, opacity: 0, scale: 1, y: 0 },
        { yPercent: 0, opacity: 1, scale: 1, y: 0, duration: 0.12, ease: 'power2.out' },
        0.00
      );
      // 2. Tap feel: scale 1 to 0.96 to 1 quickly
      masterTl.to(thumbWrap, { scale: 0.96, duration: 0.03, ease: 'sine.in' }, 0.12);
      masterTl.to(thumbWrap, { scale: 1.00, duration: 0.03, ease: 'sine.out' }, 0.15);
    }
    // Ripple: small white circle under tip (scale 0.5 -> 1.6, opacity 0.5 -> 0)
    if (ripple) {
      masterTl.fromTo(
        ripple,
        { scale: 0.5, opacity: 0.5 },
        { scale: 1.6, opacity: 0, duration: 0.06, ease: 'power2.out' },
        0.12
      );
    }

    // 3. Drag UP: content and thumb move up in lockstep (thumb translateY = same distance content moves)
    const DRAG_PX = -160;
    if (c0) {
      masterTl.to(c0, { y: DRAG_PX, duration: 0.66, ease: 'none' }, 0.18);
    }
    if (thumbWrap) {
      masterTl.to(thumbWrap, { y: DRAG_PX, duration: 0.66, ease: 'none' }, 0.18);
    }

    // 4. Lift away: thumb lifts away (opacity 0, scale 1.05, y -20 relative to drag)
    if (thumbWrap) {
      masterTl.to(
        thumbWrap,
        { opacity: 0, scale: 1.05, y: DRAG_PX - 20, duration: 0.08, ease: 'power2.in' },
        0.84
      );
    }

    // 5. Next screen crossfades in over about 8% of scroll (0.92 to 1.00)
    if (s0 && s1) {
      masterTl.to(s0, { opacity: 0, duration: 0.08, ease: 'power1.inOut' }, 0.92);
      masterTl.to(s1, { opacity: 1, duration: 0.08, ease: 'power1.inOut' }, 0.92);
    }

    // ── SCREEN 1 (1.00 to 2.00) ──────────────────────────────────────────────
    masterTl.call(() => setActiveFeature(1), [], 1.0);

    // 1. Rise for Screen 1
    if (thumbWrap) {
      masterTl.fromTo(
        thumbWrap,
        { yPercent: 40, opacity: 0, scale: 1, y: 0 },
        { yPercent: 0, opacity: 1, scale: 1, y: 0, duration: 0.12, ease: 'power2.out' },
        1.00
      );
      // 2. Tap feel
      masterTl.to(thumbWrap, { scale: 0.96, duration: 0.03, ease: 'sine.in' }, 1.12);
      masterTl.to(thumbWrap, { scale: 1.00, duration: 0.03, ease: 'sine.out' }, 1.15);
    }
    // Ripple
    if (ripple) {
      masterTl.fromTo(
        ripple,
        { scale: 0.5, opacity: 0.5 },
        { scale: 1.6, opacity: 0, duration: 0.06, ease: 'power2.out' },
        1.12
      );
    }

    // 3. Drag UP Screen 1 content and thumb
    if (c1) {
      masterTl.to(c1, { y: DRAG_PX, duration: 0.66, ease: 'none' }, 1.18);
    }
    if (thumbWrap) {
      masterTl.to(thumbWrap, { y: DRAG_PX, duration: 0.66, ease: 'none' }, 1.18);
    }

    // 4. Lift away
    if (thumbWrap) {
      masterTl.to(
        thumbWrap,
        { opacity: 0, scale: 1.05, y: DRAG_PX - 20, duration: 0.08, ease: 'power2.in' },
        1.84
      );
    }

    // 5. Crossfade Screen 1 -> Screen 2 over ~8% scroll (1.92 to 2.00)
    if (s1 && s2) {
      masterTl.to(s1, { opacity: 0, duration: 0.08, ease: 'power1.inOut' }, 1.92);
      masterTl.to(s2, { opacity: 1, duration: 0.08, ease: 'power1.inOut' }, 1.92);
    }

    // ── SCREEN 2 (2.00 to 3.00) ──────────────────────────────────────────────
    masterTl.call(() => setActiveFeature(2), [], 2.0);

    // 1. Rise for Screen 2
    if (thumbWrap) {
      masterTl.fromTo(
        thumbWrap,
        { yPercent: 40, opacity: 0, scale: 1, y: 0 },
        { yPercent: 0, opacity: 1, scale: 1, y: 0, duration: 0.12, ease: 'power2.out' },
        2.00
      );
      // 2. Tap feel
      masterTl.to(thumbWrap, { scale: 0.96, duration: 0.03, ease: 'sine.in' }, 2.12);
      masterTl.to(thumbWrap, { scale: 1.00, duration: 0.03, ease: 'sine.out' }, 2.15);
    }
    // Ripple
    if (ripple) {
      masterTl.fromTo(
        ripple,
        { scale: 0.5, opacity: 0.5 },
        { scale: 1.6, opacity: 0, duration: 0.06, ease: 'power2.out' },
        2.12
      );
    }

    // 3. Drag UP Screen 2 content and thumb
    if (c2) {
      masterTl.to(c2, { y: DRAG_PX, duration: 0.66, ease: 'none' }, 2.18);
    }
    if (thumbWrap) {
      masterTl.to(thumbWrap, { y: DRAG_PX, duration: 0.66, ease: 'none' }, 2.18);
    }

    // 4. Lift away at the end
    if (thumbWrap) {
      masterTl.to(
        thumbWrap,
        { opacity: 0, scale: 1.05, y: DRAG_PX - 20, duration: 0.08, ease: 'power2.in' },
        2.84
      );
    }

    // Master ScrollTrigger with scrub: 1
    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      pin: true,
      start: 'top top',
      end: '+=300%',
      scrub: 1,
      anticipatePin: 1,
      animation: masterTl,
      onUpdate: (self) => {
        const p = self.progress;
        if (p < 0.35) {
          setActiveFeature(0);
        } else if (p < 0.68) {
          setActiveFeature(1);
        } else {
          setActiveFeature(2);
        }
      },
    });

    scrollTriggerInstanceRef.current = st;

    return () => {
      heroEnterTl.kill();
      scrollOutST.kill();
      phoneEntranceST.kill();
      st.kill();
      masterTl.kill();
    };
  }, []);

  return (
    <section
      id="meet-vaya"
      ref={sectionRef}
      className={`mv-section ${playfair.variable} ${outfit.variable}`}
      aria-label="Meet VAYA"
      suppressHydrationWarning
    >
      {/* Refined ambient header backlight (makes logo crisp and visible, leaves window untinted) */}
      <div className="mv-seam" aria-hidden="true" />

      {/* Plate wrapper centered */}
      <div ref={plateWrapRef} className="mv-plate-wrapper">
        {/* ── WINDOW SCENE (BEHIND WINDOW FRAME) ────────────────────────────── */}
        <div className="mv-window-scene-viewport" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/meet/alpine-clouds.webp"
            alt=""
            className="mv-window-bg"
            draggable={false}
          />
        </div>

        {/* Airplane window plate frame (cabin interior + transparent window cutout) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/meet/plate-frame.webp"
          alt=""
          className="mv-plate-img"
          draggable={false}
        />

        {/* Soft warm light bloom around the window */}
        <div className="mv-window-bloom" aria-hidden="true" />

        {/* Left-to-right gradient overlay for text legibility */}
        <div className="mv-gradient-overlay" aria-hidden="true" />

        {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
        <div ref={leftColRef} className="mv-left-col">
          {/* 1) Headline: lines in overflow:hidden wrappers */}
          <h2 className="mv-headline">
            <span className="mv-headline-line-mask">
              <span
                ref={(el) => { headlineLinesRef.current[0] = el; }}
                className="mv-headline-line"
              >
                <span className="mv-headline-gold">VAYA</span> is an AI-powered
              </span>
            </span>
            <span className="mv-headline-line-mask">
              <span
                ref={(el) => { headlineLinesRef.current[1] = el; }}
                className="mv-headline-line"
              >
                travel intelligence platform
              </span>
            </span>
            <span className="mv-headline-line-mask">
              <span
                ref={(el) => { headlineLinesRef.current[2] = el; }}
                className="mv-headline-line"
              >
                designed to optimize trip
              </span>
            </span>
            <span className="mv-headline-line-mask">
              <span
                ref={(el) => { headlineLinesRef.current[3] = el; }}
                className="mv-headline-line"
              >
                planning and destination discovery.
              </span>
            </span>
          </h2>

          {/* 2) Paragraph with "More destinations coming soon." */}
          <p ref={paragraphRef} className="mv-paragraph">
            It empowers travelers with crowd predictions, personalized recommendations, and data-driven travel insights.{' '}
            <span style={{ opacity: 0.65 }}>More destinations coming soon.</span>
          </p>

          {/* 3) Short gold line */}
          <div ref={goldLineRef} className="mv-gold-line" aria-hidden="true" />

          {/* 4) Feature items row */}
          <div className="mv-features">
            {/* Feature 0 */}
            <div
              ref={(el) => { featureItemRefs.current[0] = el; }}
              className="mv-feature-item active"
              data-index="0"
              onClick={() => goToStep(0)}
              style={{ cursor: 'pointer' }}
            >
              <div className="mv-feature-icon-wrap" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span className="mv-feature-label">Smarter Travel.</span>
            </div>

            <div className="mv-feature-divider" aria-hidden="true" />

            {/* Feature 1 */}
            <div
              ref={(el) => { featureItemRefs.current[1] = el; }}
              className="mv-feature-item"
              data-index="1"
              onClick={() => goToStep(1)}
              style={{ cursor: 'pointer' }}
            >
              <div className="mv-feature-icon-wrap" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5 12 2" />
                </svg>
              </div>
              <span className="mv-feature-label">Data-Driven Decisions.</span>
            </div>

            <div className="mv-feature-divider" aria-hidden="true" />

            {/* Feature 2 */}
            <div
              ref={(el) => { featureItemRefs.current[2] = el; }}
              className="mv-feature-item"
              data-index="2"
              onClick={() => goToStep(2)}
              style={{ cursor: 'pointer' }}
            >
              <div className="mv-feature-icon-wrap" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <span className="mv-feature-label">Better Experiences.</span>
            </div>
          </div>
        </div>

        {/* ── PHONE STAGE ──────────────────────────────────────────────── */}
        <div
          ref={phoneStageRef}
          className="mv-phone-stage"
          style={{
            left: PHONE_BOX.left,
            top: PHONE_BOX.top,
            width: PHONE_BOX.width,
          }}
        >
          {/* Layer 1: Screen Layer with app UI */}
          <div
            ref={screenLayerRef}
            className="mv-screen-layer"
            style={{
              left: `${SCREEN.left * 100}%`,
              top: `${SCREEN.top * 100}%`,
              width: `${SCREEN.width * 100}%`,
              height: `${SCREEN.height * 100}%`,
              borderRadius: '9.8% / 4.4%',
            }}
          >
            <MeetPhoneScreen
              screen0Ref={screen0Ref}
              screen1Ref={screen1Ref}
              screen2Ref={screen2Ref}
              content0Ref={content0Ref}
              content1Ref={content1Ref}
              content2Ref={content2Ref}
              rippleRef={rippleRef}
              onWaitlist={onWaitlist}
            />
          </div>

          {/* Layer 2: Hand+phone image: ONE single image (hand holding phone with plain screen cutout) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/meet/hand-phone.png"
            alt="Hand holding phone"
            className="mv-hand-phone-img"
            draggable={false}
          />

          {/* Layer 3: Separate Thumb Wrapper ABOVE hand+phone and app UI */}
          <div
            ref={thumbWrapperRef}
            className="mv-thumb-wrapper"
          >
            {/* Soft shadow: radial gradient ellipse div directly under thumb (NO filter: blur, NO filter: drop-shadow) */}
            <div
              ref={thumbShadowRef}
              className="mv-thumb-shadow"
              aria-hidden="true"
            />

            {/* The single transparent thumb PNG */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={thumbImgRef}
              src="/meet/thumb-swipe.png"
              alt=""
              className="mv-thumb-swipe-img"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
