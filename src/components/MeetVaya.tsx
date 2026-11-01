'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

import { Playfair_Display, Outfit } from 'next/font/google';

import gsap from 'gsap';

import { ScrollTrigger } from 'gsap/ScrollTrigger';

import MeetPhoneScreen from './meet/MeetPhoneScreen';

import './meet/meet.css';

export interface TapConfig {

  t: number; // in seconds

  x: number; // % of screen

  y: number; // % of screen

  label?: string;

}

// Tap times tuned to the baked button actions in each step

export const TAPS: Record<number, TapConfig[]> = {

  // Step 0: plan-trip video (~1.6s "Create My Trip")

  0: [{ t: 1.6, x: 70, y: 79, label: 'Create My Trip' }],

  // Step 1: itinerary video (~1.6s "Day 2", ~4.6s "Review changes", ~6.6s "Accept Itinerary")

  1: [

    { t: 1.6, x: 62, y: 28, label: 'Day 2' },

    { t: 4.6, x: 70, y: 79, label: 'Review changes' },

    { t: 6.6, x: 72, y: 81, label: 'Accept Itinerary' },

  ],

  // Step 2: crowd forecast (~1.8s "Plan my trip")

  2: [{ t: 1.8, x: 68, y: 84, label: 'Plan my trip' }],

};

// Compute thumb reachability from base joint pivot (505, 590) on 851x1292 image

export function isThumbReachable(xPct: number, yPct: number): boolean {

  if (xPct < 48 || yPct < 25) return false;

  const screenW = 388;

  const screenH = 868;

  const pivotX = 505 - 83; // 422px from screen left

  const pivotY = 590 - 23; // 567px from screen top

  const targetX = (xPct / 100) * screenW;

  const targetY = (yPct / 100) * screenH;

  const dx = targetX - pivotX;

  const dy = targetY - pivotY;

  const dist = Math.sqrt(dx * dx + dy * dy);

  return dist <= 340 && dist >= 100;

}

// Exact constants for hand-phone.png (851x1292) and screen hole

const SCREEN = {

  left: 0.0975, // 83 / 851

  top: 0.0178,  // 23 / 1292

  width: 0.4559, // 388 / 851

  height: 0.6718, // 868 / 1292

  radius: 0.116,

};

