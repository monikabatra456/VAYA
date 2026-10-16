'use client';

import React, { useEffect, useRef, useState } from 'react';
import { HeroScene } from './HeroScene';
import AmbientObjects from './AmbientObjects';
import { initHeroAnimation } from './heroTimeline';

export default function Hero() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const planeRef = useRef(null);
  const scrollHintRef = useRef(null);
  const posterRef = useRef(null);

  // Desktop letter refs
  const dVRef = useRef(null);
  const dARef1 = useRef(null);
  const dYRef = useRef(null);
  const dARef2 = useRef(null);
  const dTag1Ref = useRef(null);
  const dTag2Ref = useRef(null);

  // Mobile letter refs
  const mVRef = useRef(null);
  const mARef1 = useRef(null);
  const mYRef = useRef(null);
  const mARef2 = useRef(null);
  const mTag1Ref = useRef(null);
  const mTag2Ref = useRef(null);

  const [webglReady, setWebglReady] = useState(false);
  const [scene2Active, setScene2Active] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    setIsMobileDevice(isMobile);

    const isLowEnd =
      typeof navigator !== 'undefined' &&
      ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4));

    const titleLetters = isMobile
      ? [mVRef.current, mARef1.current, mYRef.current, mARef2.current]
      : [dVRef.current, dARef1.current, dYRef.current, dARef2.current];

    const tagline1 = isMobile ? mTag1Ref.current : dTag1Ref.current;
    const tagline2 = isMobile ? mTag2Ref.current : dTag2Ref.current;

    const canvas = canvasRef.current;
    if (!canvas || isLowEnd) {
      const animInstance = initHeroAnimation({
        section: sectionRef.current,
        plane: planeRef.current,
        titleLetters,
        tagline1,
        tagline2,
        scrollHint: scrollHintRef.current,
        heroScene: null,
        onScene2Change: setScene2Active,
        isMobile,
      });
      return () => {
        if (animInstance) animInstance.kill();
      };
    }

    let heroScene;
    try {
      heroScene = new HeroScene({ canvas, isMobile });
    } catch (e) {
      console.warn('HeroScene init error, fallback active', e);
      return;
    }

    // Initialize animation timeline
    const animInstance = initHeroAnimation({
      section: sectionRef.current,
      plane: planeRef.current,
      titleLetters,
      tagline1,
      tagline2,
      scrollHint: scrollHintRef.current,
      heroScene,
      onScene2Change: setScene2Active,
      isMobile,
    });

    // Fade in canvas once critical textures decode
    heroScene.whenReady().then(() => {
      heroScene.render({ progress: 0, mix: 0, haze: 0, tilt: 0.06, time: 0 });
      setWebglReady(true);
    });

    // Debounced resize handler
    let resizeTimer = null;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        heroScene.resize(W, H);
        if (animInstance) animInstance.refresh();
      }, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (animInstance) animInstance.kill();
      if (heroScene) heroScene.destroy();
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
      {/* ── 1. Static LCP Poster (hero-noplane + plane DOM layer, seamless 200ms swap) ── */}
      <div
        ref={posterRef}
        className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200 ease-out z-0 ${
          webglReady ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <picture>
          <source media="(max-width: 768px)" srcSet="/hero/mobile/hero-noplane-m.webp" />
          <img
            src="/hero/hero-noplane.webp"
            alt="Alpine Mountain Valley"
            className="w-full h-full object-cover select-none"
            fetchPriority="high"
            decoding="async"
            draggable={false}
          />
        </picture>
      </div>

      {/* ── 2. OGL WebGL Canvas (1 draw call, NO CSS transform/filter, integer pixels) ── */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full block pointer-events-none transition-opacity duration-200 ease-out z-[1] ${
          webglReady ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          width: '100vw',
          height: '100svh',
        }}
      />

      {/* ── 3. Plane Cutout Sprite (Static at scroll=0, flies nose-first to valley on scroll) ── */}
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

      {/* ── 4. Scene 2 Ambient Live Objects: Drifting Birds & Hot Air Balloons ── */}
      <AmbientObjects visible={scene2Active} isMobile={isMobileDevice} />

      {/* ── 5. Movie-Style Typography Overlay with DOWN TO UP Mask Reveals ── */}

      {/* DESKTOP LAYOUT (md:block): Left "VAYA" staggered letters, Right Taglines */}
      <div className="hidden md:block absolute inset-0 pointer-events-none z-20">
        {/* LEFT: "VAYA" in NAVY #14213d, Outfit 200, clamp(72px, 12vw, 210px), letter-by-letter reveal */}
        <div className="absolute left-[8vw] top-[45vh] -translate-y-1/2 text-left select-none">
          <h1
            className="font-[200] text-[#14213d] leading-none uppercase select-none text-[clamp(72px,12vw,210px)] flex items-center"
            style={{
              letterSpacing: '0.25em',
              textShadow: '0 0 24px rgba(255, 255, 255, 0.6)',
            }}
          >
            <span className="overflow-hidden inline-block py-2">
              <span ref={dVRef} className="inline-block will-change-transform">V</span>
            </span>
            <span className="overflow-hidden inline-block py-2">
              <span ref={dARef1} className="inline-block will-change-transform">A</span>
            </span>
            <span className="overflow-hidden inline-block py-2">
              <span ref={dYRef} className="inline-block will-change-transform">Y</span>
            </span>
            <span className="overflow-hidden inline-block py-2">
              <span ref={dARef2} className="inline-block will-change-transform">A</span>
            </span>
          </h1>
        </div>

        {/* RIGHT: Taglines in BLUE #1f4f9c & #2f66b8 with down-to-up mask reveals */}
        <div className="absolute right-[7vw] top-[58vh] -translate-y-1/2 text-left max-w-[420px] select-none">
          <div className="overflow-hidden block mb-2 py-1">
            <p
              ref={dTag1Ref}
              className="font-[400] text-[#1f4f9c] leading-tight select-none text-[clamp(26px,3vw,52px)] will-change-transform"
              style={{
                textShadow: '0 0 24px rgba(255, 255, 255, 0.6)',
              }}
            >
              Know before you go
            </p>
          </div>

          <div className="overflow-hidden block py-1">
            <p
              ref={dTag2Ref}
              className="font-[300] text-[#2f66b8] leading-normal select-none text-[clamp(20px,2.2vw,38px)] will-change-transform"
              style={{
                textShadow: '0 0 24px rgba(255, 255, 255, 0.6)',
              }}
            >
              Step in, step out
            </p>
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT (block md:hidden): Stacked in sky upper region with mask reveals */}
      <div className="block md:hidden absolute inset-0 pointer-events-none z-20">
        <div className="absolute top-[16svh] left-0 w-full flex flex-col items-center text-center px-4 select-none">
          {/* VAYA: navy #14213d, ~20vw, letter-spacing 0.2em */}
          <h1
            className="font-[200] text-[#14213d] leading-none uppercase select-none text-[20vw] mb-3 flex items-center justify-center"
            style={{
              letterSpacing: '0.2em',
              textShadow: '0 0 24px rgba(255, 255, 255, 0.7)',
            }}
          >
            <span className="overflow-hidden inline-block py-1">
              <span ref={mVRef} className="inline-block will-change-transform">V</span>
            </span>
            <span className="overflow-hidden inline-block py-1">
              <span ref={mARef1} className="inline-block will-change-transform">A</span>
            </span>
            <span className="overflow-hidden inline-block py-1">
              <span ref={mYRef} className="inline-block will-change-transform">Y</span>
            </span>
            <span className="overflow-hidden inline-block py-1">
              <span ref={mARef2} className="inline-block will-change-transform">A</span>
            </span>
          </h1>

          {/* Know before you go: blue #1f4f9c ~6.5vw, weight 400 */}
          <div className="overflow-hidden block mb-1.5 py-0.5">
            <p
              ref={mTag1Ref}
              className="font-[400] text-[#1f4f9c] leading-tight select-none text-[6.5vw] will-change-transform"
              style={{
                textShadow: '0 0 24px rgba(255, 255, 255, 0.7)',
              }}
            >
              Know before you go
            </p>
          </div>

          {/* Step in, step out: blue #2f66b8 ~5vw, weight 300 */}
          <div className="overflow-hidden block py-0.5">
            <p
              ref={mTag2Ref}
              className="font-[300] text-[#2f66b8] leading-normal select-none text-[5vw] will-change-transform"
              style={{
                textShadow: '0 0 24px rgba(255, 255, 255, 0.7)',
              }}
            >
              Step in, step out
            </p>
          </div>
        </div>
      </div>

      {/* ── 6. Scroll to explore hint (Fades out completely once p > 0.05) ── */}
      <div
        ref={scrollHintRef}
        className="absolute bottom-[4vh] left-1/2 -translate-x-1/2 pointer-events-none z-10 flex flex-col items-center select-none"
        style={{ opacity: 0.75 }}
      >
        <span className="text-[11px] font-light uppercase tracking-[0.25em] text-[#14213d]">
          Scroll to explore
        </span>
        <svg
          className="w-3.5 h-3.5 text-[#14213d] mt-1.5 animate-bounce"
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
