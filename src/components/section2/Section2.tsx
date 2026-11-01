// src/components/section2/Section2.tsx
// ONE-SCREEN layout: height 100svh, overflow hidden — fits exactly at 1366x768, 1440x900, 1920x1080.
// Scattered floating cards layout with dynamic SVG flight path connecting outer card edges.
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import FlightPath, { type FlightPathRef } from "./FlightPath";
import ProblemCard  from "./ProblemCard";
import ProblemPopup from "./ProblemPopup";
import GhostBlocks  from "./GhostBlocks";
import {
  PROBLEMS,
  CARD_LAYOUT,
  LAYER_CONFIG,
  PROBLEM_SEQUENCE,
  DEFAULT_ACTIVE_ID,
  PROBLEM_WEBP_MAP,
  type Problem,
} from "./data/problems";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// ── Topo background ───────────────────────────────────────────────────────────
function TopoBg() {
  return (
    <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.035, pointerEvents: "none", zIndex: 0 }}>
      <defs>
        <pattern id="topo-s2" width="220" height="220" patternUnits="userSpaceOnUse">
          {[20, 50, 85, 120, 155, 185].map((r, i) => (
            <ellipse key={i} cx="110" cy="110" rx={r} ry={r * 0.65} fill="none" stroke="#8B6914" strokeWidth="0.8" />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#topo-s2)" />
    </svg>
  );
}

// ── Mobile dots indicator ─────────────────────────────────────────────────────
function MobileDots({ total, active }: { total: number; active: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, paddingTop: 12 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{
          display: "block", borderRadius: "50%",
          width: i === active ? 8 : 5, height: i === active ? 8 : 5,
          background: i === active ? "#C4782A" : "rgba(20,33,61,0.22)",
          transition: "all 0.3s ease",
        }} />
      ))}
    </div>
  );
}

