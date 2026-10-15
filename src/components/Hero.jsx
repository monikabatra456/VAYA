'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';
import { vertexShader, fragmentShader } from './heroShader';
import { initHeroAnimation } from './heroTimeline';

export default function Hero() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const planeRef = useRef(null);
  const titleRef = useRef(null);
  const taglinesRef = useRef(null);
  const scrollHintRef = useRef(null);
  const posterRef = useRef(null);

  const [webglReady, setWebglReady] = useState(false);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    const isLowEnd =
      typeof navigator !== 'undefined' &&
      ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4));

    // Fallback if low-end or WebGL unsupported
    const canvas = canvasRef.current;
    if (!canvas || isLowEnd) {
      const animInstance = initHeroAnimation({
        section: sectionRef.current,
        canvas: null,
        plane: planeRef.current,
        title: titleRef.current,
        taglines: taglinesRef.current,
        scrollHint: scrollHintRef.current,
        oglCtx: null,
        isMobile,
      });
      return () => {
        if (animInstance) animInstance.kill();
      };
    }

    let W = window.innerWidth;
    let H = window.innerHeight;

    // ── 1. Create OGL Renderer ──
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5);
    let renderer;
    try {
      renderer = new Renderer({
        canvas,
        width: W,
        height: H,
        dpr,
        alpha: false,
        antialias: false,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn('WebGL init failed, using fallback', e);
      return;
    }

    const gl = renderer.gl;

    // ── 2. Create OGL Textures ──
    function createTexture(url, isTileable = false) {
      const tex = new Texture(gl, {
        generateMipmaps: false,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: isTileable ? gl.REPEAT : gl.CLAMP_TO_EDGE,
        wrapT: isTileable ? gl.REPEAT : gl.CLAMP_TO_EDGE,
      });

      const img = new Image();
      img.src = url;
      img.decoding = 'async';

      const promise = new Promise((resolve) => {
        if (img.complete) {
          tex.image = img;
          resolve(img);
        } else {
          img.onload = () => {
            tex.image = img;
            resolve(img);
          };
          img.onerror = () => resolve(null);
        }
      });

      return { tex, promise };
    }

    // Strictly use the original pastel mountain-lake image (bg.jpg) with turquoise lake & peach sky
    const heroSrc = isMobile ? '/hero/mobile/hero-m.webp' : '/hero/bg.jpg';
    const scene2Src = isMobile ? '/hero/mobile/scene2-m.webp' : '/hero/scene2.jpg';
    const depthHeroSrc = isMobile ? '/hero/mobile/depth-hero-m.webp' : '/hero/depth-hero.webp';
    const depthScene2Src = isMobile ? '/hero/mobile/depth-scene2-m.webp' : '/hero/depth-scene2.webp';
    const mistNoiseSrc = '/hero/mist-noise.webp';

    const tHero = createTexture(heroSrc);
    const tScene2 = createTexture(scene2Src);
    const tDepthHero = createTexture(depthHeroSrc);
    const tDepthScene2 = createTexture(depthScene2Src);
    const tMistNoise = createTexture(mistNoiseSrc, true);

    const vp1 = isMobile ? [0.55, 0.48] : [0.62, 0.45];
    const vp2 = isMobile ? [0.52, 0.52] : [0.57, 0.54];

    // Single fullscreen triangle geometry (1 draw call)
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uImg: { value: tHero.tex },
        uImg2: { value: tScene2.tex },
        uDepth: { value: tDepthHero.tex },
        uDepth2: { value: tDepthScene2.tex },
        uMistTex: { value: tMistNoise.tex },
        uProgress: { value: 0 },
        uMix: { value: 0 },
        uTime: { value: 0 },
        uRes: { value: [W, H] },
        uImgRes: { value: isMobile ? [1080, 1920] : [2048, 1152] },
        uVP: { value: vp1 },
        uVP2: { value: vp2 },
        uMaxZoom: { value: isMobile ? 1.35 : 1.6 },
        uMistStrength: { value: isMobile ? 0.15 : 0.22 },
      },
      depthTest: false,
      depthWrite: false,
    });

    const mesh = new Mesh(gl, { geometry, program });

    // Render 1 initial frame
    renderer.render({ scene: mesh });

    const oglCtx = { renderer, program, mesh };

    // Initialize animation timeline
    const animInstance = initHeroAnimation({
      section: sectionRef.current,
      canvas,
      plane: planeRef.current,
      title: titleRef.current,
      taglines: taglinesRef.current,
      scrollHint: scrollHintRef.current,
      oglCtx,
      isMobile,
    });

    // Fade in canvas once critical textures load (smooth 200ms transition)
    Promise.all([tHero.promise, tDepthHero.promise, tMistNoise.promise]).then(() => {
      renderer.render({ scene: mesh });
      setWebglReady(true);
    });

    // Window resize handler (debounced)
    let resizeTimer = null;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        W = window.innerWidth;
        H = window.innerHeight;
        renderer.setSize(W, H);
        program.uniforms.uRes.value = [W, H];
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
      {/* ── 1. Static LCP Poster (hero-noplane + plane DOM layer, swaps seamlessly to WebGL) ── */}
      <div
        ref={posterRef}
        className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200 ease-out z-0 ${
          webglReady ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <picture>
          <source media="(max-width: 768px)" srcSet="/hero/mobile/hero-m.webp" />
          <img
            src="/hero/bg.jpg"
            alt="Pastel Alpine Mountain Valley"
            className="w-full h-full object-cover select-none"
            fetchPriority="high"
            decoding="async"
            draggable={false}
          />
        </picture>
      </div>

      {/* ── 2. OGL WebGL Canvas (1 draw call, depth parallax & valley mist) ── */}
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

      {/* ── 3. Plane Cutout Sprite (Static at scroll=0, recedes to vanishing point on scroll) ── */}
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

      {/* ── 4. Columbus Travel-Style Typography Overlay ── */}
      {/* DESKTOP LAYOUT (md:block): Left "VAYA", Right Taglines */}
      <div className="hidden md:block absolute inset-0 pointer-events-none z-20">
        {/* LEFT: "VAYA" in NAVY BLUE #14213d, Outfit 200, letter-spacing .25em */}
        <div
          ref={titleRef}
          className="absolute will-change-transform opacity-0 select-none
            left-[8vw] top-[45vh] -translate-y-1/2 text-left"
        >
          <h1
            className="font-[200] text-[#14213d] leading-none uppercase select-none text-[clamp(72px,12vw,210px)]"
            style={{
              letterSpacing: '0.25em',
              textShadow: '0 0 24px rgba(255, 255, 255, 0.6)',
            }}
          >
            VAYA
          </h1>
        </div>

        {/* RIGHT: Taglines in BLUE #1f4f9c & #2f66b8 */}
        <div
          ref={taglinesRef}
          className="absolute will-change-transform opacity-0 select-none
            right-[7vw] top-[58vh] -translate-y-1/2 text-left max-w-[420px]"
        >
          <p
            className="font-[400] text-[#1f4f9c] leading-tight select-none mb-2 text-[clamp(26px,3vw,52px)]"
            style={{
              textShadow: '0 0 24px rgba(255, 255, 255, 0.6)',
            }}
          >
            Know before you go
          </p>
          <p
            className="font-[300] text-[#2f66b8] leading-normal select-none text-[clamp(20px,2.2vw,38px)]"
            style={{
              textShadow: '0 0 24px rgba(255, 255, 255, 0.6)',
            }}
          >
            Step in, step out
          </p>
        </div>
      </div>

      {/* MOBILE LAYOUT (block md:hidden): Stacked in sky upper region for crisp contrast */}
      <div className="block md:hidden absolute inset-0 pointer-events-none z-20">
        <div className="absolute top-[16svh] left-0 w-full flex flex-col items-center text-center px-4 select-none">
          {/* VAYA: navy #14213d, ~20vw, letter-spacing 0.2em */}
          <h1
            className="font-[200] text-[#14213d] leading-none uppercase select-none text-[20vw] mb-3"
            style={{
              letterSpacing: '0.2em',
              textShadow: '0 0 24px rgba(255, 255, 255, 0.7)',
            }}
          >
            VAYA
          </h1>

          {/* Know before you go: blue #1f4f9c ~6.5vw, weight 400 */}
          <p
            className="font-[400] text-[#1f4f9c] leading-tight select-none text-[6.5vw] mb-1.5"
            style={{
              textShadow: '0 0 24px rgba(255, 255, 255, 0.7)',
            }}
          >
            Know before you go
          </p>

          {/* Step in, step out: blue #2f66b8 ~5vw, weight 300 */}
          <p
            className="font-[300] text-[#2f66b8] leading-normal select-none text-[5vw]"
            style={{
              textShadow: '0 0 24px rgba(255, 255, 255, 0.7)',
            }}
          >
            Step in, step out
          </p>
        </div>
      </div>

      {/* ── 5. Scroll to explore hint (Fades out completely once p > 0.05) ── */}
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
