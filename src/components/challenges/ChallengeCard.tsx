// src/components/challenges/ChallengeCard.tsx
// Individual interactive challenge card — Shopify Editions floating card pattern
// Animation constants sourced from www.shopify.com2.har:
//   introScaleMultiplier: 0.5 (HAR: Se.introScaleMultiplier)
//   entryEasing: "cubic-bezier(0.34, 1.56, 0.64, 1)" (HAR: spring easing)
//   glowLayer: 130% card width, warm amber (VAYA palette adaptation)
//   pushOutPopIn: arrow btn exits/re-enters on hover (HAR: animate-push-out-pop-in)

"use client";

import React, { useRef, useEffect, useCallback } from "react";
import type { ChallengeCard as ChallengeCardType } from "./challengesData";

interface CardIconProps {
  iconId: string;
}

function CardIcon({ iconId }: CardIconProps) {
  const icons: Record<string, React.ReactNode> = {
    crowd: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    guide: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M6 21v-1a6 6 0 0 1 12 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M12 14v3M9 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    price: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    weather: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    safety: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    plan: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  };
  return <>{icons[iconId] ?? icons.plan}</>;
}

interface ChallengeCardProps {
  card: ChallengeCardType;
  onClick: () => void;
  isReduced: boolean;
}

export default function ChallengeCard({ card, onClick, isReduced }: ChallengeCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (isReduced) return;
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    // Scale up card slightly
    card.style.transform = `scale(1.035) ${card.style.transform.replace(/scale\([^)]+\)/g, "")}`;
    card.style.boxShadow =
      "0 20px 60px rgba(196,130,70,0.22), 0 8px 24px rgba(37,32,95,0.14), 0 2px 6px rgba(37,32,95,0.08)";

    // Fade in glow
    glow.style.opacity = "1";
  }, [isReduced]);

  const handleMouseLeave = useCallback(() => {
    if (isReduced) return;
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    card.style.transform = card.style.transform.replace("scale(1.035) ", "").replace("scale(1.035)", "");
    card.style.boxShadow = "";
    glow.style.opacity = "0";
  }, [isReduced]);

  // Push-out-pop-in animation for arrow button on hover
  // Source: HAR animate-push-out-pop-in class on sidekick-card-btn-icon
  const handleArrowEnter = useCallback(() => {
    if (isReduced) return;
    const arrow = arrowRef.current;
    if (!arrow) return;
    arrow.style.transition = "transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 120ms ease";
    arrow.style.transform = "translateY(-120%) scale(0.6)";
    arrow.style.opacity = "0";
    setTimeout(() => {
      if (!arrow) return;
      arrow.style.transform = "translateY(120%) scale(0.6)";
      arrow.style.opacity = "0";
      setTimeout(() => {
        if (!arrow) return;
        arrow.style.transition = "transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 180ms ease";
        arrow.style.transform = "translateY(0) scale(1)";
        arrow.style.opacity = "1";
      }, 80);
    }, 130);
  }, [isReduced]);

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="challenge-card-inner relative text-left cursor-pointer"
      style={{
        background: "rgba(255, 252, 246, 0.92)",
        borderRadius: "18px",
        border: "1px solid rgba(196,130,70,0.15)",
        boxShadow:
          "0 4px 16px rgba(37,32,95,0.08), 0 1px 4px rgba(37,32,95,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
        padding: "16px 18px 14px",
        width: "220px",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "box-shadow 300ms ease, transform 300ms cubic-bezier(0.34,1.56,0.64,1)",
        willChange: "transform",
        pointerEvents: "auto",
      }}
      aria-label={`${card.title}: ${card.desc}`}
    >
      {/* Glow layer — 130% of card, blurred amber/terracotta radial gradient */}
      {/* Source: HAR sidekick-card-bg-container pattern, adapted for VAYA warm palette */}
      <div
        ref={glowRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          overflow: "hidden",
          opacity: 0,
          transition: "opacity 300ms ease-in-out",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "130%",
            height: "130%",
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(196,130,70,0.22) 0%, rgba(245,199,126,0.14) 40%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />
      </div>

      {/* Card content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Top row: icon + arrow button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          {/* Icon in peach/amber circle */}
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(245,199,126,0.35) 0%, rgba(196,130,70,0.2) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#b8621a",
              flexShrink: 0,
            }}
          >
            <CardIcon iconId={card.icon} />
          </div>

          {/* Arrow button — push-out-pop-in on hover */}
          {/* Source: HAR sidekick-card-btn + animate-push-out-pop-in */}
          <div
            onMouseEnter={handleArrowEnter}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "1.5px solid rgba(196,130,70,0.4)",
              background: "rgba(245,199,126,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <div
              ref={arrowRef}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#b8621a",
                transformOrigin: "center",
                willChange: "transform, opacity",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2 8L8 2M8 2H3M8 2v5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontSize: "15px",
            fontWeight: 500,
            color: "var(--charcoal)",
            lineHeight: 1.25,
            marginBottom: "5px",
            letterSpacing: "-0.01em",
          }}
        >
          {card.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontFamily: "var(--font-jakarta), sans-serif",
            fontSize: "11.5px",
            fontWeight: 300,
            color: "rgba(20,33,61,0.6)",
            lineHeight: 1.45,
          }}
        >
          {card.desc}
        </p>
      </div>
    </button>
  );
}
