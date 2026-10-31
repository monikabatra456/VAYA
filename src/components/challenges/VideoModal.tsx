// src/components/challenges/VideoModal.tsx
// Modal with 16:9 video — opens from card bounding rect using GSAP Flip pattern
// Close: X button, ESC key, backdrop click
// Accessibility: role="dialog", aria-modal, focus trap, body scroll lock
"use client";

import React, { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import type { ChallengeCard } from "./challengesData";

interface VideoModalProps {
  card: ChallengeCard;
  sourceRect: DOMRect | null; // card bounding rect for morph origin
  onClose: () => void;
  isReduced: boolean;
}

export default function VideoModal({ card, sourceRect, onClose, isReduced }: VideoModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const hasVideoRef = useRef(false);

  // Check if video file exists (try to load, fallback on error)
  const handleVideoError = useCallback(() => {
    hasVideoRef.current = false;
    if (videoRef.current) videoRef.current.style.display = "none";
    const fallback = modalRef.current?.querySelector(".video-fallback") as HTMLElement;
    if (fallback) fallback.style.display = "flex";
  }, []);

  // Entry animation: scale from card rect → center (GSAP Flip-style using manual bounding rect)
  useEffect(() => {
    const backdrop = backdropRef.current;
    const modal = modalRef.current;
    if (!backdrop || !modal) return;

    // Body scroll lock
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus close button on open
    setTimeout(() => closeRef.current?.focus(), 50);

    if (isReduced) {
      // Just fade in, no morph
      gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" });
      gsap.fromTo(modal, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" });
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }

    // Compute start transform from sourceRect → modal center
    if (sourceRect) {
      const modalRect = modal.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Modal center
      const mCX = vw / 2;
      const mCY = vh / 2;

      // Card center
      const cCX = sourceRect.left + sourceRect.width / 2;
      const cCY = sourceRect.top + sourceRect.height / 2;

      const scaleX = sourceRect.width / modalRect.width;
      const scaleY = sourceRect.height / modalRect.height;
      const startScale = Math.min(scaleX, scaleY) * 0.8;
      const startX = cCX - mCX;
      const startY = cCY - mCY;

      gsap.fromTo(
        backdrop,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" }
      );
      gsap.fromTo(
        modal,
        {
          opacity: 0,
          scale: startScale,
          x: startX,
          y: startY,
        },
        {
          opacity: 1,
          scale: 1,
          x: 0,
          y: 0,
          duration: 0.55,
          ease: "cubic-bezier(0.34, 1.56, 0.64, 1)", // Source: HAR spring easing
          clearProps: "scale,x,y",
        }
      );
    } else {
      gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
      gsap.fromTo(
        modal,
        { opacity: 0, scale: 0.85, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "cubic-bezier(0.34, 1.56, 0.64, 1)" }
      );
    }

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isReduced, sourceRect]);

  // Close animation: reverse morph back to card
  const handleClose = useCallback(() => {
    const backdrop = backdropRef.current;
    const modal = modalRef.current;
    if (!backdrop || !modal) { onClose(); return; }

    if (isReduced) {
      gsap.to(backdrop, { opacity: 0, duration: 0.2, ease: "power2.in" });
      gsap.to(modal, { opacity: 0, scale: 0.95, duration: 0.22, ease: "power2.in", onComplete: onClose });
      return;
    }

    if (sourceRect) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const modalRect = modal.getBoundingClientRect();
      const mCX = vw / 2;
      const mCY = vh / 2;
      const cCX = sourceRect.left + sourceRect.width / 2;
      const cCY = sourceRect.top + sourceRect.height / 2;
      const scaleX = sourceRect.width / modalRect.width;
      const scaleY = sourceRect.height / modalRect.height;
      const endScale = Math.min(scaleX, scaleY) * 0.8;
      const endX = cCX - mCX;
      const endY = cCY - mCY;

      gsap.to(backdrop, { opacity: 0, duration: 0.3, ease: "power2.in" });
      gsap.to(modal, {
        scale: endScale,
        x: endX,
        y: endY,
        opacity: 0,
        duration: 0.38,
        ease: "power2.inOut",
        onComplete: onClose,
      });
    } else {
      gsap.to(backdrop, { opacity: 0, duration: 0.25, ease: "power2.in" });
      gsap.to(modal, { opacity: 0, scale: 0.9, y: 10, duration: 0.28, ease: "power2.in", onComplete: onClose });
    }
  }, [isReduced, onClose, sourceRect]);

  // ESC key handler + focus trap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      // Focus trap
      if (e.key === "Tab") {
        const modal = modalRef.current;
        if (!modal) return;
        const focusable = Array.from(
          modal.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(18, 24, 40, 0.78)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          zIndex: 1000,
          cursor: "default",
        }}
        aria-hidden="true"
      />

      {/* Modal: 9:16 vertical phone aspect ratio */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${card.title} video`}
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1001,
          width: "min(88vw, 360px)",
          borderRadius: "22px",
          overflow: "hidden",
          background: "transparent",
          boxShadow:
            "0 30px 80px rgba(18,24,40,0.45), 0 0 0 1px rgba(255,255,255,0.2)",
          willChange: "transform",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeRef}
          onClick={handleClose}
          aria-label="Close video"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            zIndex: 10,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(20,33,61,0.85)",
            border: "none",
            color: "rgba(255,252,246,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 200ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(196,130,70,0.9)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(20,33,61,0.85)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* 9:16 vertical media container */}
        <div style={{ position: "relative", width: "100%", paddingBottom: "177.78%", background: "transparent" }}>
          {card.video.endsWith('.webp') || card.video.endsWith('.gif') || card.video.endsWith('.png') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.video}
              alt={card.title}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "22px",
                background: "transparent",
              }}
              draggable={false}
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              onError={handleVideoError}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "22px",
                background: "transparent",
              }}
            >
              <source src={card.video} type="video/mp4" />
            </video>
          )}

          {/* Poster/fallback overlay (shown when video fails) */}
          <div
            className="video-fallback"
            style={{
              position: "absolute",
              inset: 0,
              display: "none",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, rgba(245,199,126,0.15) 0%, rgba(196,130,70,0.08) 100%)",
            }}
          >
            {/* Play icon */}
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "rgba(196,130,70,0.18)",
                border: "2px solid rgba(196,130,70,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(196,130,70,0.9)">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
            <p
              style={{
                fontFamily: "var(--font-jakarta), sans-serif",
                fontSize: "13px",
                color: "rgba(20,33,61,0.5)",
                textAlign: "center",
              }}
            >
              Video coming soon
            </p>
          </div>
        </div>

        {/* Caption row */}
        <div
          style={{
            padding: "16px 24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontSize: "18px",
              fontWeight: 500,
              color: "var(--charcoal)",
              letterSpacing: "-0.02em",
            }}
          >
            {card.title}
          </h3>
          <p
            style={{
              fontFamily: "var(--font-jakarta), sans-serif",
              fontSize: "13px",
              fontWeight: 300,
              color: "rgba(20,33,61,0.55)",
            }}
          >
            {card.desc}
          </p>
        </div>
      </div>
    </>
  );
}
