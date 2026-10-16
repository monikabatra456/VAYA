'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// 150 continuous frames of camera-locked valley + lake fly-in
const FRAME_COUNT = 150;
const getFramePath = (index) => {
  const padded = String(index + 1).padStart(4, '0');
  return `/frames/frame_${padded}.webp`;
};

export default function Hero() {
  const heroRef = useRef(null);
  const canvasRef = useRef(null);
  const titleRef = useRef(null);
  const scrollHintRef = useRef(null);

  const [loadedRatio, setLoadedRatio] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let loadedCount = 0;

    // 1. Preload all 150 frames with onload counter
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = getFramePath(i);

      const onImageFinish = () => {
        if (isCancelled) return;
        loadedCount++;
        setLoadedRatio(Math.round((loadedCount / FRAME_COUNT) * 100));
        if (loadedCount === FRAME_COUNT) {
          setIsLoaded(true);
        }
      };

      if (img.complete) {
        onImageFinish();
      } else {
        img.onload = onImageFinish;
        img.onerror = onImageFinish; // graceful fallback so sequence never halts
      }
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !canvasRef.current || !heroRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // State object for GSAP frame scrubbing
    const state = { frame: 0 };
    let lastRenderedFrame = -1;

    // Cache preloaded image elements
    const cachedImages = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      cachedImages.push(img);
    }

    // Set canvas dimensions with DPR (max 2)
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      render(true);
    };

    // Draw cover-fit (preserve aspect ratio, center crop, no stretch)
    const render = (force = false) => {
      const frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.max(0, Math.round(state.frame))
      );

      if (!force && frameIndex === lastRenderedFrame) return;
      lastRenderedFrame = frameIndex;

      const img = cachedImages[frameIndex];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const cWidth = canvas.width;
      const cHeight = canvas.height;
      const iWidth = img.naturalWidth;
      const iHeight = img.naturalHeight;

      // Cover math
      const canvasAspect = cWidth / cHeight;
      const imgAspect = iWidth / iHeight;

      let drawWidth = cWidth;
      let drawHeight = cHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasAspect > imgAspect) {
        drawHeight = Math.round(cWidth / imgAspect);
        offsetY = Math.round((cHeight - drawHeight) / 2);
      } else {
        drawWidth = Math.round(cHeight * imgAspect);
        offsetX = Math.round((cWidth - drawWidth) / 2);
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    // Initial size and first frame render
    resizeCanvas();

    // GSAP context for safe cleanup / React StrictMode double mount prevention
    const ctxTimeline = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '+=400%', // 4 screen scroll runway
          pin: true,
          scrub: 0.6, // smooth, not laggy
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // 1. Frame Scrubbing across the full scroll distance (duration: 1)
      tl.to(
        state,
        {
          frame: FRAME_COUNT - 1,
          ease: 'none',
          snap: 'frame',
          onUpdate: () => render(false),
          duration: 1,
        },
        0
      );

      // 2. TITLE: 0% - 20% scroll mein VAYA upar jaake fade out
      tl.to(
        titleRef.current,
        {
          yPercent: -40,
          opacity: 0,
          ease: 'power2.out',
          duration: 0.2,
        },
        0
      );

      // 3. SCROLL HINT: 80% - 100% mein fade in (jab jahaaz bada aur saaf ho)
      tl.fromTo(
        scrollHintRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.15, ease: 'power2.out' },
        0.85
      );
    }, heroRef);

    // Refresh ScrollTrigger after layout & resize
    ScrollTrigger.refresh();

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
        ScrollTrigger.refresh();
      }, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      ctxTimeline.revert();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === heroRef.current) st.kill();
      });
    };
  }, [isLoaded]);

  return (
    <>
      <section
        id="hero"
        ref={heroRef}
        className="relative w-full h-[100svh] overflow-hidden bg-[#f3f2ee]"
        style={{
          height: '100svh',
          maxHeight: '100svh',
        }}
        aria-label="VAYA — Stand In. Step Out."
      >
        {/* Loading state before 100% frames are decoded */}
        {!isLoaded && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#f3f2ee] select-none">
            <span className="font-light tracking-[0.3em] uppercase text-[#14213d] text-sm mb-4">
              VAYA
            </span>
            <div className="w-36 h-[2px] bg-[#14213d]/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#14213d] transition-all duration-150 ease-out"
                style={{ width: `${loadedRatio}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Apple-Style Single Canvas Frame Player ── */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block pointer-events-none z-[1]"
        />

        {/* ── TITLE: VAYA (left) + Taglines (right-center), visible at 0%, fades out by 20% ── */}
        <div
          ref={titleRef}
          className="title absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-[8vw] select-none"
        >
          {/* Desktop & Mobile Responsive Layout */}
          <div className="flex flex-col md:flex-row md:items-center justify-between w-full h-full">
            {/* LEFT: VAYA (bada, thin font, letter-spacing wide, dark navy, vertically ~50%) */}
            <div className="flex items-center h-full my-auto">
              <h1
                className="font-[200] text-[#14213d] leading-none uppercase select-none tracking-[0.25em] text-[clamp(64px,14vw,200px)]"
                style={{
                  textShadow: '0 0 24px rgba(255, 255, 255, 0.6)',
                }}
              >
                VAYA
              </h1>
            </div>

            {/* RIGHT-CENTER: "Know before you go" + "Step in, step out" */}
            <div className="text-left md:text-right max-w-[420px] pb-12 md:pb-0">
              <p
                className="font-[400] text-[#1f4f9c] leading-tight select-none text-[clamp(24px,3vw,48px)] mb-2"
                style={{
                  textShadow: '0 0 24px rgba(255, 255, 255, 0.6)',
                }}
              >
                Know before you go
              </p>
              <p
                className="font-[300] text-[#2f66b8] leading-normal select-none text-[clamp(18px,2vw,32px)]"
                style={{
                  textShadow: '0 0 24px rgba(255, 255, 255, 0.6)',
                }}
              >
                Step in, step out
              </p>
            </div>
          </div>
        </div>

        {/* ── SCROLL HINT: "SCROLL TO EXPLORE" (bottom center, small caps, fades in at 80-100%) ── */}
        <div
          ref={scrollHintRef}
          className="scrollHint absolute bottom-[5vh] left-1/2 -translate-x-1/2 pointer-events-none z-10 flex flex-col items-center select-none"
          style={{ opacity: 0 }}
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#14213d]">
            SCROLL TO EXPLORE
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

      {/* ── Section #next: White section that scrolls up normally after hero unpins ── */}
      <section
        id="next"
        className="relative w-full min-h-screen bg-white text-[#14213d] z-20 px-[8vw] py-24 flex flex-col justify-center"
      >
        <div className="max-w-4xl mx-auto">
          <span className="text-xs uppercase tracking-[0.25em] text-[#1f4f9c] font-semibold mb-4 block">
            Welcome to VAYA
          </span>
          <h2 className="text-[clamp(32px,5vw,64px)] font-[300] tracking-tight text-[#14213d] leading-[1.15] mb-8">
            Experience the world before you step out.
          </h2>
          <p className="text-[clamp(16px,1.8vw,22px)] text-[#4a5568] leading-relaxed max-w-2xl font-light">
            Hyper-detailed local previews, real-time ground intelligence, and curated journeys that prepare you for every horizon.
          </p>
        </div>
      </section>
    </>
  );
}
