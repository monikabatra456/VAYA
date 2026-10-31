// src/components/section2/GhostBlocks.tsx
// Shopify Editions Sidekick-style decorative faint "ghost blocks" background network
// - 26 seeded/fixed ghost blocks (tiny pills, medium cards with skeleton lines, large soft blocks)
// - 3 depth layer wrappers (far, mid, near) with blur/filter applied to wrapper for 60fps performance
// - GSAP quickTo mouse parallax (far: 6px, mid: 12px, near: 18px)
// - Subtle floating drift (±4-8px, 8-14s sine)
// - Focus pull: when a main card is active/hovered, ghost layers push back (opacity -15%, blur +1px)
// - Strictly pointer-events: none, aria-hidden="true", z-index: 1 (behind path and cards)
"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";

interface GhostBlocksProps {
  isCardActive: boolean;
  isReduced: boolean;
  isMobile: boolean;
}

interface GhostItem {
  id: string;
  type: "pill" | "medium" | "large";
  left: string;
  top: string;
  width: string;
  height: string;
  tint?: "cream" | "amber" | "teal";
  animDur: number;
  animDelay: number;
}

// ── Fixed / Seeded 26 Ghost Blocks ─────────────────────────────────────────────
// Distributed across 3 depth layers (far, mid, near) in open canvas negative space

const FAR_GHOSTS: GhostItem[] = [
  // Large background blocks (very soft & distant)
  { id: "f1", type: "large",  left: "42%", top: "4%",  width: "380px", height: "110px", tint: "cream", animDur: 12.5, animDelay: 0.0 },
  { id: "f2", type: "large",  left: "38%", top: "34%", width: "400px", height: "115px", tint: "amber", animDur: 13.8, animDelay: 1.8 },
  { id: "f3", type: "large",  left: "44%", top: "66%", width: "370px", height: "105px", tint: "cream", animDur: 11.2, animDelay: 3.2 },
  // Tiny pills
  { id: "f4", type: "pill",   left: "6%",  top: "8%",  width: "65px",  height: "18px",  tint: "cream", animDur: 9.0,  animDelay: 0.5 },
  { id: "f5", type: "pill",   left: "88%", top: "10%", width: "85px",  height: "20px",  tint: "teal",  animDur: 10.2, animDelay: 2.1 },
  { id: "f6", type: "pill",   left: "48%", top: "54%", width: "70px",  height: "18px",  tint: "cream", animDur: 9.6,  animDelay: 4.0 },
  { id: "f7", type: "pill",   left: "90%", top: "62%", width: "90px",  height: "22px",  tint: "cream", animDur: 10.8, animDelay: 1.2 },
  { id: "f8", type: "pill",   left: "12%", top: "92%", width: "75px",  height: "18px",  tint: "amber", animDur: 11.5, animDelay: 2.8 },
];

const MID_GHOSTS: GhostItem[] = [
  // Medium cards with skeleton lines
  { id: "m1", type: "medium", left: "46%", top: "18%", width: "240px", height: "72px", tint: "cream", animDur: 9.8,  animDelay: 0.8 },
  { id: "m2", type: "medium", left: "2%",  top: "32%", width: "220px", height: "70px", tint: "cream", animDur: 10.5, animDelay: 2.4 },
  { id: "m3", type: "medium", left: "84%", top: "36%", width: "250px", height: "76px", tint: "teal",  animDur: 8.8,  animDelay: 3.6 },
  { id: "m4", type: "medium", left: "45%", top: "42%", width: "230px", height: "74px", tint: "amber", animDur: 11.0, animDelay: 1.5 },
  { id: "m5", type: "medium", left: "4%",  top: "64%", width: "210px", height: "68px", tint: "cream", animDur: 9.4,  animDelay: 4.2 },
  { id: "m6", type: "medium", left: "86%", top: "72%", width: "240px", height: "74px", tint: "cream", animDur: 10.0, animDelay: 0.2 },
  // Tiny pills
  { id: "m7", type: "pill",   left: "18%", top: "2%",  width: "80px",  height: "20px",  tint: "cream", animDur: 8.5,  animDelay: 1.9 },
  { id: "m8", type: "pill",   left: "76%", top: "6%",  width: "95px",  height: "22px",  tint: "cream", animDur: 9.2,  animDelay: 3.1 },
  { id: "m9", type: "pill",   left: "48%", top: "82%", width: "105px", height: "24px",  tint: "cream", animDur: 10.6, animDelay: 2.0 },
  { id: "m10",type: "pill",   left: "82%", top: "94%", width: "85px",  height: "20px",  tint: "amber", animDur: 9.0,  animDelay: 4.5 },
];

