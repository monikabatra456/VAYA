'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  DOLLY_ZOOM,
  NEAR_BOOST,
  SWAY_DRIFT,
} from '../lib/heroTimeline';

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform sampler2D uBg;
uniform sampler2D uBgDepth;
uniform sampler2D uScene2;
uniform sampler2D uScene2Depth;

uniform float uProgress;       // Continuous camera progress 0.0 -> 1.0
uniform float uCrossfade;      // Crossfade progress 0.0 -> 1.0 (over SWAP_START..SWAP_END)
uniform float uBloom;          // White bloom intensity 0.0 -> 0.25 -> 0.0 over swap
uniform vec2 uResolution;      // Viewport dimensions in px
uniform vec2 uBgRes;           // vec2(1672.0, 941.0)
uniform vec2 uScene2Res;       // vec2(2752.0, 1536.0)
uniform vec2 uVp;              // vec2(0.5, 0.58) (vanishing point)
uniform float uDollyZoom;      // 0.55
uniform float uNearBoost;      // 1.4
uniform float uTime;           // Elapsed seconds for lake shimmer

varying vec2 vUv;

// CSS object-fit: cover coordinate mapping
vec2 getCoverUv(vec2 uv, vec2 screenRes, vec2 imgRes) {
  float screenAspect = screenRes.x / screenRes.y;
  float imgAspect = imgRes.x / imgRes.y;
  vec2 ratio = vec2(
    min(screenAspect / imgAspect, 1.0),
    min(imgAspect / screenAspect, 1.0)
  );
  return vec2(
    uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    uv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );
}

