'use client';
import { useLayoutEffect, useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import Lenis from 'lenis';
import dynamic from 'next/dynamic';

const FogCanvas = dynamic(() => import('./FogCanvas'), { ssr: false });
const ThreePlaneCanvas = dynamic(() => import('./ThreePlaneCanvas'), { ssr: false });

// ─── SVG Contrail ─────────────────────────────────────────────────────────────
const Contrail = ({ prog }) => (
  <svg className="contrail-svg" viewBox="0 0 320 20" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="cg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#fff" stopOpacity="0"/>
        <stop offset="55%"  stopColor="#fff" stopOpacity="0.5"/>
        <stop offset="100%" stopColor="#fff" stopOpacity="0.12"/>
      </linearGradient>
    </defs>
    <path
      d="M0,10 Q160,8 320,10"
      stroke="url(#cg)"
      strokeWidth="2.5"
      fill="none"
      strokeDasharray="320"
      strokeDashoffset={320 * (1 - prog)}
      strokeLinecap="round"
    />
  </svg>
);

// ─── Inline SVG Preloader Component ──────────────────────────────────────────
function Preloader({ onDone }) {
  const ref = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setTimeout(onDone, 600);
      return;
    }

    // 2.2 - 2.5s timed sequence
    const tl = gsap.timeline({ delay: 0.1 });
    tl.to('.pl-v',    { strokeDashoffset: 0, duration: 0.55, ease: 'power2.out' }, 0)
      .to('.pl-tri',  { strokeDashoffset: 0, duration: 0.5,  ease: 'power2.out' }, 0.3)
      .to('.pl-sand', { opacity: 1,           duration: 0.4 }, 0.65)
      .to('.pl-dash', { strokeDashoffset: 0,  duration: 0.45, ease: 'none' }, 0.82)
      .to('.pl-plane',{
        motionPath: { path: '#pl-path', align: '#pl-path', start: 0, end: 1, autoRotate: true },
        duration: 0.55, ease: 'power1.in',
      }, 1.0)
      .to('.pl-plane', { opacity: 0, duration: 0.15 }, 1.5)
      .fromTo('.pl-word',{ opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 1.4)
      .fromTo('.pl-tag', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4,  ease: 'power2.out' }, 1.75)
      .to(ref.current, { opacity: 0, duration: 0.5, delay: 0.2, onComplete: onDone }, 2.2);

    return () => tl.kill();
  }, [onDone]);

  return (
    <div
      ref={ref}
      id="vaya-preloader"
      className="preloader"
      role="status"
      aria-live="polite"
      aria-label="Loading VAYA"
    >
      <div className="preloader-inner">
        <svg viewBox="0 0 64 72" width="76" height="86" aria-hidden="true">
          <defs>
            <linearGradient id="pl-vg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#0B2D5B"/>
              <stop offset="100%" stopColor="#27B2C9"/>
            </linearGradient>
          </defs>
          {/* outer V */}
          <path
            className="pl-v"
            d="M4,6 L32,44 L60,6"
            fill="none"
            stroke="url(#pl-vg)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="82"
            strokeDashoffset="82"
          />
          {/* inverted triangle */}
          <path
            className="pl-tri"
            d="M10,52 L32,24 L54,52 Z"
            fill="none"
            stroke="url(#pl-vg)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="98"
            strokeDashoffset="98"
          />
          {/* sand hill fill */}
          <path
            className="pl-sand"
            d="M10,52 Q21,46 32,48 Q43,46 54,52 Z"
            fill="#F6A81C"
            opacity="0"
          />
          {/* dashed flight path */}
          <path
            id="pl-path"
            className="pl-dash"
            d="M54,10 Q50,28 32,38"
            fill="none"
            stroke="#27B2C9"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeDashoffset="46"
          />
          {/* small plane */}
          <g className="pl-plane" style={{ transformOrigin: '54px 10px' }}>
            <path
              d="M-5,0 L2,0 Q5,-1.5 5,0 Q5,1.5 2,0 L-5,0 Z M-5,0 L-7,-2 L-7,-1 Z M-5,0 L-7,2 L-7,1 Z"
              fill="#F6A81C"
              transform="translate(54,10) scale(0.85)"
            />
          </g>
        </svg>
        <div className="pl-word">VAYA</div>
        <div className="pl-tag">Stand In. Step Out.</div>
      </div>
    </div>
  );
}

