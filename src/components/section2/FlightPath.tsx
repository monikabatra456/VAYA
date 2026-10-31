// src/components/section2/FlightPath.tsx
// Amber paper airplane flying along smooth dotted S-curve path connecting card nodes
// - Path calculated dynamically from card outer borders (getBoundingClientRect)
// - Plane rests at card edge (never enters inside the card)
// - Amber/orange paper plane (#E58A2B, ~32px) with soft shadow
// - On hover/click, flies smoothly along path (power3.out, 1.0-1.4s), auto-aligning tangent (flips backwards)
// - Rest: stays parked at last visited card node (starts at Overcrowding)
"use client";

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import gsap from "gsap";

export interface FlightPathRef {
  isFlying: () => boolean;
}

interface FlightPathProps {
  activeId: string | null;
  nodes: { id: string; x: number; y: number }[];
  isReduced: boolean;
  onArrival?: (id: string) => void;
}

function buildFlightPathD(nodes: { x: number; y: number }[]): string {
  if (!nodes || nodes.length < 6) return "";
  const [p0, p1, p2, p3, p4, p5] = nodes;

  // Segment 0 -> 1: Overcrowding right edge to Local guides left edge
  const dx01 = p1.x - p0.x;
  const s01 = `M ${p0.x},${p0.y} C ${p0.x + dx01 * 0.45},${p0.y} ${p1.x - dx01 * 0.45},${p1.y} ${p1.x},${p1.y}`;

  // Segment 1 -> 2: Local guides left edge down & back to Changing plans right edge
  const s12 = `C ${p1.x - 60},${p1.y + (p2.y - p1.y) * 0.45} ${p2.x + 80},${p2.y - (p2.y - p1.y) * 0.45} ${p2.x},${p2.y}`;

  // Segment 2 -> 3: Changing plans right edge across to Prices left edge
  const dx23 = p3.x - p2.x;
  const s23 = `C ${p2.x + dx23 * 0.45},${p2.y} ${p3.x - dx23 * 0.45},${p3.y} ${p3.x},${p3.y}`;

  // Segment 3 -> 4: Prices left edge down & back to Safety concerns right edge
  const s34 = `C ${p3.x - 60},${p3.y + (p4.y - p3.y) * 0.45} ${p4.x + 80},${p4.y - (p4.y - p3.y) * 0.45} ${p4.x},${p4.y}`;

  // Segment 4 -> 5: Safety concerns right edge across to Planning left edge
  const dx45 = p5.x - p4.x;
  const s45 = `C ${p4.x + dx45 * 0.45},${p4.y} ${p5.x - dx45 * 0.45},${p5.y} ${p5.x},${p5.y}`;

  return `${s01} ${s12} ${s23} ${s34} ${s45}`;
}

