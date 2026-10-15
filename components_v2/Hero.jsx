'use client';

import React, { useEffect, useRef } from 'react';
import { createHeroTimeline } from './heroTimeline';

export default function Hero() {
  const sectionRef = useRef(null);
  const bg1Ref = useRef(null);
  const bg2Ref = useRef(null);
  const planeRef = useRef(null);
  const titleRef = useRef(null);
  const taglinesRef = useRef(null);
  const scrimRef = useRef(null);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;

    // Preload & decode scene2 in background so crossfade has zero freeze
    const scene2Src = isMobile ? '/hero/mobile/scene2-m.webp' : '/hero/scene2.webp';
    const img = new Image();
    img.src = scene2Src;
    if (img.decode) {
      img.decode().catch(() => {});
    }

    const tl = createHeroTimeline({
      section: sectionRef.current,
      bg1: bg1Ref.current,
      bg2: bg2Ref.current,
      plane: planeRef.current,
      title: titleRef.current,
      taglines: taglinesRef.current,
      scrim: scrimRef.current,
      isMobile,
    });

    return () => {
      if (tl) {
        tl.scrollTrigger?.kill();
        tl.kill();
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative w-full overflow-hidden bg-[#f3f2ee]"
      style={{
        height: '100svh',
        maxHeight: '100svh',
      }}
      aria-label="VAYA — Stand In. Step Out."
    >
      {/* ── Layer 1: Frame 1 Background (Bright cloud valley, no plane) ── */}
      <div
        ref={bg1Ref}
        className="absolute inset-0 w-full h-full pointer-events-none will-change-transform"
      >
        <picture>
          <source
            media="(max-width: 768px)"
            srcSet="/hero/mobile/hero-noplane-m.webp"
          />
          <img
            src="/hero/hero-noplane.webp"
            alt="Alpine Cloud Valley"
            className="w-full h-full object-cover select-none"
            fetchPriority="high"
            decoding="async"
            draggable={false}
          />
        </picture>
      </div>

      {/* ── Layer 2: Frame 2 Background (Lake valley, crossfades in) ── */}
      <div
        ref={bg2Ref}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-0 will-change-transform"
      >
        <picture>
          <source
            media="(max-width: 768px)"
            srcSet="/hero/mobile/scene2-m.webp"
          />
          <img
            src="/hero/scene2.webp"
            alt="Lake Valley Destination"
            className="w-full h-full object-cover select-none"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </picture>
      </div>

      {/* ── Layer 3: Contrast Scrim (Light, soft white gradient overlay for crisp text readability) ── */}
      <div
        ref={scrimRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.35) 50%, rgba(243, 242, 238, 0.65) 100%)',
        }}
        aria-hidden="true"
      />

      {/* ── Layer 4: Plane Cutout (Door jaata hai: 35% x, 56% y -> 62% x, 49% y, scale 1 -> 0.18) ── */}
      <div
        ref={planeRef}
        className="absolute pointer-events-none will-change-transform z-10 -translate-x-1/2 -translate-y-1/2
          left-[32%] top-[58%] w-[clamp(180px,46vw,260px)]
          md:left-[35%] md:top-[56%] md:w-[clamp(240px,28vw,440px)]"
        aria-hidden="true"
      >
        <picture>
          <source media="(max-width: 768px)" srcSet="/hero/mobile/plane-m.webp" />
          <img
            src="/hero/plane.webp"
            alt="VAYA Airliner"
            className="w-full h-auto object-contain select-none"
            draggable={false}
          />
        </picture>
      </div>

      {/* ── Layer 5: Columbus Travel-Style Typography Overlay ── */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* LEFT / MOBILE CENTER: "VAYA" (Single semantic H1) */}
        <div
          ref={titleRef}
          className="absolute will-change-transform opacity-0 select-none
            left-1/2 -translate-x-1/2 top-[42%] -translate-y-1/2 text-center
            md:left-[9vw] md:top-[45vh] md:translate-x-0 md:-translate-y-1/2 md:text-left"
        >
          <h1
            className="font-[200] text-[#1e2a3f] leading-none uppercase select-none text-[18vw] md:text-[clamp(64px,11vw,190px)]"
            style={{
              letterSpacing: '0.25em',
              textShadow: '0 2px 20px rgba(255, 255, 255, 0.75)',
            }}
          >
            VAYA
          </h1>
        </div>

        {/* RIGHT / MOBILE CENTER: Taglines block */}
        <div
          ref={taglinesRef}
          className="absolute will-change-transform opacity-0 select-none
            left-1/2 -translate-x-1/2 top-[55%] -translate-y-1/2 text-center w-full px-6
            md:left-auto md:right-[8vw] md:top-[58vh] md:translate-x-0 md:-translate-y-1/2 md:text-left md:w-auto md:max-w-[380px]"
        >
          <p
            className="font-[300] text-[#2c3a52] leading-tight select-none mb-1.5 text-[20px] md:text-[clamp(18px,1.8vw,28px)]"
            style={{
              textShadow: '0 1px 12px rgba(255, 255, 255, 0.85)',
            }}
          >
            Know before you go
          </p>
          <p
            className="font-[300] text-[#2c3a52] leading-normal select-none text-[16px] md:text-[clamp(15px,1.5vw,24px)]"
            style={{
              opacity: 0.85,
              textShadow: '0 1px 8px rgba(255, 255, 255, 0.85)',
            }}
          >
            Step in, step out
          </p>
        </div>
      </div>

      {/* ── Scroll hint (fades out early) ── */}
      <div
        className="absolute bottom-[4vh] left-1/2 -translate-x-1/2 pointer-events-none z-10 flex flex-col items-center select-none"
        style={{ opacity: 0.75 }}
      >
        <span className="text-[11px] font-light uppercase tracking-[0.25em] text-[#1e2a3f]">
          Scroll to explore
        </span>
        <svg
          className="w-3.5 h-3.5 text-[#1e2a3f] mt-1.5 animate-bounce"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
