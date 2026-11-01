// src/components/MeetVaya2.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './meetVaya2.module.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface MeetVaya2Props {
  onWaitlist?: () => void;
}

export default function MeetVaya2({ onWaitlist }: MeetVaya2Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const leftContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let targetTime = 0;
    let displayedTime = 0;
    let rafId: number | null = null;
    let st: ScrollTrigger | null = null;

    // Entrance animation: left content elements fade up 24px
    const entranceTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        if (!leftContentRef.current) return;
        const elements = leftContentRef.current.children;
        if (isReduced) {
          gsap.set(elements, { opacity: 1, y: 0 });
        } else {
          gsap.fromTo(
            elements,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.12,
              ease: 'power2.out',
            }
          );
        }
      },
    });

    // Unlocking iOS / Safari seeking on user interaction
    const unlockSeeking = () => {
      if (video.paused && video.readyState >= 2) {
        video.play().then(() => video.pause()).catch(() => {});
      }
      window.removeEventListener('touchstart', unlockSeeking);
    };
    window.addEventListener('touchstart', unlockSeeking, { passive: true });

    const setupScrub = () => {
      video.pause();
      const dur = video.duration || 8;

      if (isReduced) {
        video.currentTime = dur;
        return;
      }

      // Smooth RAF scrub loop with lerp 0.18
      const tick = () => {
        displayedTime += (targetTime - displayedTime) * 0.18;
        if (Math.abs(video.currentTime - displayedTime) > 1 / 60) {
          video.currentTime = Math.max(0, Math.min(dur, displayedTime));
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);

      st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=240%',
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          if (p < 0.05) {
            targetTime = 0;
          } else if (p > 0.95) {
            targetTime = dur;
          } else {
            targetTime = ((p - 0.05) / 0.90) * dur;
          }
        },
      });

      ScrollTrigger.refresh();
    };

    if (video.readyState >= 1) {
      setupScrub();
    } else {
      video.addEventListener('loadedmetadata', setupScrub, { once: true });
    }

    return () => {
      window.removeEventListener('touchstart', unlockSeeking);
      video.removeEventListener('loadedmetadata', setupScrub);
      if (rafId) cancelAnimationFrame(rafId);
      if (st) st.kill();
      entranceTrigger.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} id="meet-vaya" className={styles.section} aria-label="Meet VAYA">
      <div className={styles.sceneWrapper}>
        {/* Left Content (Text & Branding) */}
        <div ref={leftContentRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Brand block centered at left 21.2%, top 8% */}
          <div className={styles.brandBlock}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/vaya-logo-500.webp" alt="VAYA Logo" className={styles.brandLogo} />
            <span className={styles.brandName}>V A Y A</span>
            <span className={styles.brandTagline}>Stand In. Step Out.</span>
          </div>

          {/* Thin gold accent lines to left and right at top 21% */}
          <div className={styles.goldLineLeft} aria-hidden="true" />
          <div className={styles.goldLineRight} aria-hidden="true" />

          {/* Headline */}
          <h2 className={styles.headline}>
            <span className={styles.headlineGold}>VAYA</span> is an AI-powered travel intelligence
            platform designed to optimize trip planning and destination discovery.
          </h2>

          {/* Paragraph */}
          <p className={styles.paragraph}>
            It empowers travelers with crowd predictions, personalized recommendations, and data-driven
            travel insights.
          </p>

          {/* Gold short divider */}
          <div className={styles.divider} aria-hidden="true" />

          {/* Vertical dividers between icon items */}
          <div className={styles.vertDivider1} aria-hidden="true" />
          <div className={styles.vertDivider2} aria-hidden="true" />

          {/* Icon row */}
          <div className={styles.iconRow}>
            {/* 1: Smarter Travel */}
            <div className={styles.iconItem} style={{ left: '13.9%', top: 0 }}>
              <div className={styles.iconCircle}>
                <svg width="1.6cqw" height="1.6cqw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span className={styles.iconLabel}>Smarter Travel.</span>
            </div>

            {/* 2: Data-Driven Decisions */}
            <div className={styles.iconItem} style={{ left: '50%', top: 0 }}>
              <div className={styles.iconCircle}>
                <svg width="1.6cqw" height="1.6cqw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <span className={styles.iconLabel}>Data-Driven Decisions.</span>
            </div>

            {/* 3: Better Experiences */}
            <div className={styles.iconItem} style={{ left: '88.5%', top: 0 }}>
              <div className={styles.iconCircle}>
                <svg width="1.6cqw" height="1.6cqw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <span className={styles.iconLabel}>Better Experiences.</span>
            </div>
          </div>
        </div>

        {/* Phone Screen Video */}
        <video
          ref={videoRef}
          src="/video/phone-ui.mp4"
          poster="/video/phone-ui-poster.jpg"
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          className={styles.phoneVideo}
        />
      </div>
    </section>
  );
}
