'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  WebGLRenderer,
  Scene,
  OrthographicCamera,
  PlaneGeometry,
  MeshBasicMaterial,
  Mesh,
  ShaderMaterial,
  TextureLoader,
  Texture,
  SRGBColorSpace,
  LinearFilter,
  RepeatWrapping,
  AdditiveBlending,
  Vector2,
  CanvasTexture,
} from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import Header from './Header';

gsap.registerPlugin(ScrollTrigger);

// ─── GLSL: Scene Background Shader ─────────────────────────────────────────
const SCENE_VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function getSceneFrag(octaves = 4) {
  return /* glsl */`
  precision mediump float;

  uniform sampler2D uA;
  uniform sampler2D uADepth;
  uniform sampler2D uB;
  uniform sampler2D uBDepth;
  uniform sampler2D uNoise;
  uniform float uTime;
  uniform float uDollyA;
  uniform float uDollyB;
  uniform float uDollyTravel;
  uniform float uMix;
  uniform float uMist;       // rises at transition centre
  uniform vec2 uAspectImg;   // (imgW/imgH) for scene A (x) and scene B (y)
  uniform float uAspectScr;  // screen W/H
  uniform vec2 uVP;          // vanishing point in UV space (~0.52, 0.52)
  uniform vec2 uMouse;       // normalized -0.5..0.5 mouse offset

  varying vec2 vUv;

  float sampleNoise(vec2 uv) {
    return texture2D(uNoise, fract(uv)).r;
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < ${octaves}; i++) {
      v += amp * sampleNoise(p * freq);
      freq *= 2.05;
      amp  *= 0.48;
      p += vec2(0.37, 0.61);
    }
    return v;
  }

  // Cover-scale UV: maps image aspect to screen aspect, with 1.14 overscan
  vec2 coverUV(vec2 uv, float imgAspect, float scrAspect) {
    float overscan = 1.14;
    vec2 st = uv - 0.5;
    if (scrAspect > imgAspect) {
      st.y *= scrAspect / imgAspect;
    } else {
      st.x *= imgAspect / scrAspect;
    }
    return (st / overscan) + 0.5;
  }

  // Dolly parallax push toward vanishing point with depth d (0 far..1 near)
  vec2 dollyUV(vec2 uv, float depth, float dolly, vec2 vp, vec2 mouse) {
    // Dolly pushes pixels toward vanishing point: near rocks zoom faster than far peaks
    float k = clamp(dolly * (0.16 + 0.58 * depth), 0.0, 0.40);
    vec2 pushed = vp + (uv - vp) * (1.0 - k);
    pushed += mouse * (0.005 + 0.015 * depth);
    return pushed;
  }

  // Gaussian band: exp(-pow((d - c)/w, 2.0))
  float band(float d, float c, float w) {
    float x = (d - c) / w;
    return exp(-x * x);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uAspectScr;

    // ── 1. SCENE A (Clear mountains, no baked clouds) ──
    vec2 uvA = coverUV(uv, uAspectImg.x, aspect);
    float dA = texture2D(uADepth, fract(uvA)).r;
    if (dA <= 0.001) {
      dA = smoothstep(0.0, 1.0, 1.0 - uvA.y);
    }
    vec2 uvAd = dollyUV(uvA, dA, uDollyA, uVP, uMouse);
    vec4 colA = texture2D(uA, clamp(uvAd, 0.001, 0.999));

    // ── 2. SCENE B (Lake valley) ──
    vec2 uvB = coverUV(uv, uAspectImg.y, aspect);
    float dB = texture2D(uBDepth, fract(uvB)).r;
    if (dB <= 0.001) {
      dB = smoothstep(0.0, 1.0, 1.0 - uvB.y);
    }
    vec2 uvBd = dollyUV(uvB, dB, uDollyB, uVP, uMouse);
    vec4 colB = texture2D(uB, clamp(uvBd, 0.001, 0.999));

    // ── 3. MIST STRICTLY IN MID-DEPTH VALLEY GAPS (d ≈ 0.18 - 0.62) ──
    // Zero on sky, zero on nearest foreground rocks/trees, zero covering lower 40%!
    float skyMaskA = smoothstep(0.82, 0.62, uvAd.y);
    float groundMaskA = smoothstep(0.12, 0.28, uvAd.y);
    float ridgeDepthMaskA = smoothstep(0.14, 0.24, dA) * (1.0 - smoothstep(0.64, 0.78, dA));
    float valleyMaskA = skyMaskA * groundMaskA * ridgeDepthMaskA;

    // 3 mist layers at different depths streaming outward from vanishing point on scroll:
    // Far haze (slow 0.25), Mid layer (medium 0.60), Inner valley layer (fast 1.00)
    vec2 dirA = (uvAd - uVP) * vec2(aspect, 1.0);
    vec2 drift = vec2(uTime * 0.010, uTime * 0.003); // idle sideways drift

    vec2 pFarA   = dirA * (1.0 - uDollyTravel * 0.25) + drift * 0.5;
    vec2 pMidA   = dirA * (1.0 - uDollyTravel * 0.60) - drift * 0.8 + 5.2;
    vec2 pInnerA = dirA * (1.0 - uDollyTravel * 1.00) + drift * 1.2 + 11.7;

    float nFarA   = fbm(pFarA * 1.4);
    float nMidA   = fbm(pMidA * 2.5);
    float nInnerA = fbm(pInnerA * 4.4);

    float densA = 0.0;
    densA += band(dA, 0.24, 0.10) * smoothstep(0.35, 0.80, nFarA) * 0.50;
    densA += band(dA, 0.40, 0.12) * smoothstep(0.35, 0.80, nMidA) * 0.65;
    densA += band(dA, 0.56, 0.12) * smoothstep(0.35, 0.80, nInnerA) * 0.55;
    densA = clamp(densA * valleyMaskA * (0.80 + uMist * 0.70), 0.0, 0.75); // max 0.75

    // Warm glow toward sunrise side (upper right)
    float warmA = smoothstep(0.2, 1.0, uvAd.x) * smoothstep(0.3, 0.7, uvAd.y);
    vec3 mistCool = vec3(0.95, 0.96, 1.00);
    vec3 mistWarm = vec3(1.00, 0.92, 0.82);
    vec3 mistColourA = mix(mistCool, mistWarm, warmA);

    vec3 rgbA = mix(colA.rgb, mistColourA, densA);
    rgbA += mistColourA * (warmA * 0.4) * 0.08 * densA;

    // ── 4. MIST FOR SCENE B (Lake valley ridges) ──
    float skyMaskB = smoothstep(0.82, 0.62, uvBd.y);
    float groundMaskB = smoothstep(0.12, 0.28, uvBd.y);
    float ridgeDepthMaskB = smoothstep(0.14, 0.24, dB) * (1.0 - smoothstep(0.64, 0.78, dB));
    float valleyMaskB = skyMaskB * groundMaskB * ridgeDepthMaskB;

    vec2 dirB = (uvBd - uVP) * vec2(aspect, 1.0);
    vec2 pFarB   = dirB * (1.0 - uDollyTravel * 0.25) + drift * 0.5;
    vec2 pMidB   = dirB * (1.0 - uDollyTravel * 0.60) - drift * 0.8 + 5.2;
    vec2 pInnerB = dirB * (1.0 - uDollyTravel * 1.00) + drift * 1.2 + 11.7;

    float nFarB   = fbm(pFarB * 1.4);
    float nMidB   = fbm(pMidB * 2.5);
    float nInnerB = fbm(pInnerB * 4.4);

    float densB = 0.0;
    densB += band(dB, 0.24, 0.10) * smoothstep(0.35, 0.80, nFarB) * 0.50;
    densB += band(dB, 0.40, 0.12) * smoothstep(0.35, 0.80, nMidB) * 0.65;
    densB += band(dB, 0.56, 0.12) * smoothstep(0.35, 0.80, nInnerB) * 0.55;
    densB = clamp(densB * valleyMaskB * (0.80 + uMist * 0.70), 0.0, 0.75);

    float warmB = smoothstep(0.2, 1.0, uvBd.x) * smoothstep(0.3, 0.7, uvBd.y);
    vec3 mistColourB = mix(mistCool, mistWarm, warmB);

    vec3 rgbB = mix(colB.rgb, mistColourB, densB);
    rgbB += mistColourB * (warmB * 0.4) * 0.08 * densB;

    // ── 5. MIX SCENES ──
    vec3 col = mix(rgbA, rgbB, uMix);

    // ── 6. SUBTLE GRADE ──
    col = col + 0.02 * (1.0 - col);
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col += vec3(0.02, 0.01, 0.0) * smoothstep(0.5, 1.0, lum);
    vec2 vigCoord = (uv - 0.5);
    float vig = 1.0 - dot(vigCoord, vigCoord) * 0.48;
    col *= clamp(vig, 0.88, 1.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function createPlaneGlowTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  g.addColorStop(0.3, 'rgba(240, 245, 255, 0.4)');
  g.addColorStop(0.7, 'rgba(215, 230, 250, 0.1)');
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new CanvasTexture(canvas);
  t.generateMipmaps = false;
  return t;
}

function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

// 6th-degree smootherstep
function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// Gaussian bell curve
function bell(x: number, c: number, w: number): number {
  const d = (x - c) / w;
  return Math.exp(-d * d);
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function VayaExperience() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement | null>(null);
  const vayaWordRef = useRef<HTMLHeadingElement | null>(null);
  const tag1Ref = useRef<HTMLParagraphElement | null>(null);
  const tag2Ref = useRef<HTMLParagraphElement | null>(null);

  const [headerVisible, setHeaderVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [fallbackProgress, setFallbackProgress] = useState(0);

  useEffect(() => {
    if (!checkWebGLSupport()) {
      setWebGLSupported(false);
      setIsLoaded(true);
      setHeaderVisible(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const isPortraitMobile = window.matchMedia('(max-width: 767px) and (orientation: portrait)').matches;
    const isDesktop = window.innerWidth > 1024;
    const isMobile = window.innerWidth <= 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLowEnd = typeof navigator !== 'undefined' && navigator.hardwareConcurrency <= 4;

    // Use clear mountains image (no baked clouds, no baked plane)
    const scene1Src = isPortraitMobile
      ? '/assets/scene-a-clear-mobile.webp'
      : isDesktop
      ? '/assets/scene-a-clear-2400.webp'
      : '/assets/scene-a-clear-1280.webp';

    const scene2Src = isPortraitMobile
      ? '/assets/scene-b-valley-mobile.webp'
      : isDesktop
      ? '/assets/scene-b-valley-2400.webp'
      : '/assets/scene-b-valley-1280.webp';

    const planeSrc = isMobile ? '/assets/plane-600.webp' : '/assets/plane-1000.webp';

    let W = window.innerWidth;
    let H = window.innerHeight;

    // ── Lenis Smooth Scrolling ──
    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.2,
      syncTouch: false,
    });
    lenis.on('scroll', () => ScrollTrigger.update());
    const tickerUpdate = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerUpdate);
    gsap.ticker.lagSmoothing(0);

    // ── Renderer ──
    const renderer = new WebGLRenderer({
      canvas,
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    });
    const maxDpr = isLowEnd ? 0.75 : Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5);
    renderer.setPixelRatio(maxDpr);
    renderer.setSize(W, H);

    const threeScene = new Scene();
    const cam = new OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -100, 100);
    cam.position.z = 10;

    const fullGeo = new PlaneGeometry(1, 1);

    const grayPlaceholder = new CanvasTexture((() => {
      const c = document.createElement('canvas');
      c.width = 4;
      c.height = 4;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 4, 4);
      return c;
    })());

    // ── 1. BG Quad: Scene ShaderMaterial (Mist strictly between mountains) ──
    const sceneMat = new ShaderMaterial({
      vertexShader: SCENE_VERT,
      fragmentShader: getSceneFrag(isMobile ? 3 : 4),
      uniforms: {
        uA:           { value: grayPlaceholder },
        uADepth:      { value: grayPlaceholder },
        uB:           { value: grayPlaceholder },
        uBDepth:      { value: grayPlaceholder },
        uNoise:       { value: grayPlaceholder },
        uTime:        { value: 0 },
        uDollyA:      { value: 0 },
        uDollyB:      { value: 0.28 },
        uDollyTravel: { value: 0 },
        uMix:         { value: 0 },
        uMist:        { value: 0 },
        uAspectImg:   { value: new Vector2(isPortraitMobile ? 1080 / 1935 : 2400 / 1340, isPortraitMobile ? 1080 / 1935 : 2400 / 1340) },
        uAspectScr:   { value: W / H },
        uVP:          { value: new Vector2(0.52, 0.52) },
        uMouse:       { value: new Vector2(0, 0) },
      },
      depthWrite: false,
    });

    const sceneMesh = new Mesh(fullGeo, sceneMat);
    sceneMesh.position.set(0, 0, 0);
    sceneMesh.scale.set(W, H, 1);
    threeScene.add(sceneMesh);

    // ── 2. Plane Glow Sprite ──
    const planeGlowTex = createPlaneGlowTexture();
    const planeGlowMat = new MeshBasicMaterial({
      map: planeGlowTex,
      transparent: true,
      opacity: 0.12,
      blending: AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const planeGlowMesh = new Mesh(fullGeo, planeGlowMat);
    planeGlowMesh.position.z = 1;
    threeScene.add(planeGlowMesh);

    // ── 3. Plane Mesh ──
    const planeMat = new MeshBasicMaterial({
      transparent: true,
      opacity: 1,
      depthWrite: false,
      depthTest: false,
    });
    const planeMesh = new Mesh(fullGeo, planeMat);
    planeMesh.position.z = 2;
    threeScene.add(planeMesh);

    // NOTE: All foreground mist / quads covering the lower 40% or in front of the plane
    // are completely removed per instruction 1. Nothing covers the plane.

    let planeAspect = 1000 / 581;

    // Mouse parallax tracking (desktop only)
    let mouseNormX = 0;
    let mouseNormY = 0;
    let curMouseX = 0;
    let curMouseY = 0;

    const onPointerMove = (e: PointerEvent) => {
      if (isPortraitMobile || prefersReducedMotion) return;
      mouseNormX = (e.clientX / W) - 0.5;
      mouseNormY = -((e.clientY / H) - 0.5);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // Scroll engine variables
    let rawProgress = 0;
    let pSmooth = 0;
    let lastP = 0;
    let scrollVelocity = 0;
    let needRender = true;
    let animId: number | null = null;
    const startTime = performance.now();

    let tabHidden = false;
    const onVisChange = () => {
      tabHidden = document.hidden;
    };
    document.addEventListener('visibilitychange', onVisChange);

    const easeP2Out = gsap.parseEase('power2.out');
    const easeP2InOut = gsap.parseEase('power2.inOut');
    const easeSine = gsap.parseEase('sine.inOut');

    // ─────────────────────────────────────────────────────
    // Render Frame Function
    // ─────────────────────────────────────────────────────
    function applyFrame(p: number, nowMs: number) {
      const timeSec = (nowMs - startTime) * 0.001;

      // Mouse smoothing
      curMouseX += (mouseNormX - curMouseX) * 0.08;
      curMouseY += (mouseNormY - curMouseY) * 0.08;

      // Time uniforms (mist slowly drifts sideways when idle)
      const mistTime = prefersReducedMotion ? 0 : timeSec;
      sceneMat.uniforms.uTime.value = mistTime;

      // Dolly parallax:
      // First 60% of scroll: scale 1.0 -> 1.35 at the vanishing point
      const dollyA = smootherstep(0.00, 0.60, p) * 0.46;
      sceneMat.uniforms.uDollyA.value = dollyA;

      // Mist streams TOWARD camera on scroll outward from vanishing point
      const travel = p * 1.1 + mistTime * 0.01;
      sceneMat.uniforms.uDollyTravel.value = travel;

      // Transition A -> B between p 0.55 -> 0.92
      const mix = smootherstep(0.55, 0.88, p);
      sceneMat.uniforms.uMix.value = mix;

      // Mist rises to a peak at p ≈ 0.65 (bell curve width 0.18) so B emerges from cloud
      const mistDensity = bell(p, 0.65, 0.18);
      sceneMat.uniforms.uMist.value = mistDensity;

      // Scene B starts at scale 1.28 and settles to 1.0 with continuing slow drift
      const driftB = prefersReducedMotion ? 0 : mistTime * 0.002;
      const dollyB = (1.0 - smootherstep(0.55, 0.92, p)) * 0.28 + driftB;
      sceneMat.uniforms.uDollyB.value = dollyB;

      // Mouse & screen aspect uniforms
      sceneMat.uniforms.uMouse.value.set(curMouseX, curMouseY);
      sceneMat.uniforms.uAspectScr.value = W / H;

      sceneMesh.scale.set(W, H, 1);

      // ── Plane Dynamics ──
      // Sprite scale: width 34% screen desktop, 62% mobile
      const basePlaneW = isMobile ? W * 0.62 : W * 0.34;
      // Start position: lower-center at y = -0.10 * H (corresponds to ~0.60*H from top)
      const startX = 0;
      const startY = -0.10 * H;
      // Vanishing point in world coords:
      const vpX = (0.52 - 0.5) * W;
      const vpY = (0.52 - 0.5) * H;
      const targetVanX = vpX + 0.04 * W;
      const targetVanY = vpY + 0.03 * H;

      if (p < 0.84) {
        planeMesh.visible = true;
        planeGlowMesh.visible = true;

        // Plane = STATIC UNTIL SCROLL (zero float, zero bob, zero idle bank!)
        let currentX = startX;
        let currentY = startY;
        let currentScale = 1.0;
        let currentRotZ = 0;
        let currentOpacity = 1.0;

        if (p <= 0.45) {
          // p 0.00 -> 0.45: Plane stays almost in place (moves max +10px up with scroll)
          // travelling WITH user while the mountain world and mist stream around it
          const tGlide = p / 0.45;
          currentX = startX;
          currentY = startY + tGlide * 10;
          currentScale = 1.0;
          currentRotZ = 0;
          currentOpacity = 1.0;
        } else {
          // p 0.45 -> 0.80: eases ahead toward the vanishing point
          const tAhead = smootherstep(0.45, 0.80, p);
          const tAheadEased = easeSine(tAhead);

          currentX = startX + (targetVanX - startX) * tAheadEased;
          currentY = (startY + 10) + (targetVanY - (startY + 10)) * tAheadEased;
          currentScale = 1.0 - (1.0 - 0.22) * tAheadEased;
          currentRotZ = tAheadEased * (-7 * Math.PI / 180);

          // Fade 1 -> 0 across p 0.60 -> 0.82 (slow, power2.inOut)
          if (p >= 0.60) {
            const tFade = Math.min(1, Math.max(0, (p - 0.60) / (0.82 - 0.60)));
            currentOpacity = 1.0 - easeP2InOut(tFade);
          }
        }

        const planeW = basePlaneW * currentScale;
        const planeH = planeW / planeAspect;

        planeMesh.position.set(currentX, currentY, 2);
        planeMesh.scale.set(planeW, planeH, 1);
        planeMesh.rotation.z = currentRotZ;
        planeMat.opacity = Math.max(0, currentOpacity);

        // Plane visually sits INSIDE the scene: tint toward mist colour as it recedes
        const scaleDown = 1.0 - currentScale;
        const fogLerp = 0.35 * scaleDown;
        planeMat.color.setRGB(
          (0.97 * (1.0 - fogLerp)) + (0.93 * fogLerp),
          (0.98 * (1.0 - fogLerp)) + (0.95 * fogLerp),
          (1.00 * (1.0 - fogLerp)) + (1.00 * fogLerp)
        );

        planeGlowMesh.position.set(currentX, currentY, 1);
        planeGlowMesh.scale.set(planeW * 1.3, planeW * 1.3, 1);
        planeGlowMat.opacity = 0.12 * Math.max(0, currentOpacity);
      } else {
        planeMesh.visible = false;
        planeGlowMesh.visible = false;
      }

      // ── Text Elements ──

      // 1. "SCROLL TO EXPLORE": MUST FULLY HIDE once p > 0.06, only show at p <= 0.01
      if (scrollIndicatorRef.current) {
        if (p <= 0.06) {
          const hintOpacity = Math.max(0, 1.0 - p / 0.06) * 0.75;
          scrollIndicatorRef.current.style.opacity = `${hintOpacity}`;
          scrollIndicatorRef.current.style.display = hintOpacity <= 0.001 ? 'none' : 'flex';
        } else {
          scrollIndicatorRef.current.style.opacity = '0';
          scrollIndicatorRef.current.style.display = 'none';
        }
      }

      // 2. "VAYA" (Navy #0F2A4A, Outfit 200, clamp(120px, 19vw, 300px), letter-spacing .25em)
      if (vayaWordRef.current) {
        const tVaya = smootherstep(0.68, 0.84, p);
        const vEase = easeP2Out(tVaya);
        vayaWordRef.current.style.opacity = `${vEase}`;
        vayaWordRef.current.style.transform = `translateY(${(1.0 - vEase) * 36}px)`;
      }

      // 3. "Know before you go" (Blue #1E5A8C, Outfit 300, clamp(32px, 3.6vw, 56px))
      if (tag1Ref.current) {
        const tTag1 = smootherstep(0.74, 0.88, p);
        const t1Ease = easeP2Out(tTag1);
        tag1Ref.current.style.opacity = `${t1Ease}`;
        tag1Ref.current.style.transform = `translateY(${(1.0 - t1Ease) * 24}px)`;
      }

      // 4. "Step in, step out" (Blue #2F6FA8, Outfit 300, clamp(18px, 1.8vw, 26px))
      if (tag2Ref.current) {
        const tTag2 = smootherstep(0.78, 0.90, p);
        const t2Ease = easeP2Out(tTag2);
        tag2Ref.current.style.opacity = `${t2Ease}`;
        tag2Ref.current.style.transform = `translateY(${(1.0 - t2Ease) * 20}px)`;
      }

      // ── Exit Section Reveal: canvas+text smoothly translate up into #next ──
      let exitY = 0;
      if (p > 0.92) {
        const tExit = Math.min(1.0, (p - 0.92) / (1.0 - 0.92));
        exitY = easeSine(tExit) * 100;
      }

      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(0, -${exitY}vh, 0)`;
        containerRef.current.style.visibility = p >= 1 ? 'hidden' : 'visible';
      }
      if (textContainerRef.current) {
        textContainerRef.current.style.transform = `translate3d(0, -${exitY}vh, 0)`;
      }

      renderer.render(threeScene, cam);
    }

    // ─────────────────────────────────────────────────────
    // Render Loop with Critically-Damped Progress
    // ─────────────────────────────────────────────────────
    let lastTickTime = 0;

    function tick(now: number) {
      animId = requestAnimationFrame(tick);

      if (tabHidden || rawProgress > 1.02) return;

      // Delta damping: max step 0.010 per frame prevents any speed spike
      const rawDelta = rawProgress - pSmooth;
      const clampedDelta = Math.max(-0.010, Math.min(0.010, rawDelta));
      pSmooth += clampedDelta * 0.18;

      if (Math.abs(rawProgress - pSmooth) < 0.0001) {
        pSmooth = rawProgress;
      }

      scrollVelocity = (pSmooth - lastP);
      lastP = pSmooth;

      const isMoving = Math.abs(rawProgress - pSmooth) > 0.0001;
      const isPlaneActive = pSmooth < 0.84;

      // Throttle rendering when idle (mist drifts gently between mountains)
      if (!isMoving && !isPlaneActive && !prefersReducedMotion) {
        if (now - lastTickTime < 33) return;
      }
      lastTickTime = now;

      if (isMoving || isPlaneActive || needRender || !prefersReducedMotion) {
        applyFrame(pSmooth, now);
        if (!isMoving && !isPlaneActive && prefersReducedMotion) {
          needRender = false;
        }
      }
    }

    // ─────────────────────────────────────────────────────
    // Texture Loading Architecture
    // ─────────────────────────────────────────────────────
    const loader = new TextureLoader();

    function loadTexture(url: string): Promise<Texture> {
      return new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      });
    }

    function setupLinearTexture(t: Texture, srgb = true) {
      if (srgb) t.colorSpace = SRGBColorSpace;
      t.generateMipmaps = true;
      t.minFilter = LinearFilter;
      t.magFilter = LinearFilter;
    }

    function setupNoiseTexture(t: Texture) {
      t.generateMipmaps = false;
      t.minFilter = LinearFilter;
      t.magFilter = LinearFilter;
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
    }

    // Load clear mountains image, plane, noise, and depth map
    Promise.all([
      loadTexture(scene1Src),
      loadTexture(planeSrc),
      loadTexture('/assets/noise-256.png'),
      loadTexture('/assets/scene-a-clear-depth.webp'),
    ])
      .then(([texA, texPlane, texNoise, texADepth]) => {
        setupLinearTexture(texA, true);
        setupLinearTexture(texPlane, true);
        setupNoiseTexture(texNoise);
        setupNoiseTexture(texADepth);

        if (texPlane.image) {
          planeAspect = texPlane.image.width / texPlane.image.height;
        }
        if (texA.image) {
          sceneMat.uniforms.uAspectImg.value.x = texA.image.width / texA.image.height;
        }

        sceneMat.uniforms.uA.value = texA;
        sceneMat.uniforms.uADepth.value = texADepth;
        sceneMat.uniforms.uNoise.value = texNoise;

        planeMat.map = texPlane;
        planeMat.needsUpdate = true;
        sceneMat.needsUpdate = true;

        applyFrame(0, performance.now());
        setIsLoaded(true);

        setTimeout(() => setHeaderVisible(true), 500);

        animId = requestAnimationFrame(tick);
        ScrollTrigger.refresh();

        const scheduleIdle =
          typeof window !== 'undefined' && 'requestIdleCallback' in window
            ? (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback
            : (cb: () => void) => setTimeout(cb, 150);

        scheduleIdle(() => {
          Promise.all([
            loadTexture(scene2Src),
            loadTexture('/assets/scene-b-valley-depth.webp'),
          ])
            .then(([texB, texBDepth]) => {
              setupLinearTexture(texB, true);
              setupNoiseTexture(texBDepth);

              if (texB.image) {
                sceneMat.uniforms.uAspectImg.value.y = texB.image.width / texB.image.height;
              }

              sceneMat.uniforms.uB.value = texB;
              sceneMat.uniforms.uBDepth.value = texBDepth;
              sceneMat.needsUpdate = true;
              needRender = true;
            })
            .catch(console.warn);
        });
      })
      .catch((err) => {
        console.error('Initial textures load error:', err);
        setWebGLSupported(false);
        setIsLoaded(true);
        setHeaderVisible(true);
      });

    // ── ScrollTrigger ──
    const st = ScrollTrigger.create({
      trigger: '#runway',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        rawProgress = self.progress;
        setFallbackProgress(self.progress);
        needRender = true;
      },
    });

    // ── Window Resize ──
    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      renderer.setSize(W, H);
      cam.left = -W / 2;
      cam.right = W / 2;
      cam.top = H / 2;
      cam.bottom = -H / 2;
      cam.updateProjectionMatrix();

      sceneMat.uniforms.uAspectScr.value = W / H;
      ScrollTrigger.refresh();
      needRender = true;
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisChange);
      if (animId) cancelAnimationFrame(animId);
      st.kill();
      lenis.destroy();
      gsap.ticker.remove(tickerUpdate);

      fullGeo.dispose();
      planeGlowTex.dispose();
      planeGlowMat.dispose();
      planeMat.dispose();
      sceneMat.dispose();
      grayPlaceholder.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <Header visible={headerVisible} />

      {/* THREE.JS WebGL Stage Container (z-0, fixed, inset 0) */}
      {webGLSupported ? (
        <div
          ref={containerRef}
          className="fixed inset-0 z-0 pointer-events-none will-change-transform"
        >
          {/* Instant LCP CSS background image */}
          <div
            className="absolute inset-0 transition-opacity duration-700 ease-out"
            style={{
              backgroundImage: 'url(/assets/scene-a-clear-1280.webp)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: isLoaded ? 0 : 1,
              pointerEvents: 'none',
            }}
          />
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{
              width: '100vw',
              height: '100vh',
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.5s ease',
            }}
          />
        </div>
      ) : (
        /* Fallback */
        <div
          ref={containerRef}
          className="fixed inset-0 z-0 overflow-hidden pointer-events-none will-change-transform"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/scene-b-valley-2400.webp"
            alt="Valley"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transform: `scale(${1.12 - 0.12 * Math.min(1, Math.max(0, (fallbackProgress - 0.25) / 0.5))})`,
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/scene-a-clear-2400.webp"
            alt="Mountains"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: 1 - Math.min(1, Math.max(0, (fallbackProgress - 0.25) / 0.5)),
            }}
          />
        </div>
      )}

      {/* Fixed Typography & Scroll Prompts Overlay (z-10) */}
      <div
        ref={textContainerRef}
        className="fixed inset-0 z-10 pointer-events-none overflow-hidden will-change-transform"
      >
        {/* Scroll To Explore Indicator: bottom 4vh, tracking .25em. BUG FIX: Hides when p > 0.06! */}
        <div
          ref={scrollIndicatorRef}
          className="absolute left-1/2 bottom-[4vh] -translate-x-1/2 flex flex-col items-center pointer-events-none"
          style={{ opacity: 0.75 }}
        >
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#0F2A4A] font-light select-none">
            SCROLL TO EXPLORE
          </span>
          <svg
            className="w-4 h-4 text-[#0F2A4A] mt-2 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Big "VAYA" Word: NAVY #0F2A4A, Outfit 200, clamp(120px, 19vw, 300px), letter-spacing .25em */}
        <h1
          ref={vayaWordRef}
          className="absolute font-[200] text-[#0F2A4A] select-none leading-none uppercase opacity-0
            left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 text-[24vw]
            md:left-[8vw] md:top-[44%] md:translate-x-0 md:-translate-y-1/2 md:text-[clamp(120px,19vw,300px)]"
          style={{
            willChange: 'opacity, transform',
            letterSpacing: '0.25em',
            textShadow: '0 0 28px rgba(255, 255, 255, 0.35)',
          }}
        >
          VAYA
        </h1>

        {/* Columbus Travel Taglines: BLUE #1E5A8C and #2F6FA8 with enlarged font sizes */}
        <div
          className="absolute flex flex-col pointer-events-none select-none
            left-1/2 top-[55%] -translate-x-1/2 text-center w-full px-6
            md:left-[56vw] md:top-[55%] md:translate-x-0 md:text-left md:w-auto md:px-0"
        >
          <p
            ref={tag1Ref}
            className="font-[300] text-[#1E5A8C] leading-tight opacity-0 mb-2
              text-[clamp(24px,7vw,34px)] md:text-[clamp(32px,3.6vw,56px)]"
            style={{
              willChange: 'opacity, transform',
              textShadow: '0 0 28px rgba(255, 255, 255, 0.35)',
            }}
          >
            Know before you go
          </p>
          <p
            ref={tag2Ref}
            className="font-[300] text-[#2F6FA8] leading-normal opacity-0
              text-[clamp(15px,4.2vw,20px)] md:text-[clamp(18px,1.8vw,26px)]"
            style={{
              willChange: 'opacity, transform',
              textShadow: '0 0 28px rgba(255, 255, 255, 0.35)',
            }}
          >
            Step in, step out
          </p>
        </div>
      </div>

      {/* Runway for Lenis + ScrollTrigger scrub: 480vh desktop, 400vh mobile */}
      <div
        id="runway"
        className="relative w-full pointer-events-none h-[400vh] md:h-[480vh]"
      />

      {/* Revealed Exit Section: #next (Clean beige #f3f2ee, min-height 100svh, grey text "Next section") */}
      <section
        id="next"
        className="relative z-20 min-h-[100svh] bg-[#f3f2ee] flex items-center justify-center select-none"
      >
        <p className="text-[13px] text-[#8e98a8] font-light tracking-[0.25em] uppercase select-none">
          Next section
        </p>
      </section>
    </>
  );
}
