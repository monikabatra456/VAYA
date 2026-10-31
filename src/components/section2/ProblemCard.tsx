// src/components/section2/ProblemCard.tsx
"use client";

import React, { useRef, useCallback, CSSProperties, useState } from "react";
import type { Problem } from "./data/problems";

const ICONS: Record<string, React.ReactNode> = {
  crowd: (
    <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  ),
  guide: (
    <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M12 12v3M10 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  ),
  price: (
    <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M12 6v12M9 9.5c0-1.1.9-2 2-2h2a2 2 0 0 1 0 4h-2a2 2 0 0 0 0 4h2a2 2 0 0 0 2-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  ),
  weather: (
    <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  safety: (
    <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  ),
  plan: (
    <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M8 14h4M8 18h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  ),
};

function ArrowIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
      <path d="M3 11L11 3M11 3H5.5M11 3v5.5" stroke={filled ? "#FFFFFF" : "#2F4A63"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

interface ProblemCardProps {
  problem: Problem;
  isActive: boolean;
  isReduced: boolean;
  layerScale?: number;
  layerOpacity: number;
  layerBlur: number;
  zIndex?: number;
  onClick: (id: string, rect: DOMRect) => void;
  onActivate: (id: string) => void;
  onDeactivate?: () => void;
  style?: CSSProperties;
  innerRef?: (el: HTMLDivElement | null) => void;
}

export default function ProblemCard({
  problem,
  isActive,
  isReduced,
  layerScale = 1.0,
  layerOpacity,
  layerBlur,
  zIndex = 10,
  onClick,
  onActivate,
  onDeactivate,
  style,
  innerRef,
}: ProblemCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleClick = useCallback(() => {
    const rect = wrapperRef.current?.getBoundingClientRect() ?? null;
    if (rect) onClick(problem.id, rect);
  }, [problem.id, onClick]);

  const handleMouseEnter = useCallback(() => onActivate(problem.id), [problem.id, onActivate]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive || isReduced) return;
    const el = wrapperRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTilt({
      x: -((e.clientY - r.top  - r.height / 2) / (r.height / 2)) * 5.0,
      y:  ((e.clientX - r.left - r.width  / 2) / (r.width  / 2)) * 5.0,
    });
  }, [isActive, isReduced]);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    onDeactivate?.();
  }, [onDeactivate]);

  const tiltTransform = isActive && !isReduced && (tilt.x !== 0 || tilt.y !== 0)
    ? `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
    : "none";

  const isRelative = style?.position === "relative";
  const cardW = isRelative ? "100%" : "clamp(300px, 19vw, 350px)";

  return (
    <div
      ref={(el) => {
        (wrapperRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        innerRef?.(el);
      }}
      className={`s2-card${isActive ? " s2-card--active" : " s2-card--ghost"}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "absolute",
        width: cardW,
        zIndex: isActive ? 50 : zIndex,
        filter: isActive ? "none" : layerBlur > 0 ? `blur(${layerBlur}px)` : "none",
        opacity: layerOpacity,
        transform: `scale(${layerScale})`,
        transformOrigin: "center center",
        transition: isReduced
          ? "none"
          : "filter 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms cubic-bezier(0.22, 1, 0.36, 1), transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "transform, filter, opacity",
        ...style,
      }}
    >
      <button
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onFocus={() => onActivate(problem.id)}
        onBlur={onDeactivate}
        aria-label={`${problem.title}: ${problem.description}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 16px",
          background: isActive
            ? "linear-gradient(135deg, #FFFFFF 0%, #FFF6E8 100%)"
            : "rgba(255, 255, 255, 0.80)",
          borderRadius: "20px",
          border: isActive
            ? "1.5px solid #D9A04A"
            : "1px solid rgba(206, 178, 140, 0.22)",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
          boxShadow: isActive
            ? "0 24px 60px rgba(120, 80, 20, 0.20), 0 8px 20px rgba(20, 33, 61, 0.08), 0 0 35px rgba(217, 160, 74, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.95)"
            : "0 8px 24px rgba(120, 90, 50, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.80)",
          transition: isReduced
            ? "none"
            : "border-color 350ms ease, box-shadow 350ms ease, background 350ms ease, transform 280ms cubic-bezier(.22,1,.36,1)",
          transformOrigin: "center center",
          transform: "none",
          willChange: "box-shadow, border-color",
        } as React.CSSProperties}
      >
        {/* Subtle diagonal sheen highlight on active card */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            background: "linear-gradient(120deg, rgba(255,255,255,0.65) 0%, transparent 40%)",
            opacity: isActive ? 0.7 : 0.3,
            pointerEvents: "none",
            zIndex: 0,
            transition: "opacity 500ms ease",
          }}
        />

        {/* 40px Icon: warm-beige tile (#F3E7D3) with navy line icon */}
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F3E7D3",
          color: "#2F4A63",
          border: "1px solid rgba(206,178,140,0.35)",
          boxShadow: isActive ? "0 4px 10px rgba(120,90,50,0.14)" : "0 2px 6px rgba(120,90,50,0.06)",
          transition: isReduced ? "none" : "box-shadow 0.4s ease, transform 0.4s ease",
          position: "relative",
          zIndex: 1,
        }}>
          {ICONS[problem.icon]}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
          <h3 style={{
            fontFamily: "var(--font-outfit), 'Plus Jakarta Sans', sans-serif",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: "clamp(16px, 1.1vw, 17.5px)",
            fontWeight: 700,
            color: isActive ? "#14213D" : "rgba(20, 33, 61, 0.58)",
            lineHeight: 1.25,
            marginBottom: "3px",
            letterSpacing: "-0.02em",
            transition: "color 500ms ease",
          }}>
            {problem.title}
          </h3>
          <p style={{
            fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(12px, 0.8vw, 13px)",
            fontWeight: 400,
            lineHeight: 1.45,
            color: isActive ? "#6B7280" : "rgba(107, 114, 128, 0.75)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            margin: 0,
            transition: "color 500ms ease",
          }}>
            {problem.description}
          </p>

          {/* Curiosity badge: ✦ How VAYA helps you • Tap to see */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              marginTop: "5px",
              padding: "2px 8px",
              borderRadius: "999px",
              background: isActive
                ? "rgba(217, 160, 74, 0.16)"
                : "rgba(217, 160, 74, 0.08)",
              border: isActive
                ? "1px solid rgba(217, 160, 74, 0.50)"
                : "1px solid rgba(217, 160, 74, 0.22)",
              whiteSpace: "nowrap",
              transition: isReduced ? "none" : "opacity 400ms ease, background 400ms ease, border-color 400ms ease",
            }}
          >
            <span style={{ fontSize: "9.5px", color: "#D9A04A" }}>✦</span>
            <span
              style={{
                fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                color: "#C4782A",
                letterSpacing: "0.01em",
              }}
            >
              How VAYA helps you
            </span>
            <span
              style={{
                fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                color: "#C4782A",
                opacity: 0.85,
              }}
            >
              • Tap to see
            </span>
          </div>
        </div>

        {/* Arrow button: filled navy circle when active, outline when inactive */}
        <div style={{
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isActive ? "#14213D" : "rgba(255, 255, 255, 0.65)",
          border: isActive ? "none" : "1.5px solid rgba(206, 178, 140, 0.40)",
          color: isActive ? "#FFFFFF" : "#2F4A63",
          boxShadow: isActive ? "0 4px 12px rgba(20, 33, 61, 0.25)" : "none",
          transition: isReduced ? "none" : "all 400ms ease",
          position: "relative",
          zIndex: 1,
        }}>
          <ArrowIcon filled={isActive} />
        </div>
      </button>
    </div>
  );
}
