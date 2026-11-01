'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import '@fontsource/playfair-display/500.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
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
  const thumbRef = useRef<HTMLImageElement>(null);

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

    // 1. Headline words reveal in window [0.7*i/n, 0.7*i/n + 0.3]
    wordElsRef.current.forEach((el, i) => {
      if (!el) return;
      const start = 0.7 * (i / n);
      const end = start + 0.3;
      let wp = 0;
      if (clampedP <= start) wp = 0;
      else if (clampedP >= end) wp = 1;
      else wp = (clampedP - start) / 0.3;

      const opacity = 0.12 + 0.88 * wp;
      const translateY = 24 * (1 - wp);
      const blur = 8 * (1 - wp);

      el.style.opacity = `${opacity}`;
      el.style.transform = `translateY(${translateY}px)`;
      el.style.filter = blur > 0.1 ? `blur(${blur}px)` : 'none';

      // One-time gold shimmer sweep (1.2s) when "VAYA" completes (i=0, wp=1)
      if (i === 0 && wp >= 0.99 && !shimmerTriggeredRef.current) {
        shimmerTriggeredRef.current = true;
        el.classList.add('shimmer');
      }
    });

    // 2. Subtext line-by-line mask slide-up once headline passes 90%
    const subProgress = Math.max(0, Math.min(1, (clampedP - 0.90) / 0.10));
    subtextLinesRef.current.forEach((lineEl, idx) => {
      if (!lineEl) return;
      const lStart = idx === 0 ? 0 : 0.28;
      const lEnd = idx === 0 ? 0.72 : 1.0;
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

    // 4. The 3 pills enter with an 80ms stagger
    featureItemRefs.current.forEach((pillEl, idx) => {
      if (!pillEl) return;
      const pStart = 0.90 + idx * 0.03;
      const pEnd = Math.min(1.0, pStart + 0.04);
      let pp = 0;
      if (clampedP <= pStart) pp = 0;
      else if (clampedP >= pEnd) pp = 1;
      else pp = (clampedP - pStart) / (pEnd - pStart);

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

    updateActiveFeature(0);

    // Initial setups for phone stage
    gsap.set(phoneStageRef.current, { yPercent: 16, rotation: 3, opacity: 0 });

    // Idle life: floating animation for phone stage (+-3px, 3.8s sine)
    const idleFloat = gsap.to(phoneStageRef.current, {
      y: '+=6',
      duration: 3.8,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      paused: false,
    });

    // Mouse tilt handler (up to 3.5deg)
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

    // ── ENTRY SCROLLTRIGGER: Text reveal scrub ─────────────────────────────
    // Starts when section top reaches 85% of viewport height; completes when top reaches 0 (before pin).
    const entryST = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 85%',
      end: 'top top',
      scrub: true,
      onUpdate: (self) => {
        applyRevealProgress(self.progress);
      },
    });

    // Check if entered without scrolling through (refresh at section, anchor link)
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

    // ── PINNED TIMELINE: 3-step interactive scroll (duration unchanged) ───
    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: 'power2.inOut' },
    });

    // Phone stage entrance
    tl.to(phoneStageRef.current, {
      yPercent: 0,
      rotation: 0,
      opacity: 1,
      duration: 0.12,
      ease: 'power3.out',
    }, 0.00);

    // Plate scales slowly 1.00 -> 1.05 across entire pinned scroll
    tl.to(plateWrapRef.current, {
      scale: 1.05,
      duration: 1.0,
      ease: 'none',
    }, 0.00);

    // 0.12 - 0.42: Step 0 Smarter Travel
    tl.call(() => updateActiveFeature(0), [], 0.12);
    // 0.42 - 0.72: Step 1 Data-Driven Decisions
    tl.call(() => updateActiveFeature(1), [], 0.42);
    // 0.72 - 1.00: Step 2 Better Experiences
    tl.call(() => updateActiveFeature(2), [], 0.72);

    // Pinned ScrollTrigger
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
      if (sectionEl) {
        sectionEl.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [applyRevealProgress]);

  return (
    <section
      id="meet-vaya"
      ref={sectionRef}
      className="mv-section"
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
            />
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