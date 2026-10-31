// src/components/section2/ProblemPopup.tsx
// Card-anchored animated WebP / Video popup (FLIP animation from clicked card rect)
// - Opens directly from clicked card's bounding rect and expands around card center
// - Dark frosted glass panel: background rgba(30,42,65,0.72), border 1px solid rgba(255,255,255,0.20)
// - Floating phone mockup:
//     - Tightly cropped to phone body with border-radius (28px) and overflow: hidden
//     - Outer soft drop-shadow (filter: drop-shadow) following phone outline
//     - Video with Safari HEVC mov, WebM vp9, and MP4 sources, poster transparent PNG
//     - Responds to prefers-reduced-motion (poster only)
//     - Resets to frame 0 on open, pauses on close
//     - Max-height ~45% of modal, aspect-ratio preserved (no layout shift)
"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import {
  PROBLEM_MEDIA_MAP,
  PROBLEM_WEBP_MAP,
  type Problem,
  type ProblemMedia,
} from "./data/problems";

interface ProblemPopupProps {
  problem: Problem;
  sourceRect?: DOMRect | null;
  getLatestRect?: () => DOMRect | null;
  isReduced: boolean;
  onClose: () => void;
}

export default function ProblemPopup({
  problem,
  sourceRect,
  getLatestRect,
  isReduced,
  onClose,
}: ProblemPopupProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closingRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Resolve media metadata
  const media: ProblemMedia = PROBLEM_MEDIA_MAP[problem.id] || {
    webp: PROBLEM_WEBP_MAP[problem.id] || problem.videoSrc,
    poster: `/assets/challenges/${problem.id}-poster.png`,
    cropPhone: false,
  };

  const hasVideo = Boolean(media.mp4 || media.webm || media.mov);

  // ── Detect mobile ──────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Lock body scroll & stop Lenis while popup is active ────────────────────
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).lenis?.stop?.();

    return () => {
      document.body.style.overflow = prevOverflow;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).lenis?.start?.();
    };
  }, []);

  // ── Video Lifecycle: restart from 0 on open, pause on close / reduced motion ──
  useEffect(() => {
    if (isReduced) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      return;
    }

    const v = videoRef.current;
    if (v) {
      try {
        v.currentTime = 0;
        const playPromise = v.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("[VAYA] Video autoplay prevented:", err);
          });
        }
      } catch {
        // Ignore
      }
    }

    return () => {
      if (v) {
        v.pause();
      }
    };
  }, [isReduced, problem.id]);

  // ── Calculate Target Bounds (anchored to clicked card's position) ───────────
  const getTargetBounds = useCallback(() => {
    if (typeof window === "undefined") {
      return { top: 60, left: 60, width: 370, height: 700 };
    }

    const margin = 20;
    const isMobileView = window.innerWidth < 768;

    const targetW = isMobileView
      ? Math.min(390, window.innerWidth - 32)
      : Math.min(420, Math.max(360, window.innerWidth * 0.25));

    const maxH = window.innerHeight - margin * 2;
    const targetH = Math.min(maxH, isMobileView ? 620 : 720);

    // Anchor popup right around the clicked card's position on desktop!
    if (sourceRect && !isMobileView) {
      const cx = sourceRect.left + sourceRect.width / 2;
      const cy = sourceRect.top + sourceRect.height / 2;

      let left = Math.round(cx - targetW / 2);
      let top = Math.round(cy - targetH / 2);

      // Clamp within safe viewport bounds so modal is never clipped off-screen
      left = Math.max(margin, Math.min(window.innerWidth - targetW - margin, left));
      top = Math.max(margin, Math.min(window.innerHeight - targetH - margin, top));

      return { top, left, width: targetW, height: targetH };
    }

    return {
      top: Math.max(margin, Math.round((window.innerHeight - targetH) / 2)),
      left: Math.max(margin, Math.round((window.innerWidth - targetW) / 2)),
      width: targetW,
      height: targetH,
    };
  }, [sourceRect]);

  // ── Entrance Animation ─────────────────────────────────────────────────────
  useEffect(() => {
    const panel = panelRef.current;
    const overlay = overlayRef.current;
    if (!panel) return;

    const target = getTargetBounds();

    if (!isReduced) {
      if (overlay) {
        gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
      }

      // FLIP expand from clicked card rect (~450ms)
      const start = sourceRect || target;
      gsap.fromTo(
        panel,
        {
          top: start.top,
          left: start.left,
          width: start.width,
          height: start.height,
          opacity: 0,
          scale: 0.88,
        },
        {
          top: target.top,
          left: target.left,
          width: target.width,
          height: target.height,
          opacity: 1,
          scale: 1,
          duration: 0.45,
          ease: "cubic-bezier(0.22, 1, 0.36, 1)",
        }
      );
    } else {
      gsap.set(panel, {
        top: target.top,
        left: target.left,
        width: target.width,
        height: target.height,
        scale: 1,
      });
      gsap.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      if (overlay) {
        gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Close Animation (Shrinks back to Card Rect & pauses video) ──────────────
  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    // Pause video immediately
    if (videoRef.current) {
      videoRef.current.pause();
    }

    document.body.style.overflow = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).lenis?.start?.();

    const panel = panelRef.current;
    const overlay = overlayRef.current;
    if (!panel || isReduced) {
      onClose();
      return;
    }

    if (overlay) {
      gsap.to(overlay, { opacity: 0, duration: 0.35, ease: "power2.in" });
    }

    // Reverse FLIP shrink back into card position
    const currentRect = getLatestRect?.() || sourceRect || getTargetBounds();
    gsap.to(panel, {
      top: currentRect.top,
      left: currentRect.left,
      width: currentRect.width,
      height: currentRect.height,
      opacity: 0,
      scale: 0.88,
      duration: 0.38,
      ease: "cubic-bezier(0.22, 1, 0.36, 1)",
      onComplete: onClose,
    });
  }, [isReduced, onClose, getLatestRect, sourceRect, getTargetBounds]);

  // ── ESC key closes popup ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        pointerEvents: "auto",
        background: "rgba(10, 15, 25, 0.16)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      {/* ── Frosted Dark Glass Panel: compact Shopify Editions sidekick size ── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${problem.title} Preview`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          (panelRef.current as any)._touchStartY = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          const startY = (panelRef.current as any)._touchStartY;
          if (startY === undefined) return;
          const endY = e.changedTouches[0].clientY;
          if (endY - startY > 60) {
            handleClose();
          }
        }}
        style={{
          position: "fixed",
          top: sourceRect?.top ?? 60,
          left: sourceRect?.left ?? 60,
          width: sourceRect?.width ?? 420,
          height: sourceRect?.height ?? 720,
          borderRadius: isMobile ? "24px" : "30px",
          padding: isMobile ? "10px 12px" : "12px 14px",
          background: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.30)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.40)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        {/* Swipe down pull bar on mobile */}
        {isMobile && (
          <div
            style={{
              width: "36px",
              height: "4px",
              borderRadius: "2px",
              background: "rgba(255, 255, 255, 0.35)",
              marginBottom: "12px",
              flexShrink: 0,
            }}
          />
        )}
        {/* ── Top Header Row inside Panel: Close X on left, White Pill Chip on right ── */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
            zIndex: 10,
            flexShrink: 0,
            marginBottom: "8px",
          }}
        >
          {/* Close (X): 36px solid dark navy circle (#1A2744), white X */}
          <button
            onClick={handleClose}
            aria-label="Close popup"
            style={{
              width: isMobile ? "44px" : "36px",
              height: isMobile ? "44px" : "36px",
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(20, 33, 61, 0.70)",
              border: "1px solid rgba(255, 255, 255, 0.28)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "#FFFFFF",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(10, 15, 35, 0.25)",
              transition: "transform 0.2s ease, background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.08)";
              e.currentTarget.style.background = "#24365d";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.background = "rgba(20, 33, 61, 0.70)";
            }}
          >
            <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {/* Chip (card name): white pill (#FFFFFF), radius 999, padding 6px 14px */}
          <div
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              background: "#FFFFFF",
              boxShadow: "0 4px 14px rgba(10, 15, 35, 0.18)",
              color: "#1A2744",
              fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
              fontSize: isMobile ? "13px" : "14px",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              display: "inline-flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            {problem.title}
          </div>
        </div>

        {/* ── Middle: Floating Phone Mockup (covers the popup tab) ── */}
        <div
          style={{
            flex: 1,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 5,
            minHeight: 0,
            margin: 0,
            background: "transparent",
            border: "none",
          }}
        >
          {/* Outer Phone Wrapper: soft drop-shadow following phone outline */}
          <div
            style={{
              position: "relative",
              height: "100%",
              maxHeight: "100%",
              width: "auto",
              aspectRatio: "9 / 16",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              filter: "drop-shadow(0 20px 45px rgba(0, 0, 0, 0.50))",
              background: "transparent",
              border: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {/* Inner Phone Crop Box: rounded corners (24px) with overflow hidden */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: isMobile ? "20px" : "26px",
                overflow: "hidden",
                background: "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isReduced ? (
                // ── Respect prefers-reduced-motion by showing poster only ──
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media.poster}
                  alt={problem.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              ) : hasVideo ? (
                // ── Video: transparent/letterboxed or tightly cropped to phone mockup ──
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={media.poster}
                  style={{
                    width: media.cropPhone ? "159.3%" : "100%",
                    height: media.cropPhone ? "150%" : "100%",
                    maxWidth: "none",
                    maxHeight: "none",
                    objectFit: media.cropPhone ? "cover" : "contain",
                    pointerEvents: "none",
                    border: "none",
                    background: "transparent",
                  }}
                >
                  {media.mov && <source src={media.mov} type='video/quicktime; codecs="hvc1"' />}
                  {media.webm && <source src={media.webm} type='video/webm; codecs="vp9"' />}
                  {media.mp4 && <source src={media.mp4} type="video/mp4" />}
                </video>
              ) : media.webp && !imgError ? (
                // ── Animated WebP with transparent background ──
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media.webp}
                  alt={problem.title}
                  onError={() => {
                    console.warn(`[VAYA] Missing webp for card: ${problem.id}`);
                    setImgError(true);
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                    pointerEvents: "none",
                  }}
                  draggable={false}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontFamily: "var(--font-jakarta)",
                    fontSize: "13px",
                    padding: "20px",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "24px", marginBottom: "6px" }}>⚠️</span>
                  <span>Preview unavailable for {problem.title}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom: Frosted semi-transparent dark box Caption (12px gap from video) ── */}
        {problem.helpText && (
          <div
            style={{
              width: "100%",
              background: "rgba(18, 28, 46, 0.65)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderRadius: "16px",
              padding: isMobile ? "8px 12px" : "10px 14px",
              boxShadow: "0 8px 24px rgba(10, 15, 35, 0.35)",
              position: "relative",
              zIndex: 10,
              flexShrink: 0,
              marginTop: "12px", // gap video -> caption 12px
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
              <span style={{ fontSize: "11px", color: "#F2B15C" }}>✨</span>
              <span
                style={{
                  fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#F2B15C",
                }}
              >
                HOW VAYA HELPS YOU
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? "12.5px" : "13.5px",
                fontWeight: 400,
                lineHeight: 1.4,
                color: "#FFFFFF",
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {problem.helpText}
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