void main() {
  // Screen UV with top-left origin (y=0 top, y=1 bottom)
  vec2 screenUv = vec2(vUv.x, 1.0 - vUv.y);
  vec3 skyTone = vec3(0.86, 0.92, 0.96);

  // -----------------------------------------------------------------
  // ONE CONTINUOUS CAMERA DOLLY: Scene A and Scene B share exact zoom
  // -----------------------------------------------------------------
  // 1. SCENE A (bg.jpg + bg-depth.png)
  vec2 baseUvA = getCoverUv(screenUv, uResolution, uBgRes);
  float rawDepthA = texture2D(uBgDepth, clamp(baseUvA, 0.0, 1.0)).r;
  float factorA = uNearBoost * rawDepthA + 1.0 - uNearBoost * 0.5;
  float scaleA = 1.0 + uProgress * uDollyZoom * factorA;
  vec2 zoomedUvA = uVp + (baseUvA - uVp) / max(0.001, scaleA);

  // Second refinement iteration for smooth foreground terrain
  float depthA2 = texture2D(uBgDepth, clamp(zoomedUvA, 0.0, 1.0)).r;
  float factorA2 = uNearBoost * depthA2 + 1.0 - uNearBoost * 0.5;
  float scaleA2 = 1.0 + uProgress * uDollyZoom * factorA2;
  vec2 finalUvA = uVp + (baseUvA - uVp) / max(0.001, scaleA2);

  vec2 clampedUvA = clamp(finalUvA, 0.0, 1.0);
  float edgeDistA = min(min(finalUvA.x, 1.0 - finalUvA.x), min(finalUvA.y, 1.0 - finalUvA.y));
  float edgeFadeA = smoothstep(-0.015, 0.025, edgeDistA);
  vec4 colorA = texture2D(uBg, clampedUvA);
  colorA.rgb = mix(skyTone, colorA.rgb, edgeFadeA);

  // 2. SCENE B (scene2.jpg + scene2-depth.png)
  // Scene B starts at EXACTLY the zoom where Scene A is (continuous dolly)
  vec2 baseUvB = getCoverUv(screenUv, uResolution, uScene2Res);
  float rawDepthB = texture2D(uScene2Depth, clamp(baseUvB, 0.0, 1.0)).r;
  float factorB = uNearBoost * rawDepthB + 1.0 - uNearBoost * 0.5;
  float scaleB = 1.0 + uProgress * uDollyZoom * factorB;
  vec2 zoomedUvB = uVp + (baseUvB - uVp) / max(0.001, scaleB);

  float depthB2 = texture2D(uScene2Depth, clamp(zoomedUvB, 0.0, 1.0)).r;
  float factorB2 = uNearBoost * depthB2 + 1.0 - uNearBoost * 0.5;
  float scaleB2 = 1.0 + uProgress * uDollyZoom * factorB2;
  vec2 finalUvB = uVp + (baseUvB - uVp) / max(0.001, scaleB2);

  vec2 clampedUvB = clamp(finalUvB, 0.0, 1.0);
  float edgeDistB = min(min(finalUvB.x, 1.0 - finalUvB.x), min(finalUvB.y, 1.0 - finalUvB.y));
  float edgeFadeB = smoothstep(-0.015, 0.025, edgeDistB);
  vec4 colorB = texture2D(uScene2, clampedUvB);
  colorB.rgb = mix(skyTone, colorB.rgb, edgeFadeB);

  // Warm tint match during swap (#ffe9c8, soft-light 0.15)
  vec3 warmTint = vec3(1.0, 0.914, 0.784);
  colorB.rgb = mix(colorB.rgb, colorB.rgb * warmTint * 1.08, 0.15 * (1.0 - uCrossfade));

  // Lake shimmer in Scene B (turquoise lake sparkle)
  float isLake = smoothstep(0.56, 0.65, clampedUvB.y) * (1.0 - smoothstep(0.86, 0.96, clampedUvB.y))
               * smoothstep(0.22, 0.35, clampedUvB.x) * (1.0 - smoothstep(0.68, 0.80, clampedUvB.x))
               * smoothstep(0.25, 0.38, depthB2) * (1.0 - smoothstep(0.52, 0.62, depthB2));

  if (isLake > 0.01 && uCrossfade > 0.1) {
    float shimmer = sin(clampedUvB.x * 240.0 + uTime * 2.2) * cos(clampedUvB.y * 190.0 - uTime * 1.8);
    float shimmerSpec = pow(max(0.0, shimmer), 4.0) * 0.14 * isLake * uCrossfade;
    colorB.rgb += vec3(0.92, 0.96, 1.0) * shimmerSpec;
  }

  // -----------------------------------------------------------------
  // Seamless Crossfade + Soft White Bloom over the swap
  // -----------------------------------------------------------------
  vec4 finalColor = mix(colorA, colorB, uCrossfade);

  // Soft white bloom (0.0 -> 0.25 -> 0.0) to eliminate any transition seam
  if (uBloom > 0.001) {
    finalColor.rgb = mix(finalColor.rgb, vec3(1.0, 0.98, 0.95), uBloom);
  }

  gl_FragColor = finalColor;
}
`;

export default function HeroCanvas({
  progress = 0,
  crossfade = 0,
  bloom = 0,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const uniformsRef = useRef(null);

  // Update uniforms when props change
  useEffect(() => {
    if (uniformsRef.current) {
      uniformsRef.current.uProgress.value = progress;
      uniformsRef.current.uCrossfade.value = crossfade;
      uniformsRef.current.uBloom.value = bloom;
    }
  }, [progress, crossfade, bloom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
    } catch (e) {
      console.warn('[HeroCanvas] WebGL context failed', e);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const textureLoader = new THREE.TextureLoader();
    const configureTexture = (tex) => {
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.flipY = false;
    };

    const bgTex = textureLoader.load('/hero/bg.jpg', configureTexture);
    const bgDepthTex = textureLoader.load('/hero/bg-depth.png', configureTexture);
    const scene2Tex = textureLoader.load('/hero/scene2.jpg', configureTexture);
    const scene2DepthTex = textureLoader.load('/hero/scene2-depth.png', configureTexture);

    const uniforms = {
      uBg: { value: bgTex },
      uBgDepth: { value: bgDepthTex },
      uScene2: { value: scene2Tex },
      uScene2Depth: { value: scene2DepthTex },
      uProgress: { value: progress },
      uCrossfade: { value: crossfade },
      uBloom: { value: bloom },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uBgRes: { value: new THREE.Vector2(1672.0, 941.0) },
      uScene2Res: { value: new THREE.Vector2(2752.0, 1536.0) },
      uVp: { value: new THREE.Vector2(0.5, 0.58) },
      uDollyZoom: { value: DOLLY_ZOOM },
      uNearBoost: { value: NEAR_BOOST },
      uTime: { value: 0 },
    };
    uniformsRef.current = uniforms;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      depthTest: false,
      depthWrite: false,
    });

    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Camera sway loop: TRANSLATE ONLY (+-6px drift), NO ROLL!
    let animId;
    const startTime = performance.now();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animate = () => {
      const now = performance.now();
      const elapsed = (now - startTime) * 0.001;

      uniforms.uTime.value = elapsed;

      // Apply camera sway to WebGL canvas ONLY, as translate only (ZERO roll!)
      if (!reducedMotion && containerRef.current) {
        const driftX = Math.sin(elapsed * 0.5) * (SWAY_DRIFT || 6.0);
        const driftY = Math.cos(elapsed * 0.4) * ((SWAY_DRIFT || 6.0) * 0.5);
        containerRef.current.style.transform = `translate3d(${driftX.toFixed(2)}px, ${driftY.toFixed(2)}px, 0)`;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      bgTex.dispose();
      bgDepthTex.dispose();
      scene2Tex.dispose();
      scene2DepthTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="hero-webgl-wrapper" ref={containerRef}>
      <canvas ref={canvasRef} className="hero-webgl-canvas" />
    </div>
  );
}