const NEAR_GHOSTS: GhostItem[] = [
  // Medium cards with subtle presence
  { id: "n1", type: "medium", left: "48%", top: "28%", width: "260px", height: "78px", tint: "cream", animDur: 8.4,  animDelay: 1.1 },
  { id: "n2", type: "medium", left: "46%", top: "76%", width: "255px", height: "76px", tint: "cream", animDur: 8.9,  animDelay: 2.7 },
  { id: "n3", type: "large",  left: "40%", top: "88%", width: "360px", height: "100px",tint: "cream", animDur: 10.2, animDelay: 0.6 },
  // Tiny pills
  { id: "n4", type: "pill",   left: "32%", top: "36%", width: "60px",  height: "16px",  tint: "teal",  animDur: 7.8,  animDelay: 3.4 },
  { id: "n5", type: "pill",   left: "64%", top: "40%", width: "70px",  height: "18px",  tint: "cream", animDur: 8.2,  animDelay: 0.9 },
  { id: "n6", type: "pill",   left: "34%", top: "68%", width: "80px",  height: "20px",  tint: "cream", animDur: 7.5,  animDelay: 2.2 },
  { id: "n7", type: "pill",   left: "66%", top: "72%", width: "65px",  height: "16px",  tint: "amber", animDur: 8.6,  animDelay: 4.1 },
  { id: "n8", type: "pill",   left: "50%", top: "96%", width: "90px",  height: "22px",  tint: "cream", animDur: 9.1,  animDelay: 1.6 },
];

function GhostBlockCard({ item }: { item: GhostItem }) {
  // Tint styling (mostly neutral cream, 2-3 warm amber, 1-2 soft teal accents)
  let bg = "rgba(255, 253, 248, 0.55)";
  let border = "1px solid rgba(20, 33, 61, 0.05)";
  let iconBg = "rgba(20, 33, 61, 0.08)";
  let barBg = "rgba(20, 33, 61, 0.10)";

  if (item.tint === "amber") {
    bg = "rgba(255, 250, 240, 0.65)";
    border = "1px solid rgba(217, 130, 43, 0.12)";
    iconBg = "rgba(217, 130, 43, 0.16)";
    barBg = "rgba(217, 130, 43, 0.14)";
  } else if (item.tint === "teal") {
    bg = "rgba(240, 253, 250, 0.60)";
    border = "1px solid rgba(45, 212, 191, 0.12)";
    iconBg = "rgba(45, 212, 191, 0.16)";
    barBg = "rgba(45, 212, 191, 0.12)";
  }

  const isPill = item.type === "pill";
  const isLarge = item.type === "large";

  return (
    <div
      style={{
        position: "absolute",
        left: item.left,
        top: item.top,
        width: item.width,
        height: item.height,
        borderRadius: isPill ? "999px" : "16px",
        background: bg,
        border,
        boxShadow: "0 2px 10px rgba(20, 33, 61, 0.02)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: isPill ? "0 12px" : "10px 14px",
        transformOrigin: "center center",
        transform: "translate3d(-50%, -50%, 0)",
        animation: `ghostFloat ${item.animDur}s ease-in-out infinite alternate`,
        animationDelay: `${item.animDelay}s`,
        willChange: "transform",
      }}
    >
      {!isPill && (
        <>
          <div
            style={{
              width: isLarge ? "28px" : "22px",
              height: isLarge ? "28px" : "22px",
              borderRadius: "50%",
              background: iconBg,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: isLarge ? "6px" : "4px" }}>
            <div style={{ width: "55%", height: isLarge ? "7px" : "5px", borderRadius: "3px", background: barBg }} />
            <div style={{ width: "82%", height: isLarge ? "5px" : "3.5px", borderRadius: "2px", background: "rgba(20, 33, 61, 0.05)" }} />
          </div>
        </>
      )}
    </div>
  );
}