const PHONE_BOX = {

  left: '56.94%', // 952 / 1672

  top: '17.96%', // 169 / 941

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

const HEADLINE_WORDS = [

  { text: 'VAYA', isGold: true },

  { text: 'is' },

  { text: 'an' },

  { text: 'AI-powered' },

  { text: 'travel' },

  { text: 'intelligence' },

  { text: 'platform' },

  { text: 'designed' },

  { text: 'to' },

  { text: 'optimize' },

  { text: 'trip' },

  { text: 'planning' },

  { text: 'and' },

  { text: 'destination' },

  { text: 'discovery.' },

];

export default function MeetVaya({ onWaitlist }: MeetVayaProps) {

  const sectionRef = useRef<HTMLElement>(null);

  const plateWrapRef = useRef<HTMLDivElement>(null);

  const phoneStageRef = useRef<HTMLDivElement>(null);

  const screenLayerRef = useRef<HTMLDivElement>(null);

  const rippleRef = useRef<HTMLDivElement>(null);

  const thumbRef = useRef<HTMLImageElement>(null);

  const contactShadowRef = useRef<HTMLDivElement>(null);

  const tapTweenRef = useRef<gsap.core.Timeline | null>(null);

  const firedTapsRef = useRef<Set<number>>(new Set());

  const prevTimeRef = useRef<number>(0);

  // Left column refs

  const goldLineRef = useRef<HTMLDivElement>(null);

  const wordElsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const subtextLinesRef = useRef<(HTMLSpanElement | null)[]>([]);

  const shimmerTriggeredRef = useRef<boolean>(false);

  const featureItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 3 Steps: 0 = Smarter Travel, 1 = Data-Driven Decisions, 2 = Better Experiences

  const [activeFeature, setActiveFeature] = useState<number>(0);

  const [isSectionInView, setIsSectionInView] = useState<boolean>(true);

  // Feature items highlight helper

  const updateActiveFeature = (idx: number) => {

    setActiveFeature(idx);

    featureItemRefs.current.forEach((el, i) => {

      if (!el) return;

      if (i === idx) {

        el.classList.add('active');

      } else {

        el.classList.remove('active');

      }

    });

  };

  // Text Reveal Logic

  const applyRevealProgress = useCallback((p: number) => {

    const clampedP = Math.max(0, Math.min(1, p));

    const n = HEADLINE_WORDS.length; // 15

    // 1. Headline words reveal: translateY(24px) -> 0, opacity 0 -> 1 (no filter blur)

    wordElsRef.current.forEach((el, i) => {

      if (!el) return;

      const start = 0.52 * (i / (n - 1));

      const end = start + 0.20;

      let wp = 0;

      if (clampedP <= start) wp = 0;

      else if (clampedP >= end) wp = 1;

      else wp = (clampedP - start) / 0.20;

      el.style.opacity = `${wp}`;

      el.style.transform = `translateY(${24 * (1 - wp)}px)`;

      // One-time gold shimmer sweep (1.2s) when "VAYA" completes (i=0, wp=1)

      if (i === 0 && wp >= 0.99 && !shimmerTriggeredRef.current) {

        shimmerTriggeredRef.current = true;

        el.classList.add('shimmer');

      }

    });

    // 2. Paragraph lines slide up (translateY 100% -> 0 inside mask) once headline completes (p >= 0.72)

    const subProgress = Math.max(0, Math.min(1, (clampedP - 0.72) / 0.28));

    subtextLinesRef.current.forEach((lineEl, idx) => {

      if (!lineEl) return;

      const lStart = idx === 0 ? 0 : 0.35;

      const lEnd = idx === 0 ? 0.65 : 1.0;

      let lp = 0;

      if (subProgress <= lStart) lp = 0;

      else if (subProgress >= lEnd) lp = 1;

      else lp = (subProgress - lStart) / (lEnd - lStart);

      lineEl.style.transform = `translateY(${(1 - lp) * 100}%)`;

      lineEl.style.opacity = `${lp}`;

    });

    // 3. Gold divider line draws with scaleX 0 -> 1

    if (goldLineRef.current) {

      goldLineRef.current.style.transform = `scaleX(${subProgress})`;

    }

    // 4. The 3 pills enter with stagger

    featureItemRefs.current.forEach((pillEl, idx) => {

      if (!pillEl) return;

      const pStart = 0.50 + idx * 0.15;

      const pEnd = Math.min(1.0, pStart + 0.20);

      let pp = 0;

      if (subProgress <= pStart) pp = 0;

      else if (subProgress >= pEnd) pp = 1;

      else pp = (subProgress - pStart) / (pEnd - pStart);

      pillEl.style.opacity = `${pp}`;

      pillEl.style.transform = `translateY(${(1 - pp) * 16}px)`;

    });

  }, []);

  // Observe section visibility to pause/resume videos

  useEffect(() => {

    const el = sectionRef.current;

    if (!el) return;

    const observer = new IntersectionObserver(

      ([entry]) => {

        setIsSectionInView(entry.isIntersecting);

      },

      { threshold: 0.1 }

    );

    observer.observe(el);

    return () => observer.disconnect();

  }, []);

  const triggerTap = (tap: TapConfig) => {
    // Thumb is static per instruction: Thumb ko move/animate mat karna, wo static image hi rahegi
    if (rippleRef.current) {
      gsap.fromTo(
        rippleRef.current,
        { scale: 0.4, opacity: 0.65 },
        { scale: 1.5, opacity: 0, duration: 0.42, ease: 'power2.out' }
      );
    }
  };

  const handleVideoTimeUpdate = (step: number, currentTime: number) => {

    if (!isSectionInView) return;

    if (step !== activeFeature) return;

    if (currentTime < prevTimeRef.current - 0.5 || currentTime < 0.25) {

      firedTapsRef.current.clear();

    }

    prevTimeRef.current = currentTime;

    const stepTaps = TAPS[step] || [];

    stepTaps.forEach((tap, idx) => {

      const triggerTime = Math.max(0, tap.t - 0.22);

      if (currentTime >= triggerTime && currentTime <= tap.t + 0.4 && !firedTapsRef.current.has(idx)) {

        firedTapsRef.current.add(idx);

        triggerTap(tap);

      }

    });

  };

  // Handle active feature change & Step 2 tap

  useEffect(() => {

    firedTapsRef.current.clear();

    prevTimeRef.current = 0;

    if (activeFeature === 2 && isSectionInView) {

      const step2Tap = TAPS[2]?.[0];

      if (step2Tap) {

        const timer = setTimeout(() => {

          triggerTap(step2Tap);

        }, 1800);

        return () => clearTimeout(timer);

      }

    }

  }, [activeFeature, isSectionInView]);

  // Mobile: auto-cycle activeFeature (0 -> 1 -> 2 -> 0) every 2.8s when section is in view
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    if (!isMobile || !isSectionInView) return;

    const timer = setInterval(() => {
      setActiveFeature((prev) => {
        const next = (prev + 1) % 3;
        featureItemRefs.current.forEach((el, i) => {
          if (!el) return;
          if (i === next) el.classList.add('active');
          else el.classList.remove('active');
        });
        return next;
      });
    }, 2800);

    return () => clearInterval(timer);
  }, [isSectionInView]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isReduced) {
      if (phoneStageRef.current) gsap.set(phoneStageRef.current, { yPercent: 0, rotation: 0, opacity: 1 });
      featureItemRefs.current.forEach(el => el?.classList.add('active'));
      applyRevealProgress(1);
      return;
    }

    const mm = gsap.matchMedia();

    // ── DESKTOP (>= 1024px): original pinned scrub and tilt ───────────────────
    mm.add('(min-width: 1024px)', () => {
      updateActiveFeature(0);
      gsap.set(phoneStageRef.current, { yPercent: 0, rotation: 0, opacity: 1 });

      const idleFloat = gsap.to(phoneStageRef.current, {
        y: '+=6',
        duration: 3.8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        paused: false,
      });

      const handleMouseMove = (e: MouseEvent) => {
        if (!sectionRef.current || !phoneStageRef.current) return;
        const r = sectionRef.current.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(phoneStageRef.current, {
          rotateY: nx * 3.5,
          rotateX: -ny * 3.5,
          duration: 0.8,
          ease: 'power2.out',
        });
      };

      const sectionEl = sectionRef.current;
      if (sectionEl) {
        sectionEl.addEventListener('mousemove', handleMouseMove);
      }

      const entryST = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 85%',
        end: 'top top',
        scrub: true,
        onUpdate: (self) => {
          applyRevealProgress(self.progress);
        },
      });

      if (sectionRef.current) {
        const bcr = sectionRef.current.getBoundingClientRect();
        if (bcr.top <= 10 && bcr.bottom > 100) {
          const autoObj = { p: 0 };
          gsap.to(autoObj, {
            p: 1,
            duration: 1.4,
            ease: 'power2.out',
            onUpdate: () => applyRevealProgress(autoObj.p),
          });
        } else {
          applyRevealProgress(entryST.progress);
        }
      }

      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: 'power2.inOut' },
      });

      tl.to(phoneStageRef.current, {
        yPercent: 0,
        rotation: 0,
        opacity: 1,
        duration: 0.12,
        ease: 'power3.out',
      }, 0.00);

      tl.to(plateWrapRef.current, {
        scale: 1.05,
        duration: 1.0,
        ease: 'none',
      }, 0.00);

      tl.call(() => updateActiveFeature(0), [], 0.12);
      tl.call(() => updateActiveFeature(1), [], 0.42);
      tl.call(() => updateActiveFeature(2), [], 0.72);

      tl.to('.mv-left-col', {
        y: -30,
        opacity: 0,
        duration: 0.12,
        ease: 'power2.in',
      }, 0.88);

      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        pin: true,
        start: 'top top',
        end: '+=320%',
        scrub: 0.6,
        anticipatePin: 1,
        animation: tl,
        onUpdate: (self) => {
          const p = self.progress;
          if (p < 0.38) {
            updateActiveFeature(0);
          } else if (p < 0.72) {
            updateActiveFeature(1);
          } else {
            updateActiveFeature(2);
          }
        },
      });

      return () => {
        entryST.kill();
        st.kill();
        tl.kill();
        idleFloat.kill();
        if (tapTweenRef.current) tapTweenRef.current.kill();
        if (sectionEl) {
          sectionEl.removeEventListener('mousemove', handleMouseMove);
        }
      };
    });

    // ── MOBILE / TABLET (< 1024px): no pin, clean reveal, clear transforms ───
    mm.add('(max-width: 1023px)', () => {
      if (plateWrapRef.current) gsap.set(plateWrapRef.current, { clearProps: 'all' });
      if (phoneStageRef.current) gsap.set(phoneStageRef.current, { clearProps: 'transform', opacity: 1 });

      updateActiveFeature(0);

      const mobileST = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          const autoObj = { p: 0 };
          gsap.to(autoObj, {
            p: 1,
            duration: 1.1,
            ease: 'power2.out',
            onUpdate: () => applyRevealProgress(autoObj.p),
          });
        },
      });

      if (sectionRef.current) {
        const bcr = sectionRef.current.getBoundingClientRect();
        if (bcr.top < window.innerHeight * 0.75) {
          applyRevealProgress(1);
        }
      }

      return () => {
        mobileST.kill();
      };
    });

    return () => {
      mm.revert();
    };
  }, [applyRevealProgress]);

  return (

    <section

      id="meet-vaya"

      ref={sectionRef}

      className={`mv-section ${playfair.variable} ${outfit.variable}`}

      aria-label="Meet VAYA"

      suppressHydrationWarning

    >
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

        <div className="mv-left-col">

          {/* 1) Headline with word-by-word reveal */}

          <h2 className="mv-headline">

            {HEADLINE_WORDS.map((w, i) => (

              <span

                key={i}

                ref={(el) => { wordElsRef.current[i] = el; }}

                className={`mv-word ${w.isGold ? 'mv-headline-gold' : ''}`}

              >

                {w.text}{' '}

              </span>

            ))}

          </h2>

          {/* 2) Paragraph with line-by-line mask slide-up */}

          <p className="mv-paragraph">

            <span className="mv-subtext-line-mask">

              <span

                ref={(el) => { subtextLinesRef.current[0] = el; }}

                className="mv-subtext-line"

              >

                It empowers travelers with crowd predictions,

              </span>

            </span>

            <span className="mv-subtext-line-mask">

              <span

                ref={(el) => { subtextLinesRef.current[1] = el; }}

                className="mv-subtext-line"

              >

                personalized recommendations, and data-driven travel insights.

              </span>

            </span>

          </p>

          {/* 3) Short gold line */}

          <div ref={goldLineRef} className="mv-gold-line" aria-hidden="true" />

          {/* 4) Feature items row */}

          <div className="mv-features">

            {/* Feature 0 */}

            <div

              ref={(el) => { featureItemRefs.current[0] = el; }}

              className={`mv-feature-item ${activeFeature === 0 ? 'active' : ''}`}

              data-index="0"

              onClick={() => updateActiveFeature(0)}

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

              className={`mv-feature-item ${activeFeature === 1 ? 'active' : ''}`}

              data-index="1"

              onClick={() => updateActiveFeature(1)}

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

              className={`mv-feature-item ${activeFeature === 2 ? 'active' : ''}`}

              data-index="2"

              onClick={() => updateActiveFeature(2)}

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

          {/* Layer 1: Screen Layer with video-driven screen and rebuilt crowd forecast */}

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

              activeStep={activeFeature}

              isSectionInView={isSectionInView}

              onWaitlist={onWaitlist}

              onVideoTimeUpdate={handleVideoTimeUpdate}

            />

            {/* Soft contact shadow on the screen under the tip */}

            <div ref={contactShadowRef} className="mv-contact-shadow" aria-hidden="true" />

            {/* Touch Ripple inside screen layer above content */}

            <div ref={rippleRef} className="mv-ripple" aria-hidden="true" />

          </div>

          {/* Layer 2: Hand back (phone body, notch, left fingers, wrist, palm, repaired right bezel) */}

          {/* eslint-disable-next-line @next/next/no-img-element */}

          <img

            src="/meet/hand-back.png"

            alt="Hand holding phone"

            className="mv-hand-back-img"

            draggable={false}

          />

          {/* Layer 3: Animated Thumb rotating about base joint over the screen (always opacity 1, exact rest pose) */}

          {/* eslint-disable-next-line @next/next/no-img-element */}

          <img

            ref={thumbRef}

            src="/meet/thumb.png"

            alt=""

            className="mv-thumb-img"

            draggable={false}

          />

        </div>

      </div>

      
    </section>

  );

}