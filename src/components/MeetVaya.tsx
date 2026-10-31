'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Playfair_Display, Outfit } from 'next/font/google';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './meet/meet.css';

// Exact constants from specification
const SCREEN = { left: 0.0369, top: 0.0193, width: 0.4949, height: 0.6744, radius: 0.1028 }; // fractions of hand-phone.png; radius is a fraction of the SCREEN WIDTH
const THUMB = { aspect: 757/1053, heightOfScreen: 0.36, tip: { x: 0.174, y: 0.0 } };
const PHONE_BOX = { left: '60.3%', top: '17.6%', width: '32.5%' }; // position of hand-phone.png inside the plate wrapper

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

const BAR_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BAR_FINALS = [14, 17, 21, 26, 36, 48, 62]; // cqw heights

export default function MeetVaya({ onWaitlist }: MeetVayaProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const plateWrapRef = useRef<HTMLDivElement>(null);
  const phoneStageRef = useRef<HTMLDivElement>(null);
  const screenLayerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLImageElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const comingSoonRef = useRef<HTMLDivElement>(null);

  // Left column refs
  const logoBlockRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const goldLineRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Feature items and bar elements
  const featureItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [activeFeature, setActiveFeature] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    // If reduced motion is requested, display final state statically
    if (isReduced) {
      if (phoneStageRef.current) gsap.set(phoneStageRef.current, { yPercent: 0, rotation: 0, opacity: 1 });
      if (comingSoonRef.current) gsap.set(comingSoonRef.current, { yPercent: 0, opacity: 1 });
      featureItemRefs.current.forEach(el => el?.classList.add('active'));
      return;
    }

    // Default active item initially
    updateActiveFeature(0);

    // Initial setups for left column and stage
    gsap.set(phoneStageRef.current, { yPercent: 16, rotation: 3, opacity: 0 });
    const leftItems = [logoBlockRef.current, headlineRef.current, paragraphRef.current, goldLineRef.current, featuresRef.current];
    gsap.set(leftItems, { y: 24, opacity: 0 });

    // Rest position coordinates (in % of phone stage)
    // Thumb tip at 62% screen width, 108% screen height:
    // tipX = 0.0369 + 0.62 * 0.4949 = 0.343738 (34.37%)
    // tipY = 0.0193 + 1.08 * 0.6744 = 0.747652 (74.77%)
    // thumb left = tipX - 0.174 * thumbWidth (~4.995%) = 29.38%
    // thumb top = tipY = 74.77%
    const REST_THUMB_X = 29.38;
    const REST_THUMB_Y = 74.77;
    const REST_TIP_X = 34.37;
    const REST_TIP_Y = 74.77;

    // Contact position coordinates (tip at 55% screen width, 88% screen height)
    // tipX = 0.0369 + 0.55 * 0.4949 = 0.309095 (30.91%)
    // tipY = 0.0193 + 0.88 * 0.6744 = 0.612772 (61.28%)
    // thumb left = tipX - 4.995% = 25.91%
    // thumb top = 61.28%
    const CONTACT_THUMB_X = 25.91;
    const CONTACT_THUMB_Y = 61.28;
    const CONTACT_TIP_X = 30.91;
    const CONTACT_TIP_Y = 61.28;

    // Swipe 1 delta: thumb tip moves up 30% of screen height
    // deltaY = -0.30 * 67.44% = -20.23%
    const SWIPE1_THUMB_Y = CONTACT_THUMB_Y - 20.23;
    const SWIPE1_TIP_Y = CONTACT_TIP_Y - 20.23;

    // Swipe 2 delta: thumb moves up another 24% of screen height
    // deltaY2 = -0.24 * 67.44% = -16.19%
    const SWIPE2_THUMB_Y = SWIPE1_THUMB_Y - 16.19;
    const SWIPE2_TIP_Y = SWIPE1_TIP_Y - 16.19;

    // Set initial positions
    gsap.set(thumbRef.current, {
      left: `${REST_THUMB_X}%`,
      top: `${REST_THUMB_Y}%`,
      scale: 1,
      opacity: 1,
    });
    gsap.set(rippleRef.current, {
      left: `${REST_TIP_X}%`,
      top: `${REST_TIP_Y}%`,
      scale: 0.6,
      opacity: 0,
    });

    // Idle life: floating animation for phone stage (+-3px, 4s sine)
    const idleFloat = gsap.to(phoneStageRef.current, {
      y: '+=6',
      duration: 3.8,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      paused: false,
    });

    // Mouse tilt handler (up to 2deg)
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current || !phoneStageRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
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

    // Scroll range for inner page
    // Inner height is ~215cqw, viewport is ~140cqw. Scroll range is approximately 68cqw.
    // In CSS cqw, we can translate .inner by cqw using CSS transform.
    const scrollRangeCqw = 68;

    // Master Timeline with duration 1 (progress = timeline time)
    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: 'power2.inOut' },
    });

    // ── 0.00 - 0.12 ENTRANCE ─────────────────────────────────────
    tl.to(phoneStageRef.current, {
      yPercent: 0,
      rotation: 0,
      opacity: 1,
      duration: 0.12,
      ease: 'power3.out',
    }, 0.00);

    tl.to(leftItems, {
      y: 0,
      opacity: 1,
      stagger: 0.015,
      duration: 0.10,
      ease: 'power3.out',
    }, 0.02);

    // Plate scales slowly 1.00 -> 1.05 across entire scroll
    tl.to(plateWrapRef.current, {
      scale: 1.05,
      duration: 1.0,
      ease: 'none',
    }, 0.00);

    // ── 0.12 - 0.30 HOME SCREEN VISIBLE ─────────────────────────
    tl.call(() => updateActiveFeature(0), [], 0.12);

    // ── 0.30 - 0.42 THUMB MOVES IN & PRESSES ───────────────────
    tl.to(thumbRef.current, {
      left: `${CONTACT_THUMB_X}%`,
      top: `${CONTACT_THUMB_Y}%`,
      scale: 0.96,
      duration: 0.12,
      ease: 'power2.out',
    }, 0.30);

    tl.to(rippleRef.current, {
      left: `${CONTACT_TIP_X}%`,
      top: `${CONTACT_TIP_Y}%`,
      scale: 1.0,
      opacity: 0.75,
      duration: 0.12,
      ease: 'power2.out',
    }, 0.30);

    // ── 0.42 - 0.60 SWIPE 1 ─────────────────────────────────────
    tl.call(() => updateActiveFeature(1), [], 0.42);

    // Thumb tip moves up 30% of screen height
    tl.to(thumbRef.current, {
      top: `${SWIPE1_THUMB_Y}%`,
      duration: 0.18,
      ease: 'power2.inOut',
    }, 0.42);

    tl.to(rippleRef.current, {
      top: `${SWIPE1_TIP_Y}%`,
      duration: 0.18,
      ease: 'power2.inOut',
    }, 0.42);

    // .inner translates up 50% of scroll range
    tl.to(innerRef.current, {
      y: `-${scrollRangeCqw * 0.50}cqw`,
      duration: 0.18,
      ease: 'power2.inOut',
    }, 0.42);

    // Bars grow to final heights with 0.05 stagger
    barRefs.current.forEach((barEl, i) => {
      if (!barEl) return;
      tl.to(barEl, {
        height: `${BAR_FINALS[i]}cqw`,
        duration: 0.14,
        ease: 'power2.out',
      }, 0.44 + i * 0.015);
    });

    // ── 0.60 - 0.68 HOLD ────────────────────────────────────────
    // (hold position)

    // ── 0.68 - 0.82 SWIPE 2 ─────────────────────────────────────
    // Thumb moves up another 24% of screen height
    tl.to(thumbRef.current, {
      top: `${SWIPE2_THUMB_Y}%`,
      duration: 0.14,
      ease: 'power2.inOut',
    }, 0.68);

    tl.to(rippleRef.current, {
      top: `${SWIPE2_TIP_Y}%`,
      duration: 0.14,
      ease: 'power2.inOut',
    }, 0.68);

    // .inner reaches full scroll range
    tl.to(innerRef.current, {
      y: `-${scrollRangeCqw}cqw`,
      duration: 0.14,
      ease: 'power2.inOut',
    }, 0.68);

    // ── 0.82 - 0.94 THUMB LIFTS & COMING-SOON SLIDES UP ─────────
    tl.call(() => updateActiveFeature(2), [], 0.82);

    // Thumb lifts away
    tl.to(thumbRef.current, {
      yPercent: 30,
      opacity: 0,
      duration: 0.10,
      ease: 'power2.in',
    }, 0.82);

    tl.to(rippleRef.current, {
      opacity: 0,
      duration: 0.08,
      ease: 'power2.in',
    }, 0.82);

    // Coming-soon overlay slides up
    tl.to(comingSoonRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.12,
      ease: 'power3.out',
    }, 0.82);

    // ── 0.94 - 1.00 HOLD ────────────────────────────────────────
    // (holds until section unpins)

    // ScrollTrigger creation
    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      pin: true,
      start: 'top top',
      end: '+=320%',
      scrub: 0.6,
      anticipatePin: 1,
      animation: tl,
      onUpdate: (self) => {
        // Fallback feature highlight based on scroll progress
        const p = self.progress;
        if (p < 0.38) {
          updateActiveFeature(0);
        } else if (p < 0.80) {
          updateActiveFeature(1);
        } else {
          updateActiveFeature(2);
        }
      },
    });

    return () => {
      st.kill();
      tl.kill();
      idleFloat.kill();
      if (sectionEl) {
        sectionEl.removeEventListener('mousemove', handleMouseMove);
      }
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
      {/* Seam from previous section (Wonder World) */}
      <div className="mv-seam" aria-hidden="true" />

      {/* Plate wrapper centered */}
      <div ref={plateWrapRef} className="mv-plate-wrapper">
        {/* Airplane window plate image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/meet/plate.webp"
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
          {/* 1) VAYA logo block */}
          <div ref={logoBlockRef} className="mv-logo-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/meet/vaya-symbol.png"
              alt="VAYA"
              className="mv-logo-mark select-none"
              draggable={false}
            />
            <span className="mv-logo-wordmark select-none">VAYA</span>
            <div className="mv-tagline-row">
              <span className="mv-tagline-line" aria-hidden="true" />
              <span className="mv-logo-tagline">Stand In. Step Out.</span>
              <span className="mv-tagline-line" aria-hidden="true" />
            </div>
          </div>

          {/* 2) Headline */}
          <h2 ref={headlineRef} className="mv-headline">
            <span className="mv-headline-gold">VAYA</span> is an AI-powered travel intelligence platform designed to optimize trip planning and destination discovery.
          </h2>

          {/* 3) Paragraph */}
          <p ref={paragraphRef} className="mv-paragraph">
            It empowers travelers with crowd predictions, personalized recommendations, and data-driven travel insights.
          </p>

          {/* 4) Short gold line */}
          <div ref={goldLineRef} className="mv-gold-line" aria-hidden="true" />

          {/* 5) Feature items row */}
          <div ref={featuresRef} className="mv-features">
            {/* Feature 0 */}
            <div
              ref={(el) => { featureItemRefs.current[0] = el; }}
              className={`mv-feature-item ${activeFeature === 0 ? 'active' : ''}`}
              data-index="0"
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
            >
              <div className="mv-feature-icon-wrap" aria-hidden="true">
                {/* 8-point compass star */}
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
            >
              <div className="mv-feature-icon-wrap" aria-hidden="true">
                {/* Bar chart icon */}
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
          {/* Layer 1: Screen Layer */}
          <div
            ref={screenLayerRef}
            className="mv-screen-layer"
            style={{
              left: `${SCREEN.left * 100}%`,
              top: `${SCREEN.top * 100}%`,
              width: `${SCREEN.width * 100}%`,
              height: `${SCREEN.height * 100}%`,
            }}
          >
            {/* Fixed Status Bar */}
            <div className="mv-status-bar">
              <span>9:41</span>
              <div className="mv-status-icons" aria-hidden="true">
                {/* Cellular Signal */}
                <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor">
                  <rect x="0" y="7" width="2" height="4" rx="0.5" />
                  <rect x="4" y="5" width="2" height="6" rx="0.5" />
                  <rect x="8" y="2.5" width="2" height="8.5" rx="0.5" />
                  <rect x="12" y="0" width="2" height="11" rx="0.5" />
                </svg>
                {/* WiFi */}
                <svg width="13" height="10" viewBox="0 0 13 10" fill="currentColor">
                  <path d="M6.5 7.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-3.5-3a5.5 5.5 0 0 1 7 0 .8.8 0 0 1-.2 1.1.8.8 0 0 1-1.1-.2 3.9 3.9 0 0 0-4.4 0 .8.8 0 0 1-1.1.2.8.8 0 0 1-.2-1.1zm-3-3a9.5 9.5 0 0 1 13 0 .8.8 0 0 1-.2 1.1.8.8 0 0 1-1.1-.2 7.9 7.9 0 0 0-10.4 0 .8.8 0 0 1-1.1.2.8.8 0 0 1-.2-1.1z" />
                </svg>
                {/* Battery */}
                <svg width="18" height="9" viewBox="0 0 22 11" fill="currentColor">
                  <rect x="0" y="0" width="19" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="2" y="2" width="13" height="7" rx="1.5" />
                  <path d="M20.5 4v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Preview Pill */}
            <div className="mv-preview-pill">Preview – sample data</div>

            {/* Inner Scrollable Page */}
            <div ref={innerRef} className="mv-inner" style={{ height: '220cqw' }}>
              {/* Header row inside inner */}
              <div className="mv-app-header">
                {/* Hamburger menu */}
                <button type="button" className="mv-app-icon-btn" aria-label="Menu">
                  <svg viewBox="0 0 24 24">
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="15" y2="17" />
                  </svg>
                </button>
                {/* Center VAYA mark */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/meet/vaya-symbol.png"
                  alt="VAYA"
                  className="mv-app-logo-mark"
                  draggable={false}
                />
                {/* Bell icon */}
                <button type="button" className="mv-app-icon-btn" aria-label="Notifications">
                  <svg viewBox="0 0 24 24">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </button>
              </div>

              {/* Hero strip with snowy mountains */}
              <div className="mv-hero-strip" aria-hidden="true" />

              {/* Card 1: Where to next? */}
              <div className="mv-card">
                <div className="mv-card-title">Where to next?</div>
                <div className="mv-search-field">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Search cities, airports, or countries</span>
                </div>
              </div>

              {/* Card 2: Crowd forecast */}
              <div className="mv-card">
                <div className="mv-crowd-title">Crowd forecast</div>
                <div className="mv-crowd-subtitle">Expected airport crowds</div>

                {/* 7 Vertical Bars */}
                <div className="mv-bars-wrap">
                  {BAR_DAYS.map((day, idx) => {
                    const isWeekend = idx >= 5;
                    return (
                      <div key={day} className="mv-bar-col">
                        <div
                          ref={(el) => { barRefs.current[idx] = el; }}
                          className={`mv-bar ${isWeekend ? 'active-bar' : ''}`}
                          style={{ height: '6cqw' }}
                        />
                        <span className="mv-bar-label">{day}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Lower crowds expected row */}
                <div className="mv-lower-row">
                  <svg viewBox="0 0 24 24" className="people-icon" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <div className="mv-lower-text">
                    <span className="mv-lower-primary">Lower crowds expected</span>
                    <span className="mv-lower-secondary">Tue, Thu, 6AM – 10AM</span>
                  </div>
                  <svg viewBox="0 0 24 24" className="mv-lower-chevron" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>

                {/* Plan my trip button */}
                <button
                  type="button"
                  onClick={onWaitlist}
                  className="mv-plan-btn"
                >
                  Plan my trip &rarr;
                </button>
              </div>
            </div>

            {/* Bottom Tab Bar (Fixed) */}
            <div className="mv-tab-bar" aria-label="Bottom Navigation">
              {/* Home */}
              <div className="mv-tab-item active">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span className="mv-tab-label">Home</span>
              </div>
              {/* Trips */}
              <div className="mv-tab-item">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="mv-tab-label">Trips</span>
              </div>
              {/* Explore */}
              <div className="mv-tab-item">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
                <span className="mv-tab-label">Explore</span>
              </div>
              {/* Profile */}
              <div className="mv-tab-item">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="mv-tab-label">Profile</span>
              </div>
            </div>

            {/* Coming-Soon Overlay (Fixed) */}
            <div ref={comingSoonRef} className="mv-coming-soon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/meet/vaya-symbol.png"
                alt="VAYA"
                className="mv-coming-soon-logo"
                draggable={false}
              />
              <div className="mv-coming-soon-title">The VAYA app is coming soon</div>
              <div className="mv-coming-soon-sub">Get early access when we launch.</div>
              <button
                type="button"
                onClick={onWaitlist}
                className="mv-coming-soon-btn"
              >
                Join Waitlist
              </button>
            </div>
          </div>

          {/* Layer 2: Hand Phone Image (Covers bezel, notch, dynamic island, hand) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/meet/hand-phone.png"
            alt=""
            className="mv-hand-phone-img"
            draggable={false}
          />

          {/* Layer 3: Thumb Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={thumbRef}
            src="/meet/thumb.png"
            alt=""
            className="mv-thumb-img"
            draggable={false}
          />

          {/* Layer 4: Touch Ripple */}
          <div ref={rippleRef} className="mv-ripple" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