// ─── Hero Scroll Component ────────────────────────────────────────────────────
export default function HeroScroll({ onWaitlist }) {
  const sectionRef  = useRef(null);
  const bgRef       = useRef(null);
  const planeWrap   = useRef(null);
  const contrailRef = useRef(null);
  const [scrollProg, setScrollProg] = useState(0);
  const [contrailProg, setContrailProg] = useState(0);
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [use3DPlane, setUse3DPlane] = useState(true);

  // Preloader synchronization gates
  const onDone = useCallback(() => {
    // Hide static preloader if present
    const staticPl = document.getElementById('vaya-static-preloader');
    if (staticPl) {
      staticPl.style.opacity = '0';
      setTimeout(() => { staticPl.style.display = 'none'; }, 400);
    }
    setPreloaderDone(true);
  }, []);

  // Pre-decode hero images and check font readiness
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const srcs = [
      isMobile ? '/hero/valley-mobile.webp' : '/hero/valley.webp',
      '/hero/plane.webp',
    ];
    const imgPromises = srcs.map((src) => {
      const img = new Image();
      img.src = src;
      return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    });
    const fontsPromise = document.fonts ? document.fonts.ready : Promise.resolve();
    const minTimer = new Promise((resolve) => setTimeout(resolve, 2200));

    Promise.all([...imgPromises, fontsPromise, minTimer]).then(() => {
      // Gate fulfilled
    });
  }, []);

  useLayoutEffect(() => {
    if (!preloaderDone) return;
    gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.matchMedia('(pointer: fine)').matches;

    // Reveal hero section
    if (sectionRef.current) {
      sectionRef.current.style.visibility = 'visible';
    }

    // Lenis on desktop only (lerp ~0.08)
    let lenis = null;
    if (!reduced && isDesktop) {
      lenis = new Lenis({ lerp: 0.08, smoothWheel: true, syncTouch: false });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    if (reduced) {
      if (planeWrap.current) gsap.set(planeWrap.current, { opacity: 0 });
      gsap.set('.hero-copy', { opacity: 1 });
      gsap.set('.hero-headline', { opacity: 1, y: 0, letterSpacing: '0.06em' });
      gsap.set(['.hero-tagline', '.hero-subline', '.hero-cta'], { opacity: 1, y: 0 });
      return;
    }

    const isMobile = window.innerWidth < 768;
    const scrollVH = isMobile ? '+=400svh' : '+=500vh';

    const tl = gsap.timeline({
      defaults: { ease: 'none' }, // Ease "none" on every scrubbed tween!
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: scrollVH,
        scrub: 0.8,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          setScrollProg(p);
          setContrailProg(Math.min(1, p * 3));
        },
      },
    });

    // ── Background: slow dolly-in (scale 1 to 1.35, origin at valley centre 50% 58%) ──
    tl.to(bgRef.current, { scale: 1.35, duration: 10 }, 0);

    // ── Fallback Plane DOM Motion (runs in parallel if Three.js not used) ──
    const plane = planeWrap.current;
    if (plane) {
      gsap.set(plane, { transformOrigin: '50% 50%', willChange: 'transform, opacity, filter' });

      // Move along path with constant speed (ease: none)
      tl.to(plane, {
        motionPath: {
          path: '#heroPath',
          align: '#heroPath',
          alignOrigin: [0.5, 0.5],
          autoRotate: false,
        },
        duration: 8,
      }, 0);

      // Perspective scale: 1/(1+depth)
      tl.fromTo(plane, { scale: 1 }, { scale: 0.08, duration: 7.8 }, 0);

      // Gentle bank: -3° -> +5° -> +1°
      tl.to(plane, { rotateZ: 5, skewX: 2, duration: 4 }, 0);
      tl.to(plane, { rotateZ: 1, skewX: 0, duration: 4 }, 4);

      // Atmospheric perspective: lower contrast, slightly bluer, soft blur
      tl.fromTo(
        plane,
        { filter: 'brightness(1) contrast(1) blur(0px) drop-shadow(2px 0 6px rgba(255,200,120,.35))' },
        { filter: 'brightness(0.68) contrast(0.82) blur(1.5px) drop-shadow(0 0 0 transparent)', duration: 7.5 },
        0.3
      );

      // Fade out at valley vanishing distance
      tl.to(plane, { opacity: 0, duration: 1.8 }, 7);
    }

    if (contrailRef.current) {
      tl.to(contrailRef.current, { opacity: 0, duration: 2 }, 6.8);
    }

    // ── Text reveal at white-out (ease: none on scrub) ─────────────
    tl.fromTo(
      '.hero-headline',
      { opacity: 0, y: 36, letterSpacing: '0.22em' },
      { opacity: 1, y: 0, letterSpacing: '0.06em', duration: 2.2 },
      7.0
    );
    tl.fromTo(
      '.hero-tagline',
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 1.8 },
      7.8
    );
    tl.fromTo(
      '.hero-subline',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1.6 },
      8.5
    );
    tl.fromTo(
      '.hero-cta',
      { opacity: 0, y: 18, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 1.2 },
      9.0
    );

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      if (lenis) lenis.destroy();
    };
  }, [preloaderDone]);

  return (
    <>
      <Preloader onDone={onDone} />

      <section
        ref={sectionRef}
        id="hero"
        className="hero-section"
        style={{ visibility: 'hidden' }}
        aria-label="VAYA — Stand In. Step Out."
      >
        {/* Hidden SVG curved path used by GSAP MotionPath */}
        <svg
          className="path-svg"
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
        >
          {/* Start: ~(8,42) — left-centre; End: (50,58) — valley vanishing point */}
          <path id="heroPath" d="M 8,42 C 18,40 36,52 50,58" fill="none" stroke="none" />
        </svg>

        {/* ── z1: Valley background (slow dolly-in) ── */}
        <div className="hero-bg-wrap" aria-hidden="true">
          <picture>
            <source media="(max-width: 767px)" srcSet="/hero/valley-mobile.webp" />
            <img
              ref={bgRef}
              src="/hero/valley.webp"
              className="hero-bg"
              alt="Sunlit alpine valley"
              role="presentation"
              draggable="false"
              style={{ transformOrigin: '50% 58%', willChange: 'transform' }}
            />
          </picture>
        </div>

        {/* ── z2: Back fog (valley depth, sits behind plane) ── */}
        <div className="fog-layer fog-back" aria-hidden="true">
          <FogCanvas layer={0} scrollProgress={scrollProg} />
          {/* CSS fallback gradients */}
          <div className="fog-css fog-css-1" />
          <div className="fog-css fog-css-2" />
          <div className="fog-css fog-css-3" />
        </div>

        {/* ── z3: Contrail + Three.js 3D Plane (with PNG fallback) ── */}
        <div ref={contrailRef} className="contrail-wrap" aria-hidden="true">
          <Contrail prog={contrailProg} />
        </div>

        {/* Real 3D Plane in Three.js */}
        {use3DPlane && (
          <ThreePlaneCanvas
            progress={scrollProg}
            onReady={() => {}}
          />
        )}

        {/* Plane DOM fallback (in case Three.js/WebGL is unavailable) */}
        <div
          ref={planeWrap}
          className="plane-wrap"
          role="img"
          aria-label="Airliner flying into an alpine valley"
          style={{ display: use3DPlane ? 'none' : 'block' }}
        >
          <img src="/hero/plane.webp" className="plane-img" alt="" draggable="false" />
          <div className="plane-haze" aria-hidden="true" />
        </div>

        {/* ── z4: Front fog (drifts OVER the plane — plane flies behind it) ── */}
        <div className="fog-layer fog-front" aria-hidden="true">
          <FogCanvas layer={1} scrollProgress={scrollProg} />
          <div className="fog-css fog-css-f1" />
          <div className="fog-css fog-css-f2" />
        </div>

        {/* ── z5: White-out overlay (resolves to pure #FFFFFF page background) ── */}
        <div
          className="hero-whiteout"
          style={{ opacity: Math.max(0, (scrollProg - 0.72) * 3.6) }}
          aria-hidden="true"
        />

        {/* ── z6: Hero copy (VAYA headline, Stand In. Step Out. tagline, subline, waitlist button) ── */}
        <div className="hero-copy">
          <h1 className="hero-headline">VAYA</h1>
          <p className="hero-tagline">Stand In. Step Out.</p>
          <p className="hero-subline">
            Know where to go, when to go, and what's happening when you get there.
          </p>
          <button className="btn-primary hero-cta" onClick={onWaitlist}>
            Join waitlist →
          </button>
        </div>

        {/* Scroll cue */}
        <div
          className="scroll-cue"
          aria-hidden="true"
          style={{ opacity: Math.max(0, 1 - scrollProg * 8) }}
        >
          <span>SCROLL</span>
          <div className="scroll-arrow" />
        </div>
      </section>
    </>
  );
}
