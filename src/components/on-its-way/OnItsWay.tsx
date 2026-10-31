// src/components/on-its-way/OnItsWay.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Playfair_Display, Kaushan_Script, Plus_Jakarta_Sans } from 'next/font/google';
import gsap from 'gsap';
import styles from './OnItsWay.module.css';
import {
  VIEWBOX,
  FLIGHT_PATH_D,
  SWOOSH_PATH_D,
} from './pathConstants';
import { createOnItsWayTimeline } from './onItsWayTimeline';

// Load typography matching design reference
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-serif',
  display: 'swap',
});

const kaushan = Kaushan_Script({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-script',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

interface OnItsWayProps {
  /** Optional ref to external navbar wrapper for timeline control */
  navbarRef?: React.RefObject<HTMLDivElement>;
}

export default function OnItsWay({ navbarRef }: OnItsWayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Background and scenery refs
  const bgRef = useRef<HTMLDivElement>(null);
  const cloudsRef = useRef<HTMLDivElement>(null);

  // SVG & Flight refs
  const svgRef = useRef<SVGSVGElement>(null);
  const flightPathRef = useRef<SVGPathElement>(null);
  const maskPathRef = useRef<SVGPathElement>(null);

  // Airplane HTML refs (rendered via next/image)
  const planeWrapperRef = useRef<HTMLDivElement>(null);
  const planeFloatRef = useRef<HTMLDivElement>(null);
  const contrail1Ref = useRef<HTMLSpanElement>(null);
  const contrail2Ref = useRef<HTMLSpanElement>(null);

  // Content typography refs
  const eyebrowLeftLineRef = useRef<HTMLSpanElement>(null);
  const eyebrowRightLineRef = useRef<HTMLSpanElement>(null);
  const eyebrowTextRef = useRef<HTMLSpanElement>(null);
  const headlineSerifRef = useRef<HTMLSpanElement>(null);
  const headlineScriptRef = useRef<HTMLSpanElement>(null);
  const swooshPathRef = useRef<SVGPathElement>(null);
  const subtextLine1Ref = useRef<HTMLSpanElement>(null);
  const subtextLine2Ref = useRef<HTMLSpanElement>(null);

  // Bottom "COMING SOON" inside 100svh viewport refs
  const comingSoonLineLeftRef = useRef<HTMLSpanElement>(null);
  const comingSoonLineRightRef = useRef<HTMLSpanElement>(null);
  const comingSoonTextRef = useRef<HTMLSpanElement>(null);
  const goldDividerRef = useRef<HTMLDivElement>(null);

  // GSAP animations initialization and teardown
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isReduced = mq.matches;
    let isCancelled = false;
    let timelineCtx: gsap.Context | null = null;

    const init = async () => {
      // Await plane image decode (img.decode()) and document.fonts.ready
      const img = new window.Image();
      img.src = '/plane-vaya.png';
      try {
        await Promise.all([
          img.decode ? img.decode().catch(() => {}) : Promise.resolve(),
          typeof document !== 'undefined' && document.fonts?.ready ? document.fonts.ready : Promise.resolve(),
        ]);
      } catch {
        // Fallback
      }

      if (isCancelled || !containerRef.current) return;

      timelineCtx = gsap.context(() => {
        createOnItsWayTimeline(
          {
            container: containerRef.current,
            svg: svgRef.current,
            bg: bgRef.current,
            navbar: navbarRef?.current || null,
            eyebrowLeftLine: eyebrowLeftLineRef.current,
            eyebrowRightLine: eyebrowRightLineRef.current,
            eyebrowText: eyebrowTextRef.current,
            headlineSerif: headlineSerifRef.current,
            headlineScript: headlineScriptRef.current,
            swooshPath: swooshPathRef.current,
            subtextLines: [subtextLine1Ref.current, subtextLine2Ref.current].filter(
              Boolean
            ) as HTMLElement[],
            flightPath: flightPathRef.current,
            maskPath: maskPathRef.current,
            planeWrapper: planeWrapperRef.current,
            planeFloat: planeFloatRef.current,
            contrailStreaks: [contrail1Ref.current, contrail2Ref.current].filter(
              Boolean
            ) as HTMLElement[],
            cloudsLayer: cloudsRef.current,
            comingSoonLineLeft: comingSoonLineLeftRef.current,
            comingSoonLineRight: comingSoonLineRightRef.current,
            comingSoonText: comingSoonTextRef.current,
            goldDivider: goldDividerRef.current,
          },
          isReduced
        );
      }, containerRef);
    };

    init();

    return () => {
      isCancelled = true;
      if (timelineCtx) timelineCtx.revert();
    };
  }, [navbarRef]);

  return (
    <section
      ref={containerRef}
      id="on-its-way"
      aria-label="VAYA — On Its Way"
      className={`${styles.container} ${playfair.variable} ${kaushan.variable} ${jakarta.variable}`}
    >
      {/* Full-bleed sunset sky + mountains background */}
      <div ref={bgRef} className={styles.backgroundWrapper} aria-hidden="true">
        <picture>
          <source
            media="(max-width: 1023px)"
            srcSet="/assets/on-its-way/bg-sky-mountains-mobile.webp"
          />
          <Image
            src="/assets/on-its-way/bg-sky-mountains.webp"
            alt="Golden sunrise over alpine mountain peaks and cloud sea"
            fill
            priority
            quality={92}
            sizes="100vw"
            className={styles.backgroundImage}
          />
        </picture>
      </div>

      {/* Clouds Front Layer: Slow horizontal drift */}
      <div ref={cloudsRef} className={styles.cloudsFrontLayer} aria-hidden="true">
        <Image
          src="/assets/on-its-way/clouds-front.webp"
          alt="Foreground dreamy cloud overlay"
          fill
          quality={92}
          sizes="110vw"
          className={styles.cloudsImage}
        />
      </div>

      {/* SVG Flight Trail */}
      <svg
        ref={svgRef}
        className={styles.svgOverlay}
        viewBox={VIEWBOX}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          {/* Start the visible dash at x = 64px via clipPath to clear left Roman nav */}
          <clipPath id="roman-nav-clip">
            <rect x="64" y="0" width="3000" height="2000" />
          </clipPath>
          {/* Mask to reveal the dashed path without breaking round dash dots */}
          <mask id="flight-trail-mask" maskUnits="userSpaceOnUse">
            <path
              ref={maskPathRef}
              d={FLIGHT_PATH_D}
              fill="none"
              stroke="#ffffff"
              strokeWidth="12"
              strokeLinecap="round"
            />
          </mask>
        </defs>

        {/* Reference path for GSAP getPointAtLength */}
        <path
          ref={flightPathRef}
          d={FLIGHT_PATH_D}
          fill="none"
          stroke="transparent"
          strokeWidth="1"
        />

        {/* Visible Dashed Trail revealed by mask and clipped past Roman nav */}
        <path
          d={FLIGHT_PATH_D}
          fill="none"
          stroke="var(--gold)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="2 9"
          mask="url(#flight-trail-mask)"
          clipPath="url(#roman-nav-clip)"
          style={{ clipPath: 'inset(0 0 0 64px)' }}
        />
      </svg>

      {/* Realistic Airplane with next/image (fuselage tail anchored at 3% 78%) */}
      <div
        ref={planeWrapperRef}
        className={styles.planeWrapper}
        aria-hidden="true"
      >
        <div ref={planeFloatRef} className={styles.planeFloat}>
          <div className={styles.planeInner}>
            {/* Contrail streaks behind the 2 engines */}
            <span
              ref={contrail1Ref}
              className={`${styles.contrail} ${styles.contrail1}`}
            />
            <span
              ref={contrail2Ref}
              className={`${styles.contrail} ${styles.contrail2}`}
            />

            {/* Plane Real Image with next/image - transparent cutout */}
            <Image
              src="/plane-vaya.png"
              alt="VAYA airliner"
              width={1600}
              height={561}
              priority
              sizes="(max-width: 768px) 44vw, (max-width: 1200px) 17vw, 340px"
              className={styles.planeImage}
            />
          </div>
        </div>
      </div>

      {/* Centered Typography Content Block */}
      <div className={styles.contentBlock}>
        {/* 1. Eyebrow: "VAYA" in small caps, letter-spaced, gold, with thin gold lines */}
        <div className={styles.eyebrow} aria-hidden="true">
          <span
            ref={eyebrowLeftLineRef}
            className={`${styles.eyebrowLine} ${styles.eyebrowLineLeft}`}
          />
          <span ref={eyebrowTextRef} className={styles.eyebrowText}>
            VAYA
          </span>
          <span
            ref={eyebrowRightLineRef}
            className={`${styles.eyebrowLine} ${styles.eyebrowLineRight}`}
          />
        </div>

        {/* 2. Headline: Accessible single <h1> */}
        <h1 className={styles.headline}>
          <span ref={headlineSerifRef} className={styles.headlineSerif}>
            On Its
          </span>
          <span className={styles.headlineScriptWrapper}>
            <span ref={headlineScriptRef} className={styles.headlineScript}>
              Way
            </span>
            {/* Hand-drawn swoosh underline SVG */}
            <svg
              className={styles.swooshSvg}
              viewBox="0 0 180 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                ref={swooshPathRef}
                d={SWOOSH_PATH_D}
                stroke="var(--gold)"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        {/* 3. Subtext: Two lines */}
        <div className={styles.subtext}>
          <span ref={subtextLine1Ref} className={styles.subtextLine}>
            Something exciting is taking off soon...
          </span>
          <span ref={subtextLine2Ref} className={styles.subtextLine}>
            Stay tuned for what&apos;s next with VAYA.
          </span>
        </div>
      </div>

      {/* Soft bottom cream-cloud fade layer behind COMING SOON */}
      <div className={styles.bottomFadeOverlay} aria-hidden="true" />

      {/* "COMING SOON" Section inside 100svh first viewport, in cloud sea */}
      <div className={styles.comingSoonBlock}>
        <div className={styles.comingSoonRow}>
          <span
            ref={comingSoonLineLeftRef}
            className={`${styles.comingSoonLine} ${styles.comingSoonLineLeft}`}
            aria-hidden="true"
          />
          <span ref={comingSoonTextRef} className={styles.comingSoonText}>
            COMING SOON
          </span>
          <span
            ref={comingSoonLineRightRef}
            className={`${styles.comingSoonLine} ${styles.comingSoonLineRight}`}
            aria-hidden="true"
          />
        </div>

        {/* Thin gold line with tiny gold airplane icon scaled up ~1.3x */}
        <div ref={goldDividerRef} className={styles.goldDivider} aria-hidden="true">
          <span className={styles.goldDividerLine} />
          <svg
            className={styles.goldAirplaneIcon}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
          <span className={styles.goldDividerLine} />
        </div>
      </div>
    </section>
  );
}
