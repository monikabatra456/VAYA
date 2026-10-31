'use client';

import React, { useEffect, useRef } from 'react';
import { Playfair_Display, Outfit } from 'next/font/google';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MeetPhoneScreen from './meet/MeetPhoneScreen';
import './meet/meet.css';

// Exact coordinate constants for hand-phone.png (851x1292) and screen hole
const SCREEN = {
  left: 0.0975,  // 83 / 851
  top: 0.0178,   // 23 / 1292
  width: 0.4559, // 388 / 851
  height: 0.6718, // 868 / 1292
  radius: 0.116,
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

const HEADLINE_LINES = [
  'VAYA is an AI-powered',
  'travel intelligence platform',
  'designed to optimize trip planning',
  'and destination discovery.',
];

const STATE_CAPTIONS = [
  { label: '01 · INTENT CAPTURE', title: 'Plan your trip in natural language.' },
  { label: '01 · INTENT CAPTURE', title: 'Describe your vibe, dates, and budget.' },
  { label: '02 · AGENTIC SYNTHESIS', title: 'Real-time routing, traffic, and timing calculation.' },
  { label: '03 · PRECISION ITINERARY', title: 'Day-by-day friction-free sequencing.' },
  { label: '04 · FOOTFALL FORECAST', title: 'Predictive models to bypass peak queues.' },
  { label: '05 · VAYA ACCESS', title: 'Experience the next era of autonomous travel.' },
];

export default function MeetVaya({ onWaitlist }: MeetVayaProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const plateWrapRef = useRef<HTMLDivElement>(null);
  const windowBgRef = useRef<HTMLImageElement>(null);
  const phoneStageRef = useRef<HTMLDivElement>(null);
  const dimOverlayRef = useRef<HTMLDivElement>(null);

  // Left column elements
  const lineInnersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const goldLineRef = useRef<HTMLDivElement>(null);
  const captionBoxRef = useRef<HTMLDivElement>(null);
  const captionLabelRef = useRef<HTMLSpanElement>(null);
  const captionTitleRef = useRef<HTMLSpanElement>(null);
  const featureItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const comingSoonBadgeRef = useRef<HTMLDivElement>(null);

  // Floating cards
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  // 5 screens inside phone
  const screensRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Preload & decode images to prevent frame drops
    const imagesToPreload = [
      '/meet/alpine-clouds.webp',
      '/meet/plate-frame.webp',
      '/meet/hand-phone.png',
      '/meet/vaya-symbol.png',
    ];
    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.decode?.().catch(() => {});
    });

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    // Set GPU transform hints
    if (phoneStageRef.current) gsap.set(phoneStageRef.current, { force3D: true });
    if (plateWrapRef.current) gsap.set(plateWrapRef.current, { force3D: true });
    [card1Ref.current, card2Ref.current, card3Ref.current].forEach((card) => {
      if (card) gsap.set(card, { force3D: true });
    });

    // Handle prefers-reduced-motion: Skip scrub, show final state
    if (isReduced) {
      if (phoneStageRef.current) gsap.set(phoneStageRef.current, { y: 0, rotation: 0, scale: 1, opacity: 1 });
      lineInnersRef.current.forEach((line) => {
        if (line) gsap.set(line, { yPercent: 0 });
      });
      if (paragraphRef.current) gsap.set(paragraphRef.current, { opacity: 1, y: 0 });
      if (goldLineRef.current) gsap.set(goldLineRef.current, { scaleX: 1 });
      featureItemRefs.current.forEach((item) => item?.classList.add('active'));
      screensRef.current.forEach((s, idx) => {
        if (s) gsap.set(s, { opacity: idx === 4 ? 1 : 0 });
      });
      return;
    }

    // ── INITIAL LOAD / REFRESH ENTRANCE ANIMATION ────────────────────────────
    // Plays so the first screen is never static or blank
    const entranceTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    entranceTl.to(lineInnersRef.current.filter(Boolean), {
      yPercent: 0,
      stagger: 0.08,
      duration: 0.9,
    }, 0.05);

    entranceTl.fromTo(
      [paragraphRef.current, goldLineRef.current],
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 },
      0.35
    );

    entranceTl.fromTo(
      featureItemRefs.current.filter(Boolean),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.08 },
      0.45
    );

    // Initial setups for Phone & Floating Cards
    if (phoneStageRef.current) {
      gsap.set(phoneStageRef.current, {
        y: '110vh',
        rotation: 6,
        scale: 0.92,
        transformOrigin: 'center bottom',
      });
    }

    if (card1Ref.current) gsap.set(card1Ref.current, { y: 120, opacity: 0 });
    if (card2Ref.current) gsap.set(card2Ref.current, { y: 150, opacity: 0 });
    if (card3Ref.current) gsap.set(card3Ref.current, { y: 100, opacity: 0 });

    // Initial state highlight on first feature item
    featureItemRefs.current[0]?.classList.add('active');

    // Helper to switch active feature highlight with zero React state overhead
    const setActiveFeaturePill = (idx: number) => {
      featureItemRefs.current.forEach((pill, i) => {
        if (!pill) return;
        if (idx === -1) {
          pill.classList.add('active');
        } else {
          pill.classList.toggle('active', i === idx);
        }
      });
    };

    // Helper to update left captions
    const updateCaption = (captionIdx: number) => {
      const data = STATE_CAPTIONS[captionIdx];
      if (!data) return;
      if (captionLabelRef.current) captionLabelRef.current.textContent = data.label;
      if (captionTitleRef.current) captionTitleRef.current.textContent = data.title;
    };

    // ── ONE MASTER PINNED TIMELINE (Shopify Editions Scrubbed Aesthetic) ───
    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        pin: true,
        scrub: 1,
        start: 'top top',
        end: isMobile ? '+=300%' : '+=500%',
        anticipatePin: 1,
      },
    });

    // A. Background parallax: scale 1.15 -> 1.0 across full timeline
    if (windowBgRef.current) {
      masterTl.fromTo(
        windowBgRef.current,
        { scale: 1.15 },
        { scale: 1.0, ease: 'none', duration: 1.0 },
        0.00
      );
    }

    // B. Headline reveal across 0.00 -> 0.12 (also scrubbed)
    masterTl.to(lineInnersRef.current.filter(Boolean), {
      yPercent: 0,
      stagger: 0.02,
      duration: 0.10,
      ease: 'power3.out',
    }, 0.00);

    // C. Phone Entrance: 10% - 30% from y: 110vh to y: 0, rotate: 0, scale: 1
    if (phoneStageRef.current) {
      masterTl.to(
        phoneStageRef.current,
        {
          y: 0,
          rotation: 0,
          scale: 1,
          duration: 0.20,
          ease: 'power3.out',
        },
        0.10
      );
    }

    // D. 3 Floating Glass Cards Drift (Shopify Editions Depth)
    // Card 1 ("Crowd: Low")
    if (card1Ref.current) {
      masterTl.to(card1Ref.current, { opacity: 1, duration: 0.08, ease: 'power2.out' }, 0.20);
      masterTl.to(card1Ref.current, { y: -120, duration: 0.62, ease: 'none' }, 0.20);
      masterTl.to(card1Ref.current, { opacity: 0, duration: 0.08, ease: 'power2.in' }, 0.74);
    }
    // Card 2 ("Best time: 7 AM")
    if (card2Ref.current) {
      masterTl.to(card2Ref.current, { opacity: 1, duration: 0.08, ease: 'power2.out' }, 0.22);
      masterTl.to(card2Ref.current, { y: -150, duration: 0.62, ease: 'none' }, 0.22);
      masterTl.to(card2Ref.current, { opacity: 0, duration: 0.08, ease: 'power2.in' }, 0.76);
    }
    // Card 3 ("Fair price: Rs 1,200")
    if (card3Ref.current) {
      masterTl.to(card3Ref.current, { opacity: 1, duration: 0.08, ease: 'power2.out' }, 0.25);
      masterTl.to(card3Ref.current, { y: -100, duration: 0.60, ease: 'none' }, 0.25);
      masterTl.to(card3Ref.current, { opacity: 0, duration: 0.08, ease: 'power2.in' }, 0.77);
    }

    // E. & F. PHONE SCREEN = REAL SCROLLING (30% - 85%) & LEFT CAPTIONS
    // Screen 0: Plan My Trip (30% - 44%)
    const s0 = screensRef.current[0];
    if (s0) {
      masterTl.call(() => {
        setActiveFeaturePill(0);
        updateCaption(1);
      }, [], 0.30);
      masterTl.to(s0, { yPercent: -35, duration: 0.14, ease: 'none' }, 0.30);
      masterTl.to(s0, { opacity: 0, duration: 0.03, ease: 'power1.inOut' }, 0.41);
    }

    // Screen 1: Creating your Jaipur trip (42% - 58%)
    const s1 = screensRef.current[1];
    if (s1) {
      masterTl.to(s1, { opacity: 1, duration: 0.03, ease: 'power1.inOut' }, 0.41);
      masterTl.call(() => {
        setActiveFeaturePill(1);
        updateCaption(2);
      }, [], 0.43);
      masterTl.to(s1, { yPercent: -35, duration: 0.15, ease: 'none' }, 0.42);
      masterTl.to(s1, { opacity: 0, duration: 0.03, ease: 'power1.inOut' }, 0.55);
    }

    // Screen 2: Itinerary (56% - 72%)
    const s2 = screensRef.current[2];
    if (s2) {
      masterTl.to(s2, { opacity: 1, duration: 0.03, ease: 'power1.inOut' }, 0.55);
      masterTl.call(() => {
        setActiveFeaturePill(1);
        updateCaption(3);
      }, [], 0.57);
      masterTl.to(s2, { yPercent: -38, duration: 0.15, ease: 'none' }, 0.56);
      masterTl.to(s2, { opacity: 0, duration: 0.03, ease: 'power1.inOut' }, 0.69);
    }

    // Screen 3: Crowd prediction (70% - 85%)
    const s3 = screensRef.current[3];
    if (s3) {
      masterTl.to(s3, { opacity: 1, duration: 0.03, ease: 'power1.inOut' }, 0.69);
      masterTl.call(() => {
        setActiveFeaturePill(2);
        updateCaption(4);
      }, [], 0.71);
      masterTl.to(s3, { yPercent: -32, duration: 0.14, ease: 'none' }, 0.70);
      masterTl.to(s3, { opacity: 0, duration: 0.03, ease: 'power1.inOut' }, 0.82);
    }

    // G. FINAL STATE (85% - 100%): COMING SOON
    const s4 = screensRef.current[4];
    if (s4) {
      masterTl.to(s4, { opacity: 1, duration: 0.04, ease: 'power2.out' }, 0.82);
      masterTl.call(() => {
        setActiveFeaturePill(-1);
        updateCaption(5);
      }, [], 0.84);
    }

    // H. EXIT TRANSITION: dim hero overlay (0 -> 0.5) and scale content to 0.96 as subsequent section scrolls over
    const exitST = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'bottom bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        if (dimOverlayRef.current) {
          gsap.set(dimOverlayRef.current, { opacity: p * 0.5 });
        }
        if (plateWrapRef.current) {
          gsap.set(plateWrapRef.current, { scale: 1.0 - p * 0.04 });
        }
      },
    });

    return () => {
      entranceTl.kill();
      masterTl.kill();
      exitST.kill();
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
      {/* Dimming overlay for exit to next section (opacity 0 -> 0.5, no blur) */}
      <div ref={dimOverlayRef} className="mv-dim-overlay" aria-hidden="true" />

      {/* Refined ambient header backlight (high-contrast logo halo) */}
      <div className="mv-seam" aria-hidden="true" />

      {/* Plate wrapper centered */}
      <div ref={plateWrapRef} className="mv-plate-wrapper">
        {/* ── WINDOW SCENE (BEHIND WINDOW FRAME) ────────────────────────────── */}
        <div className="mv-window-scene-viewport" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={windowBgRef}
            src="/meet/alpine-clouds.webp"
            alt="Golden flight over alpine clouds"
            className="mv-window-bg"
            draggable={false}
          />
          <div className="mv-window-bloom" />
          <div className="mv-gradient-overlay" />
        </div>

        {/* ── WINDOW FRAME MASK (PLATE) ─────────────────────────────────────── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/meet/plate-frame.webp"
          alt=""
          className="mv-plate-img"
          draggable={false}
          aria-hidden="true"
        />

        {/* ── 3 FLOATING GLASS CARDS (Shopify Editions Aesthetic) ───────────── */}
        <div ref={card1Ref} className="mv-floating-card mv-card-1">
          <div className="mv-card-icon">⚡</div>
          <div className="mv-card-text">
            <span className="mv-card-value">Crowd: Low</span>
            <span className="mv-card-sub">Hawa Mahal courtyard</span>
          </div>
        </div>

        <div ref={card2Ref} className="mv-floating-card mv-card-2">
          <div className="mv-card-icon">☀️</div>
          <div className="mv-card-text">
            <span className="mv-card-value">Best time: 7 AM</span>
            <span className="mv-card-sub">Amber Palace sunrise</span>
          </div>
        </div>

        <div ref={card3Ref} className="mv-floating-card mv-card-3">
          <div className="mv-card-icon">🛡️</div>
          <div className="mv-card-text">
            <span className="mv-card-value">Fair price: Rs 1,200</span>
            <span className="mv-card-sub">Verified guide benchmark</span>
          </div>
        </div>

        {/* ── LEFT COLUMN: Text Content & Navigation ────────────────────────── */}
        <div className="mv-left-col">
          {/* Coming Soon Pill Badge with Pulsing Dot */}
          <div ref={comingSoonBadgeRef} className="mv-coming-soon-badge">
            <span className="mv-pulse-dot" />
            <span>Agentic Travel Platform</span>
          </div>

          {/* Headline line-by-line reveal */}
          <h2 className="mv-headline">
            {HEADLINE_LINES.map((lineText, idx) => (
              <span key={lineText} className="mv-line-mask">
                <span
                  ref={(el) => {
                    lineInnersRef.current[idx] = el;
                  }}
                  className="mv-line-inner"
                >
                  {idx === 0 ? (
                    <>
                      <span className="mv-headline-gold">VAYA</span> is an AI-powered
                    </>
                  ) : (
                    lineText
                  )}
                </span>
              </span>
            ))}
          </h2>

          {/* Paragraph */}
          <p ref={paragraphRef} className="mv-paragraph">
            Real-time intelligence, smart itinerary generation, and data-driven travel insights. More destinations and features coming soon.
          </p>

          {/* Gold divider line */}
          <div ref={goldLineRef} className="mv-gold-line" aria-hidden="true" />

          {/* Dynamic Left State Caption */}
          <div ref={captionBoxRef} className="mv-caption-box">
            <div className="mv-state-caption">
              <span ref={captionLabelRef} className="mv-caption-label">
                {STATE_CAPTIONS[0].label}
              </span>
              <span ref={captionTitleRef} className="mv-caption-title">
                {STATE_CAPTIONS[0].title}
              </span>
            </div>
          </div>

          {/* 3 Feature Items */}
          <div className="mv-features">
            {/* Feature 0 */}
            <div
              ref={(el) => {
                featureItemRefs.current[0] = el;
              }}
              className="mv-feature-item"
            >
              <div className="mv-feature-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <span className="mv-feature-label">Smarter Travel</span>
            </div>

            <div className="mv-feature-divider" />

            {/* Feature 1 */}
            <div
              ref={(el) => {
                featureItemRefs.current[1] = el;
              }}
              className="mv-feature-item"
            >
              <div className="mv-feature-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <span className="mv-feature-label">Data-Driven Decisions</span>
            </div>

            <div className="mv-feature-divider" />

            {/* Feature 2 */}
            <div
              ref={(el) => {
                featureItemRefs.current[2] = el;
              }}
              className="mv-feature-item"
            >
              <div className="mv-feature-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <span className="mv-feature-label">Better Experiences</span>
            </div>
          </div>
        </div>

        {/* ── PHONE + HAND LAYER GROUP (Rises together from y: 110vh) ───────── */}
        <div
          ref={phoneStageRef}
          className="mv-phone-stage"
          style={{
            left: PHONE_BOX.left,
            top: PHONE_BOX.top,
            width: PHONE_BOX.width,
          }}
        >
          {/* Screen hole container */}
          <div
            className="mv-screen-layer"
            style={{
              left: `${SCREEN.left * 100}%`,
              top: `${SCREEN.top * 100}%`,
              width: `${SCREEN.width * 100}%`,
              height: `${SCREEN.height * 100}%`,
              borderRadius: `${SCREEN.radius * 388}px`,
            }}
          >
            <MeetPhoneScreen
              onWaitlist={onWaitlist}
              screensRef={screensRef}
            />
          </div>

          {/* Hand back image (phone body, bezel, wrist, palm) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/meet/hand-back.png"
            alt=""
            className="mv-hand-back-img"
            draggable={false}
            aria-hidden="true"
          />

          {/* Thumb image resting along right edge in original pose */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/meet/thumb.png"
            alt=""
            className="mv-thumb-img"
            draggable={false}
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