export default function GhostBlocks({ isCardActive, isReduced, isMobile }: GhostBlocksProps) {
  const farRef  = useRef<HTMLDivElement>(null);
  const midRef  = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);

  // ── GSAP QuickTo for 60fps Smooth Parallax ─────────────────────────────────
  const quickFarX  = useRef<gsap.QuickToFunc | null>(null);
  const quickFarY  = useRef<gsap.QuickToFunc | null>(null);
  const quickMidX  = useRef<gsap.QuickToFunc | null>(null);
  const quickMidY  = useRef<gsap.QuickToFunc | null>(null);
  const quickNearX = useRef<gsap.QuickToFunc | null>(null);
  const quickNearY = useRef<gsap.QuickToFunc | null>(null);

  useEffect(() => {
    if (isMobile || isReduced) return;

    if (farRef.current) {
      quickFarX.current = gsap.quickTo(farRef.current, "x", { duration: 0.9, ease: "power2.out" });
      quickFarY.current = gsap.quickTo(farRef.current, "y", { duration: 0.9, ease: "power2.out" });
    }
    if (midRef.current) {
      quickMidX.current = gsap.quickTo(midRef.current, "x", { duration: 0.75, ease: "power2.out" });
      quickMidY.current = gsap.quickTo(midRef.current, "y", { duration: 0.75, ease: "power2.out" });
    }
    if (nearRef.current) {
      quickNearX.current = gsap.quickTo(nearRef.current, "x", { duration: 0.6, ease: "power2.out" });
      quickNearY.current = gsap.quickTo(nearRef.current, "y", { duration: 0.6, ease: "power2.out" });
    }

    const onPointerMove = (e: MouseEvent) => {
      // Normalize mouse coordinates from screen center (-1 to +1)
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;

      // Far: 6px, Mid: 12px, Near: 18px
      quickFarX.current?.(-nx * 6);
      quickFarY.current?.(-ny * 6);
      quickMidX.current?.(-nx * 12);
      quickMidY.current?.(-ny * 12);
      quickNearX.current?.(-nx * 18);
      quickNearY.current?.(-ny * 18);
    };

    window.addEventListener("mousemove", onPointerMove, { passive: true });
    return () => window.removeEventListener("mousemove", onPointerMove);
  }, [isMobile, isReduced]);

  // ── Focus Pull on Main Card Active / Hover ─────────────────────────────────
  // When user hovers/clicks a main card, ghost layers push back (opacity -15%, blur +1px)
  useEffect(() => {
    if (isReduced) return;

    const layers = [
      { ref: farRef,  baseOpacity: 0.08, activeOpacity: 0.065, baseBlur: 8, activeBlur: 9.5, baseScale: 0.85, activeScale: 0.83 },
      { ref: midRef,  baseOpacity: 0.13, activeOpacity: 0.105, baseBlur: 4, activeBlur: 5.5, baseScale: 0.95, activeScale: 0.93 },
      { ref: nearRef, baseOpacity: 0.18, activeOpacity: 0.145, baseBlur: 2, activeBlur: 3.2, baseScale: 1.00, activeScale: 0.98 },
    ];

    layers.forEach(({ ref, baseOpacity, activeOpacity, baseBlur, activeBlur, baseScale, activeScale }) => {
      if (!ref.current) return;
      gsap.to(ref.current, {
        opacity: isCardActive ? activeOpacity : baseOpacity,
        filter: `blur(${isCardActive ? activeBlur : baseBlur}px)`,
        scale: isCardActive ? activeScale : baseScale,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  }, [isCardActive, isReduced]);

  // ── Keyframe definition for gentle float drift ─────────────────────────────
  const floatStyle = `
    @keyframes ghostFloat {
      0%   { transform: translate3d(-50%, calc(-50% - 4px), 0); }
      100% { transform: translate3d(-50%, calc(-50% + 5px), 0); }
    }
  `;

  // On mobile (<768px): render small subset of 8-10 ghosts (tiny + medium only), no parallax
  if (isMobile) {
    const mobileGhosts = [...MID_GHOSTS.slice(0, 5), ...NEAR_GHOSTS.slice(0, 4)];
    return (
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1, // Behind dotted path (zIndex: 2) & cards (zIndex: 6+)
          overflow: "hidden",
          filter: "blur(3.5px)",
          opacity: 0.12,
        }}
      >
        <style>{floatStyle}</style>
        {mobileGhosts.map((item) => (
          <GhostBlockCard key={item.id} item={item} />
        ))}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1, // Strictly behind dotted flight path (zIndex: 2) and cards (zIndex: 6+)
        overflow: "hidden",
      }}
    >
      <style>{floatStyle}</style>

      {/* Layer 1: Far Layer Wrapper (blur 8px, opacity 0.08, scale 0.85) */}
      <div
        ref={farRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          filter: "blur(8px)",
          opacity: 0.08,
          transform: "scale(0.85)",
          transformOrigin: "center center",
          willChange: "transform, opacity, filter",
        }}
      >
        {FAR_GHOSTS.map((item) => (
          <GhostBlockCard key={item.id} item={item} />
        ))}
      </div>

      {/* Layer 2: Mid Layer Wrapper (blur 4px, opacity 0.13, scale 0.95) */}
      <div
        ref={midRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          filter: "blur(4px)",
          opacity: 0.13,
          transform: "scale(0.95)",
          transformOrigin: "center center",
          willChange: "transform, opacity, filter",
        }}
      >
        {MID_GHOSTS.map((item) => (
          <GhostBlockCard key={item.id} item={item} />
        ))}
      </div>

      {/* Layer 3: Near Layer Wrapper (blur 2px, opacity 0.18, scale 1.0) */}
      <div
        ref={nearRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          filter: "blur(2px)",
          opacity: 0.18,
          transform: "scale(1)",
          transformOrigin: "center center",
          willChange: "transform, opacity, filter",
        }}
      >
        {NEAR_GHOSTS.map((item) => (
          <GhostBlockCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