const FlightPath = forwardRef<FlightPathRef, FlightPathProps>(function FlightPath(
  { activeId, nodes, isReduced, onArrival },
  ref
) {
  const pathRef        = useRef<SVGPathElement>(null);
  const planeRef       = useRef<HTMLDivElement>(null);
  const currentDistRef = useRef(0);
  const isFlyingRef    = useRef(false);
  const planeTween     = useRef<gsap.core.Tween | null>(null);
  const [nodeOffsets, setNodeOffsets] = useState<Record<string, number>>({});

  useImperativeHandle(ref, () => ({
    isFlying: () => isFlyingRef.current,
  }));

  const pathD = buildFlightPathD(nodes);

  // ── Calculate Distances of each Node along SVG Path ────────────────────────
  useEffect(() => {
    const path = pathRef.current;
    if (!path || nodes.length < 6) return;

    try {
      const total = path.getTotalLength();
      if (total <= 0) return;

      const offsets: Record<string, number> = {};
      const samples = 150;

      nodes.forEach((node) => {
        let bestDist = 0;
        let minDiff = Infinity;
        for (let s = 0; s <= samples; s++) {
          const dist = (s / samples) * total;
          const pt = path.getPointAtLength(dist);
          const diff = Math.hypot(pt.x - node.x, pt.y - node.y);
          if (diff < minDiff) {
            minDiff = diff;
            bestDist = dist;
          }
        }
        offsets[node.id] = bestDist;
      });

      setNodeOffsets(offsets);

      // Place plane on initial node (Overcrowding: offset 0)
      if (currentDistRef.current === 0 && planeRef.current) {
        const pt = path.getPointAtLength(0);
        const pAhead = path.getPointAtLength(Math.min(total, 4));
        const angle = (Math.atan2(pAhead.y - pt.y, pAhead.x - pt.x) * 180) / Math.PI;
        planeRef.current.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0) translate(-50%, -50%) rotate(${angle}deg)`;
      }
    } catch {
      // SVG not ready in DOM yet
    }
  }, [nodes, pathD]);

  // ── Animate Plane on Hover / Active Card Change ───────────────────────────
  useEffect(() => {
    if (!activeId) return; // If unhovered, stay parked at last visited node!
    const path = pathRef.current;
    const plane = planeRef.current;
    if (!path || !plane) return;

    const targetDist = nodeOffsets[activeId];
    if (targetDist === undefined) return;

    const startDist = currentDistRef.current;
    const delta = Math.abs(targetDist - startDist);
    if (delta < 2) return;

    try {
      const total = path.getTotalLength();
      if (total <= 0) return;

      // Speed: power3.out, 1.0 - 1.4s, never faster than 0.65s
      const duration = isReduced
        ? 0.2
        : Math.max(0.65, Math.min(1.4, 0.5 + (delta / total) * 1.5));
      const isBackwards = targetDist < startDist;

      planeTween.current?.kill();
      isFlyingRef.current = true;

      const proxy = { dist: startDist };

      planeTween.current = gsap.to(proxy, {
        dist: targetDist,
        duration,
        ease: "power3.out",
        onUpdate: () => {
          const d = proxy.dist;
          currentDistRef.current = d;
          const pt = path.getPointAtLength(d);

          const pAhead = path.getPointAtLength(Math.min(total, d + 2));
          const pBehind = path.getPointAtLength(Math.max(0, d - 2));
          let angle = (Math.atan2(pAhead.y - pBehind.y, pAhead.x - pBehind.x) * 180) / Math.PI;

          // Flip 180deg when flying backwards so plane faces travel direction
          if (isBackwards) {
            angle += 180;
          }

          plane.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0) translate(-50%, -50%) rotate(${angle}deg)`;
        },
        onComplete: () => {
          isFlyingRef.current = false;
          if (activeId) onArrival?.(activeId);
        },
      });
    } catch {
      // SVG measurement fallback
    }
  }, [activeId, nodeOffsets, isReduced]);

  return (
    <>
      {/* ── Layer 1: Dotted S-Curve Path BEHIND cards (zIndex: 2) ── */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          overflow: "visible",
          zIndex: 2, // Behind cards
        }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="plane-s-trail" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#E58A2B" stopOpacity="0.30"/>
            <stop offset="50%"  stopColor="#C4782A" stopOpacity="0.45"/>
            <stop offset="100%" stopColor="#F5C77E" stopOpacity="0.40"/>
          </linearGradient>
        </defs>

        {pathD && (
          <path
            ref={pathRef}
            d={pathD}
            fill="none"
            stroke="#D9A04A"
            strokeOpacity="0.4"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* ── Layer 2: Amber Paper Plane (#E58A2B, 32px, zIndex: 4, outside cards) ── */}
      <div
        ref={planeRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 55, // Above cards (50) so plane is always fully visible at card border
          filter: "drop-shadow(0 2px 6px rgba(229,138,43,0.55))",
          willChange: "transform",
        }}
        aria-hidden="true"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ overflow: "visible" }}>
          <path
            d="M2.5 4L22 12L2.5 20L6.5 12L2.5 4Z"
            fill="#E58A2B"
            stroke="#C4701D"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M6.5 12L22 12"
            stroke="#FFF2D6"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </>
  );
});

export default FlightPath;