// ── Left Column Heading ───────────────────────────────────────────────────────
function SectionHeading() {
  return (
    <div>
      {/* Eyebrow */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: "clamp(8px,1.2vh,14px)" }}>
        <span style={{ display: "block", width: 22, height: 1.5, background: "#C4782A", borderRadius: 1 }} aria-hidden="true" />
        <span style={{ fontFamily: "var(--font-jakarta)", fontSize: "clamp(10px,1.1vh,12px)", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C4782A" }}>
          THE TRAVEL CHALLENGES
        </span>
      </div>

      {/* Headline */}
      <h2
        id="s2-heading"
        style={{
          fontFamily: "var(--font-outfit)",
          fontSize: "clamp(38px, 6.5vh, 68px)",
          fontWeight: 700, lineHeight: 1.05,
          letterSpacing: "-0.03em", color: "#14213d",
          marginBottom: "clamp(10px, 1.4vh, 18px)",
        }}
      >
        Why travellers<br />need{" "}
        <span style={{ position: "relative", display: "inline-block" }}>
          <span style={{ fontFamily: "var(--font-caveat)", fontStyle: "italic", fontWeight: 500, fontSize: "1.14em", color: "#C4782A", display: "inline-block", verticalAlign: "baseline" }}>
            VAYA
          </span>
          <svg aria-hidden="true" viewBox="0 0 115 18" fill="none"
            style={{ position: "absolute", bottom: "-6px", left: "-3px", width: "116%", height: "auto" }}>
            <path d="M4 12 C24 7,52 3,82 6 C98 8,111 11,109 14" stroke="#C4782A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
            <path d="M6 14 C30 11,66 9,92 12" stroke="#C4782A" strokeWidth="1.6" strokeLinecap="round" opacity="0.38" />
          </svg>
        </span>
      </h2>

      {/* Body */}
      <div style={{ marginTop: "14px", marginBottom: "clamp(12px, 1.8vh, 20px)", maxWidth: "360px" }}>
        <p style={{
          fontFamily: "var(--font-jakarta)",
          fontSize: "clamp(15px, 1.05vw, 17px)",
          fontWeight: 450,
          color: "#24334f",
          lineHeight: 1.6,
          marginBottom: "12px",
          letterSpacing: "-0.01em",
        }}>
          Travel is exciting, but it comes with real challenges — from overcrowded destinations to high prices, finding guides, and unexpected situations.
        </p>
        <p style={{
          fontFamily: "var(--font-jakarta)",
          fontSize: "clamp(15px, 1.05vw, 17px)",
          fontWeight: 450,
          color: "#24334f",
          lineHeight: 1.6,
          letterSpacing: "-0.01em",
        }}>
          VAYA brings everything you need to plan smarter, travel safer and make every moment count.
        </p>
      </div>

      {/* Caveat lines */}
      <div>
        <span style={{ fontFamily: "var(--font-caveat)", fontSize: "clamp(20px, 3vh, 32px)", fontWeight: 500, color: "#C4782A", lineHeight: 1.22, display: "block" }}>Less stress.</span>
        <span style={{ fontFamily: "var(--font-caveat)", fontSize: "clamp(20px, 3vh, 32px)", fontWeight: 500, color: "#C4782A", lineHeight: 1.22, display: "block" }}>More moments.</span>
        <svg viewBox="0 0 180 10" style={{ width: "clamp(120px, 13vw, 175px)", marginTop: 2 }}>
          <path d="M4 6 C40 2,100 1,160 4 C168 4.5,174 6,172 8" stroke="#C4782A" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.75" />
        </svg>
      </div>
    </div>
  );
}

// ── Section 2 Main Component ──────────────────────────────────────────────────
export default function Section2() {
  const [activeId, setActiveId]         = useState<string>(DEFAULT_ACTIVE_ID || "overcrowding");
  const [popupProblem, setPopupProblem] = useState<Problem | null>(null);
  const [popupSourceRect, setPopupSourceRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile]         = useState(false);
  const [isReduced, setIsReduced]       = useState(false);
  const [mobileActiveIdx, setMobileActiveIdx] = useState(0);
  const [cardNodes, setCardNodes]       = useState<{ id: string; x: number; y: number }[]>([]);
  const [mouseParallax, setMouseParallax] = useState({ x: 0, y: 0 });

  const sectionRef          = useRef<HTMLElement>(null);
  const cardsContRef        = useRef<HTMLDivElement>(null);
  const mobileScrollRef     = useRef<HTMLDivElement>(null);
  const cardRefs            = useRef<Map<string, HTMLDivElement>>(new Map());
  const flightRef           = useRef<FlightPathRef>(null);
  const preloadedRef        = useRef<Set<string>>(new Set());

  // ── Detect mobile / reduced motion ─────────────────────────────────────────
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 1023px)').matches);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReduced(mq.matches);
    mq.addEventListener("change", (e) => setIsReduced(e.matches));
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ── Calculate dynamic card border connection nodes for flight path ─────────
  const updateNodes = useCallback(() => {
    const cont = cardsContRef.current;
    if (!cont) return;
    const contRect = cont.getBoundingClientRect();
    if (contRect.width === 0 || contRect.height === 0) return;

    const orderedSequence = [
      { id: "overcrowding", edge: "right" },
      { id: "local-guides", edge: "left" },
      { id: "changing-plans", edge: "right" },
      { id: "prices", edge: "left" },
      { id: "safety", edge: "right" },
      { id: "planning", edge: "left" },
    ];

    const nodes: { id: string; x: number; y: number }[] = [];
    for (const item of orderedSequence) {
      const el = cardRefs.current.get(item.id);
      if (el) {
        const r = el.getBoundingClientRect();
        // Position node clearly outside the card's scaled border edge
        const x = item.edge === "right"
          ? r.right - contRect.left + 16
          : r.left - contRect.left - 16;
        const y = r.top + r.height / 2 - contRect.top;
        nodes.push({ id: item.id, x, y });
      } else {
        const l = CARD_LAYOUT[item.id];
        const approxW = 320;
        const approxH = 88;
        const cardLeft = (l.leftPct / 100) * contRect.width;
        const cardTop = (l.topPct / 100) * contRect.height;
        const x = item.edge === "right" ? cardLeft + approxW + 16 : cardLeft - 16;
        const y = cardTop + approxH / 2;
        nodes.push({ id: item.id, x, y });
      }
    }

    setCardNodes(nodes);
  }, []);

  useEffect(() => {
    updateNodes();
    const t1 = setTimeout(updateNodes, 120);
    const t2 = setTimeout(updateNodes, 600);
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(updateNodes);
    }
    window.addEventListener("resize", updateNodes);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", updateNodes);
    };
  }, [updateNodes]);

  // ── Hover & focus handlers (Hover-driven only — NO auto-cycling) ───────────
  const handleCardHover = useCallback((id: string) => {
    setActiveId(id);

    // Preload only this card's animated webp on hover
    if (!preloadedRef.current.has(id)) {
      preloadedRef.current.add(id);
      const src = PROBLEM_WEBP_MAP[id];
      if (src && typeof window !== "undefined") {
        const img = new Image();
        img.src = src;
      }
    }
  }, []);

  const handleCardLeave = useCallback(() => {
    // Keep focus on the last hovered card (no auto-cycling away)
  }, []);

  // ── Subtle Mouse Parallax over canvas ──────────────────────────────────────
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isReduced) return;
    const cont = cardsContRef.current;
    if (!cont) return;
    const r = cont.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    setMouseParallax({
      x: Math.max(-1, Math.min(1, nx)),
      y: Math.max(-1, Math.min(1, ny)),
    });
  }, [isReduced]);

  // ── Click handler with flight-time coordination (max ~700ms) ───────────────
  const handleCardClick = useCallback((id: string, rect: DOMRect) => {
    const p = PROBLEMS.find((x) => x.id === id);
    if (!p) return;
    setActiveId(id);

    const isFlying = flightRef.current?.isFlying?.();
    if (isFlying) {
      setTimeout(() => {
        setPopupProblem(p);
        setPopupSourceRect(rect);
      }, 450);
    } else {
      setPopupProblem(p);
      setPopupSourceRect(rect);
    }
  }, []);

  const closePopup = useCallback(() => {
    setPopupProblem(null);
    setPopupSourceRect(null);
  }, []);

  const getLatestRect = useCallback(() => {
    if (!popupProblem) return null;
    return cardRefs.current.get(popupProblem.id)?.getBoundingClientRect() ?? null;
  }, [popupProblem]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === cardsContRef.current) {
      if (popupProblem) closePopup();
    }
  }, [popupProblem, closePopup]);

  return (
    <section
      ref={sectionRef}
      id="challenges"
      aria-labelledby="s2-heading"
      style={{
        position: "relative",
        height: "100svh",
        minHeight: 0,
        overflow: "hidden",
        background: "#F6F1E7",
      }}
    >
      <TopoBg />

      {isMobile ? (
        /* ─────────── MOBILE: swipe carousel ─────────── */
        <div style={{ position: "relative", zIndex: 1, height: "100%", overflowY: "auto", paddingTop: "72px", paddingBottom: "80px" }}>
          <div style={{ padding: "0 20px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ width: 18, height: 1.5, background: "#C4782A", borderRadius: 1, display: "block" }} />
              <span style={{ fontFamily: "var(--font-jakarta)", fontSize: "10px", fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C4782A" }}>THE TRAVEL CHALLENGES</span>
            </div>
            <h2 id="s2-heading" style={{ fontFamily: "var(--font-outfit)", fontSize: "clamp(30px,8vw,46px)", fontWeight: 700, lineHeight: 1.06, letterSpacing: "-0.03em", color: "#14213d", marginBottom: 10 }}>
              Why travellers<br />need <span style={{ fontFamily: "var(--font-caveat)", fontStyle: "italic", color: "#C4782A" }}>VAYA</span>
            </h2>
            <p style={{ fontFamily: "var(--font-jakarta)", fontSize: "13px", fontWeight: 300, color: "rgba(20,33,61,0.66)", lineHeight: 1.65 }}>
              Plan smarter, travel safer and make every moment count.
            </p>
          </div>

          {/* Mobile swipe carousel */}
          <div
            ref={mobileScrollRef}
            id="challenges-mobile"
            style={{ overflowX: "auto", scrollSnapType: "x mandatory", display: "flex", paddingLeft: "20px", paddingRight: "20px", paddingBottom: "12px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            {PROBLEMS.map((problem) => (
              <div key={problem.id} style={{ scrollSnapAlign: "center", flex: "0 0 82vw", maxWidth: "320px", marginRight: "12px" }}>
                <ProblemCard
                  problem={problem}
                  isActive={problem.id === activeId}
                  isReduced={isReduced}
                  layerScale={1}
                  layerOpacity={1}
                  layerBlur={0}
                  onActivate={handleCardHover}
                  onDeactivate={handleCardLeave}
                  onClick={handleCardClick}
                  style={{ position: "relative", width: "100%", left: 0, top: 0 }}
                />
              </div>
            ))}
          </div>
          <MobileDots total={PROBLEMS.length} active={mobileActiveIdx} />
        </div>
      ) : (
        /* ─────────── DESKTOP: scattered floating cards layout ─────────── */
        <div style={{ position: "absolute", inset: 0, zIndex: 3 }}>
          {/* ── Left column: heading text ── */}
          <div
            className="s2-heading-col"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "clamp(500px, 36vw, 560px)",
              maxWidth: "570px",
              paddingLeft: "clamp(195px, 14vw, 225px)",
              paddingRight: "clamp(16px, 2vw, 24px)",
              paddingTop: "clamp(48px, 7vh, 80px)",
              paddingBottom: "clamp(120px, 26vh, 220px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              zIndex: 10,
              pointerEvents: "auto",
            }}
          >
            <SectionHeading />
          </div>

          {/* ── Right relative stage container (~60% of section) ── */}
          <div
            ref={cardsContRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCardLeave}
            style={{
              position: "absolute",
              left: "clamp(520px, 39vw, 620px)",
              right: "clamp(24px, 3vw, 48px)",
              top: "clamp(40px, 7vh, 64px)",
              bottom: "clamp(160px, 24vh, 240px)",
              overflow: "visible",
              zIndex: 5,
            }}
          >
            {/* ── Ghost Blocks Decorative Layer (Shopify Editions depth feel) ── */}
            <GhostBlocks
              isCardActive={!!activeId}
              isReduced={isReduced}
              isMobile={isMobile}
            />

            {/* ── SVG Dotted Flight Path & Amber Paper Plane ── */}
            <FlightPath
              ref={flightRef}
              activeId={activeId}
              nodes={cardNodes}
              isReduced={isReduced}
            />

            {/* ── 6 Floating Cards with 3 Depth Layers ── */}
            {PROBLEMS.map((problem, idx) => {
              const layout = CARD_LAYOUT[problem.id];
              const layerConf = LAYER_CONFIG[layout.layer] || LAYER_CONFIG[1];
              const isActive = problem.id === activeId;
              const isInPopup = popupProblem?.id === problem.id;

              // Parallax depth multiplier: near (layer 2) moves more than far (layer 0)
              const parallaxMultiplier = layout.layer === 2 ? 14 : layout.layer === 1 ? 9 : 5;
              const px = mouseParallax.x * parallaxMultiplier;
              const py = mouseParallax.y * parallaxMultiplier;

              // Float animation delay & phase
              const floatDur = 6.0 + (idx % 3) * 1.2;
              const floatDelay = idx * 0.45;

              return (
                <ProblemCard
                  key={problem.id}
                  problem={problem}
                  isActive={isActive}
                  isReduced={isReduced}
                  layerScale={isActive ? 1.04 : layerConf.scale}
                  layerOpacity={isInPopup ? 0 : isActive ? 1.0 : layerConf.opacity}
                  layerBlur={isActive ? 0 : layerConf.blur}
                  zIndex={isActive ? 50 : layerConf.zIndex}
                  onActivate={handleCardHover}
                  onDeactivate={handleCardLeave}
                  onClick={handleCardClick}
                  innerRef={(el) => {
                    if (el) cardRefs.current.set(problem.id, el);
                    else cardRefs.current.delete(problem.id);
                  }}
                  style={{
                    left: `${layout.leftPct}%`,
                    top: `${layout.topPct}%`,
                    visibility: isInPopup ? "hidden" : "visible",
                    translate: `${px}px ${py}px`,
                    animation: isReduced ? "none" : `cardBreathFloat ${floatDur}s ease-in-out ${floatDelay}s infinite alternate`,
                    willChange: "transform, filter, opacity",
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Card Popup ── */}
      {popupProblem && popupSourceRect && (
        <ProblemPopup
          problem={popupProblem}
          sourceRect={popupSourceRect}
          getLatestRect={getLatestRect}
          isReduced={isReduced}
          onClose={closePopup}
        />
      )}

      {/* ── Bottom scene: clean transparent WebP with bottom fade ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          width: "100%",
          zIndex: 1,
          pointerEvents: "none",
          lineHeight: 0,
          maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
        }}
      >
        <picture>
          <source media="(max-width: 768px)" srcSet="/images/vaya-bottom-scene-mobile.webp" type="image/webp" />
          <source srcSet="/images/vaya-bottom-scene.webp" type="image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/vaya-bottom-scene.webp"
            alt=""
            width={2400}
            height={386}
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              maxHeight: "clamp(180px, 28vh, 320px)",
              objectFit: "cover",
              objectPosition: "center bottom",
              imageRendering: "auto",
            }}
            draggable={false}
          />
        </picture>
      </div>

      {/* ── Seamless transition into Section 3 cream (#F6F1E7) matching Section I->II in IMG-BLEND ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "clamp(120px, 16vh, 180px)",
          pointerEvents: "none",
          zIndex: 2,
          background: `linear-gradient(
            to bottom,
            rgba(246, 241, 231, 0) 0%,
            rgba(246, 241, 231, 0.35) 45%,
            rgba(246, 241, 231, 0.85) 80%,
            #F6F1E7 100%
          )`,
        }}
      />
    </section>
  );
}
