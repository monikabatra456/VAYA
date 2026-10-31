'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Playfair_Display, Outfit } from 'next/font/google';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './meet/meet.css';

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
  const textColRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Left column refs
  const goldLineRef = useRef<HTMLDivElement>(null);
  const wordElsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const subtextLinesRef = useRef<(HTMLSpanElement | null)[]>([]);
  const shimmerTriggeredRef = useRef<boolean>(false);
  const featureItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 3 Steps: 0 = Smarter Travel, 1 = Data-Driven Decisions, 2 = Better Experiences
  const [activeFeature, setActiveFeature] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);

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

    // 1. Headline words reveal: translateY(24px) -> 0, opacity 0 -> 1 (no blur)
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const checkMobile = () => {
      const mob = window.innerWidth < 1024;
      setIsMobile(mob);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isReduced) {
      applyRevealProgress(1);
      updateActiveFeature(0);
      return;
    }

    updateActiveFeature(0);

    // Idle life: floating animation for phone (+-3px, 4s sine cycle)
    let idleFloat: gsap.core.Tween | null = null;
    if (phoneRef.current) {
      idleFloat = gsap.to(phoneRef.current, {
        y: '+=6',
        duration: 4,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
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
        if (plateWrapRef.current) {
          const s = 1.06 - 0.06 * self.progress;
          const op = 0.75 + 0.25 * self.progress;
          plateWrapRef.current.style.transform = `scale(${s})`;
          plateWrapRef.current.style.opacity = `${op}`;
        }
      },
    });

    // If entered directly (refresh at section, anchor link)
    if (sectionRef.current) {
      const bcr = sectionRef.current.getBoundingClientRect();
      if (bcr.top <= 10 && bcr.bottom > 100) {
        applyRevealProgress(1);
      } else {
        applyRevealProgress(entryST.progress);
      }
    }

    // Mobile Scrubbing / Autoplay Fallback
    const isMobileDevice = window.innerWidth < 1024;
    let pinnedST: ScrollTrigger | null = null;
    let exitST: ScrollTrigger | null = null;

    if (isMobileDevice) {
      const v = videoRef.current;
      if (v) {
        v.loop = true;
        v.play().catch(() => {});
      }
    } else {
      // ── DESKTOP PINNED TIMELINE: Video scrubbing through ~220svh ────────
      const video = videoRef.current;

      pinnedST = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=220%',
        pin: true,
        scrub: 0.4,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;

          // Scrub video currentTime smoothly across duration
          if (video && video.duration && !isNaN(video.duration)) {
            const targetTime = p * video.duration;
            video.currentTime = Math.min(Math.max(targetTime, 0), video.duration - 0.001);
          }

          // Bullet items light up at 0%, 35%, 70%
          if (p < 0.35) {
            updateActiveFeature(0);
          } else if (p < 0.70) {
            updateActiveFeature(1);
          } else {
            updateActiveFeature(2);
          }
        },
      });

      // Exit transition: text moves up (translateY 0 -> -30px) and fades out smoothly
      if (textColRef.current) {
        exitST = ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'bottom 100%',
          end: 'bottom 80%',
          scrub: true,
          onUpdate: (self) => {
            const ep = self.progress;
            if (textColRef.current) {
              textColRef.current.style.transform = `translateY(calc(-50% - ${ep * 30}px))`;
              textColRef.current.style.opacity = `${1 - ep}`;
            }
            if (phoneRef.current) {
              phoneRef.current.style.transform = `translateY(-${ep * 40}px)`;
              phoneRef.current.style.opacity = `${1 - ep}`;
            }
          },
        });
      }
    }

    // Fallback: Intersection observer to play video if scrubbing stalls or on mobile
    const io = new IntersectionObserver(
      ([entry]) => {
        const v = videoRef.current;
        if (!v) return;
        if (entry.isIntersecting) {
          if (isMobileDevice) {
            v.play().catch(() => {});
          }
        } else {
          v.pause();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      io.observe(sectionRef.current);
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      idleFloat?.kill();
      entryST.kill();
      pinnedST?.kill();
      exitST?.kill();
      io.disconnect();
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
      {/* Refined ambient header backlight */}
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

        {/* ── DESKTOP & MOBILE CONTENT CONTAINER ────────────────────── */}
        <div className="mv-content-container">
          {/* ── LEFT COLUMN: Text Content ─────────────────────────────── */}
          <div ref={textColRef} className="mv-left-col">
            {/* 1) Headline with word-by-word reveal */}
            <h2 className="mv-headline">
              {HEADLINE_WORDS.map((w, i) => (
                <span
                  key={i}
                  ref={(el) => {
                    wordElsRef.current[i] = el;
                  }}
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
                  ref={(el) => {
                    subtextLinesRef.current[0] = el;
                  }}
                  className="mv-subtext-line"
                >
                  It empowers travelers with crowd predictions,
                </span>
              </span>
              <span className="mv-subtext-line-mask">
                <span
                  ref={(el) => {
                    subtextLinesRef.current[1] = el;
                  }}
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
                ref={(el) => {
                  featureItemRefs.current[0] = el;
                }}
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
                ref={(el) => {
                  featureItemRefs.current[1] = el;
                }}
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
                ref={(el) => {
                  featureItemRefs.current[2] = el;
                }}
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

            {/* 5) Gold Join Waitlist pill button */}
            <div className="mv-cta-wrap">
              <button
                type="button"
                onClick={onWaitlist}
                className="mv-waitlist-btn"
              >
                Join Waitlist →
              </button>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Clean iPhone Mockup ────────────────────── */}
          <div ref={phoneRef} className="mv-phone-wrap">
            <div className="mv-iphone-frame">
              {/* Dynamic Island */}
              <div className="mv-dynamic-island" aria-hidden="true" />

              {/* Screen Mask */}
              <div className="mv-iphone-screen">
                <video
                  ref={videoRef}
                  src="/video/phone-ui.mp4"
                  poster="/phone-ui-poster.jpg"
                  preload="auto"
                  muted
                  playsInline
                  className="mv-phone-video"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── Seamless transition from Section 4 dark cabin into Section 5 peach sunset ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '24svh',
          pointerEvents: 'none',
          zIndex: 25,
          background: 'linear-gradient(to bottom, rgba(17, 14, 12, 0) 0%, rgba(249, 238, 225, 0.4) 50%, #f9eee1 100%)',
        }}
      />
    </section>
  );
}