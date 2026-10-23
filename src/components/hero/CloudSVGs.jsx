// src/components/hero/CloudSVGs.jsx
// 10 Procedural Cumulus Cloud Variants (real-looking, billowy, volume shaded)
// No glowing pills, no fake ellipses, no drop-shadow halos.
// Each cloud = 25-45 overlapping circles clustered into a cumulus silhouette:
// domed top, flatter base, cool blue-grey underside #dfe7f3 with faint peach tint #ffe6cf,
// lit top #ffffff, edge detail with feTurbulence (0.012, 4 octaves) + feDisplacementMap (scale ~40), tiny 1.5px blur.

"use client";

import React, { useMemo } from "react";
import { HERO_CONFIG as C } from "@/app/heroConfig";

// Deterministic PRNG
function createRng(seed) {
  let s = (seed % 2147483647);
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate circle clusters for one cumulus variant
function generateCumulusVariant(variantIdx, masterSeed = 42) {
  const rng = createRng(masterSeed * 100 + variantIdx * 23 + 17);
  const circles = [];

  const cx = 500;
  const baseY = 290;

  // 1. Base / underside layer (shaded cool blue-grey #dfe7f3 + faint peach #ffe6cf)
  const baseCount = 8 + Math.floor(rng() * 4);
  for (let i = 0; i < baseCount; i++) {
    const t = (i / (baseCount - 1)) * 2 - 1; // -1 to 1
    const x = cx + t * 270 + (rng() - 0.5) * 35;
    const y = baseY + (rng() - 0.5) * 20;
    const r = 50 + rng() * 28;
    const isPeach = rng() < 0.40;
    circles.push({
      cx: Math.round(x),
      cy: Math.round(y),
      r: Math.round(r),
      fill: isPeach ? "url(#cg-circle-peach)" : "url(#cg-circle-shade)",
      opacity: 0.85 + rng() * 0.12,
    });
  }

  // 2. Main cloud body puffs (soft volume)
  const midCount = 12 + Math.floor(rng() * 5);
  for (let i = 0; i < midCount; i++) {
    const angle = rng() * Math.PI;
    const dist = 40 + rng() * 180;
    const x = cx + Math.cos(angle) * dist * 1.25;
    const y = baseY - Math.sin(angle) * dist * 0.70 - 25;
    const r = 55 + rng() * 32;
    circles.push({
      cx: Math.round(x),
      cy: Math.round(y),
      r: Math.round(r),
      fill: "url(#cg-circle-body)",
      opacity: 0.88 + rng() * 0.10,
    });
  }

  // 3. Domed top puffs (lit pure white #ffffff + sun-facing rim)
  const topCount = 9 + Math.floor(rng() * 4);
  for (let i = 0; i < topCount; i++) {
    const t = (i / (topCount - 1)) * 2 - 1;
    const domeHeight = Math.cos(t * Math.PI * 0.48);
    const x = cx + t * 210 + (rng() - 0.5) * 30;
    const y = baseY - 100 - domeHeight * 105 + (rng() - 0.5) * 25;
    const r = 45 + rng() * 30;
    circles.push({
      cx: Math.round(x),
      cy: Math.round(y),
      r: Math.round(r),
      fill: "url(#cg-circle-lit)",
      opacity: 0.92 + rng() * 0.08,
    });
  }

  // 4. Irregular billowy edge details
  const edgeCount = 6 + Math.floor(rng() * 4);
  for (let i = 0; i < edgeCount; i++) {
    const angle = rng() * Math.PI * 1.15 - 0.1;
    const x = cx + Math.cos(angle) * 240 + (rng() - 0.5) * 25;
    const y = baseY - Math.sin(angle) * 150 + (rng() - 0.5) * 25;
    const r = 26 + rng() * 20;
    circles.push({
      cx: Math.round(x),
      cy: Math.round(y),
      r: Math.round(r),
      fill: "url(#cg-circle-lit)",
      opacity: 0.80 + rng() * 0.15,
    });
  }

  return circles;
}

// Global SVG definition filters & gradients (shared across all cloud instances)
export function CloudDefs() {
  return (
    <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
      <defs>
        {/* Billowy cumulus edge detail: feTurbulence + feDisplacementMap + tiny 1.5px blur */}
        <filter id="cumulus-filter" x="-25%" y="-35%" width="150%" height="170%" colorInterpolationFilters="linearRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012"
            numOctaves="4"
            seed={C.CLOUD_STYLE_SEED || 42}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="36"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="1.5" result="smoothed" />
        </filter>

        {/* Soft radial gradients: white center -> transparent edge */}
        <radialGradient id="cg-circle-lit" cx="45%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.88" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.68" />
          <stop offset="85%" stopColor="#fdfcf8" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#fdfcf8" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="cg-circle-body" cx="48%" cy="40%" r="58%">
          <stop offset="0%" stopColor="#f8faff" stopOpacity="0.84" />
          <stop offset="55%" stopColor="#eef4fd" stopOpacity="0.58" />
          <stop offset="85%" stopColor="#e5eef9" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#e5eef9" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="cg-circle-shade" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#dbe5f2" stopOpacity="0.80" />
          <stop offset="60%" stopColor="#dfe7f3" stopOpacity="0.52" />
          <stop offset="88%" stopColor="#dfe7f3" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#dfe7f3" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="cg-circle-peach" cx="45%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#ffe6cf" stopOpacity="0.80" />
          <stop offset="55%" stopColor="#f7ddc6" stopOpacity="0.48" />
          <stop offset="88%" stopColor="#f7ddc6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#f7ddc6" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// Cloud Sprite component
export function CumulusCloudSprite({ variant = 0 }) {
  const circles = useMemo(() => generateCumulusVariant(variant, C.CLOUD_STYLE_SEED || 42), [variant]);

  return (
    <svg
      viewBox="160 70 680 300"
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-auto block select-none overflow-visible"
      aria-hidden="true"
    >
      <g filter="url(#cumulus-filter)">
        {circles.map((c, i) => (
          <circle
            key={i}
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            fill={c.fill}
            opacity={c.opacity}
          />
        ))}
      </g>
    </svg>
  );
}

// ── 12 Cloud layout definitions for Scene A ──────────────────────────────────
// Distributed naturally along the mountain slopes, leaving lake center open and clear!
// - Left mountain slope belt (x 6-30%, y 40-62%)
// - Right mountain slope belt (x 68-92%, y 40-62%)
// - Distant valley end (x 42-56%, y 44-50%, smaller 11-14vw)
// - 2 Clouds crossing in front of plane during rise
export const SCENE_A_CLOUDS = [
  // ─ Far valley end (between distant ridges) ─
  { id: "ca-1", variant: 0, depth: 0.18, pos0: { x: 43, y: 46 }, widthVw: 12, inFrontOfPlane: false, baseOpacity: 0.85 },
  { id: "ca-2", variant: 1, depth: 0.22, pos0: { x: 55, y: 47 }, widthVw: 13, inFrontOfPlane: false, baseOpacity: 0.85 },

  // ─ Left mountain slopes (behind left slope occluder) ─
  { id: "ca-3", variant: 2, depth: 0.35, pos0: { x: 12, y: 42 }, widthVw: 19, inFrontOfPlane: false, baseOpacity: 0.90 },
  { id: "ca-4", variant: 3, depth: 0.50, pos0: { x: 18, y: 50 }, widthVw: 22, inFrontOfPlane: false, baseOpacity: 0.92 },
  { id: "ca-5", variant: 4, depth: 0.65, pos0: { x: 8,  y: 58 }, widthVw: 24, inFrontOfPlane: false, baseOpacity: 0.90 },
  { id: "ca-6", variant: 5, depth: 0.80, pos0: { x: 14, y: 68 }, widthVw: 26, inFrontOfPlane: false, baseOpacity: 0.88 },

  // ─ Right mountain slopes (behind right cliff occluder) ─
  { id: "ca-7", variant: 6, depth: 0.38, pos0: { x: 76, y: 43 }, widthVw: 19, inFrontOfPlane: false, baseOpacity: 0.90 },
  { id: "ca-8", variant: 7, depth: 0.52, pos0: { x: 82, y: 51 }, widthVw: 22, inFrontOfPlane: false, baseOpacity: 0.92 },
  { id: "ca-9", variant: 8, depth: 0.68, pos0: { x: 72, y: 59 }, widthVw: 25, inFrontOfPlane: false, baseOpacity: 0.90 },
  { id: "ca-10", variant: 0, depth: 0.82, pos0: { x: 80, y: 69 }, widthVw: 26, inFrontOfPlane: false, baseOpacity: 0.88 },

  // ─ 2 Clouds that cross in FRONT of the plane during its rise ─
  { id: "ca-11", variant: 9, depth: 0.45, pos0: { x: 47, y: 62 }, widthVw: 16, inFrontOfPlane: true, baseOpacity: 0.85 },
  { id: "ca-12", variant: 3, depth: 0.58, pos0: { x: 51, y: 54 }, widthVw: 17, inFrontOfPlane: true, baseOpacity: 0.86 },
];

// ── 8 Cloud layout definitions for Scene B (Golden-dawn lake) ────────────────
export const SCENE_B_CLOUDS = [
  { id: "cb-1", variant: 1, depth: 0.20, pos0: { x: 42, y: 46 }, widthVw: 14, inFrontOfPlane: false, baseOpacity: 0.86 },
  { id: "cb-2", variant: 2, depth: 0.26, pos0: { x: 56, y: 47 }, widthVw: 15, inFrontOfPlane: false, baseOpacity: 0.86 },
  { id: "cb-3", variant: 4, depth: 0.40, pos0: { x: 16, y: 47 }, widthVw: 20, inFrontOfPlane: false, baseOpacity: 0.90 },
  { id: "cb-4", variant: 6, depth: 0.50, pos0: { x: 78, y: 48 }, widthVw: 21, inFrontOfPlane: false, baseOpacity: 0.90 },
  { id: "cb-5", variant: 7, depth: 0.62, pos0: { x: 12, y: 58 }, widthVw: 23, inFrontOfPlane: false, baseOpacity: 0.92 },
  { id: "cb-6", variant: 8, depth: 0.70, pos0: { x: 82, y: 57 }, widthVw: 24, inFrontOfPlane: false, baseOpacity: 0.90 },
  { id: "cb-7", variant: 0, depth: 0.35, pos0: { x: 48, y: 52 }, widthVw: 16, inFrontOfPlane: false, baseOpacity: 0.85 },
  { id: "cb-8", variant: 9, depth: 0.80, pos0: { x: 74, y: 68 }, widthVw: 26, inFrontOfPlane: false, baseOpacity: 0.88 },
];
