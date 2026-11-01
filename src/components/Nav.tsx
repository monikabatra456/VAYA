// src/components/Nav.tsx
// Unified Morphing Nav with GSAP Flip:
// Links live in the top header center during HOME,
// and smoothly fly (Flip animation) into the slim left rail as user approaches Section 2.
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import gsap from "gsap";
import { Flip } from "gsap/Flip";

if (typeof window !== "undefined") gsap.registerPlugin(Flip);

export const NAV_PAGES = [
  { id: "hero",         label: "HOME",                roman: "I"   },
  { id: "challenges",   label: "THE TRAVEL STRUGGLE", roman: "II"  },
  { id: "wonder",       label: "THE WONDER WORLD",    roman: "III" },
  { id: "meet-vaya",    label: "MEET VAYA",           roman: "IV"  },
  { id: "on-its-way",   label: "ON ITS WAY",          roman: "V"   },
];

const COPPER = "#c8782a";
const NAVY   = "#14213d";

interface NavProps { onWaitlist?: () => void; }

export default function Nav({ onWaitlist }: NavProps) {
  const [onHome, setOnHome]       = useState(true);
  const [activeId, setActiveId]   = useState("hero");
  const [isReduced, setIsReduced] = useState(false);
  const [isMobile, setIsMobile]   = useState(false);
  const [mounted, setMounted]     = useState(false);

  const headerSlot = useRef<HTMLDivElement>(null);
  const railSlot   = useRef<HTMLDivElement>(null);
  const linkEls    = useRef<(HTMLButtonElement | null)[]>([]);
  const prevOnHome = useRef<boolean>(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Detect mobile + reduced motion ─────────────────────────────────────────
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 1023px)').matches);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReduced(mq.matches);
    const onMqChange = (e: MediaQueryListEvent) => setIsReduced(e.matches);
    mq.addEventListener("change", onMqChange);
    return () => {
      window.removeEventListener("resize", checkMobile);
      mq.removeEventListener("change", onMqChange);
    };
  }, []);

  // ── Scroll spy for active section ──────────────────────────────────────────
  const handleScroll = useCallback(() => {
    // At footer, keep V ON ITS WAY active
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 150) {
      setActiveId("on-its-way");
      return;
    }

    let found = "hero";
    for (const page of NAV_PAGES) {
      const el = document.getElementById(page.id);
      if (el) {
        const r = el.getBoundingClientRect();
        if (page.id === "wonder") {
          // III is highlighted from the moment the wrapper top reaches the viewport top until the wrapper bottom leaves
          if (r.top <= 10 && r.bottom >= 10) {
            found = page.id;
            break;
          }
        } else if (r.top <= window.innerHeight * 0.55 && r.bottom >= window.innerHeight * 0.12) {
          found = page.id;
          break;
        }
      }
    }
    setActiveId(found);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // ── Transition trigger: when VAYA has appeared on Hero and Section 2 is about to enter view ──
  useEffect(() => {
    if (isMobile) return;

    const s2 = document.getElementById("challenges");
    if (!s2) return;

    const checkTrigger = () => {
      const r = s2.getBoundingClientRect();
      // Section 2 enters when its top is within 96% of viewport height
      const aboutToEnter = r.top <= window.innerHeight * 0.96;
      setOnHome(!aboutToEnter);
    };

    window.addEventListener("scroll", checkTrigger, { passive: true });
    checkTrigger();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setOnHome(false);
          } else if (e.boundingClientRect.top > 0) {
            setOnHome(true);
          } else if (e.boundingClientRect.bottom < 0) {
            setOnHome(false);
          }
        }
      },
      { rootMargin: "0px 0px -4% 0px" }
    );
    io.observe(s2);

    return () => {
      window.removeEventListener("scroll", checkTrigger);
      io.disconnect();
    };
  }, [isMobile]);

  // ── GSAP Flip: Flowing morph of link elements between Header and Rail ────────
  useEffect(() => {
    const hs = headerSlot.current;
    const rs = railSlot.current;
    const links = linkEls.current.filter(Boolean) as HTMLButtonElement[];
    if (!hs || !rs || !links.length || isMobile) return;

    if (prevOnHome.current === onHome) return;
    prevOnHome.current = onHome;

    if (isReduced) {
      if (onHome) links.forEach((el) => hs.appendChild(el));
      else        links.forEach((el) => rs.appendChild(el));
      return;
    }

    // Capture state before reparenting
    const state = Flip.getState(links, {
      props: "opacity,color,fontSize,fontWeight,letterSpacing",
    });

    // Move DOM nodes between slots
    if (onHome) {
      links.forEach((el) => hs.appendChild(el));
    } else {
      links.forEach((el) => rs.appendChild(el));
    }

    // Morph with organic flowing stagger
    Flip.from(state, {
      duration: 0.85,
      ease: "power3.inOut",
      stagger: {
        each: 0.05,
        from: onHome ? "end" : "start",
      },
      absolute: true,
      onComplete: () => {
        gsap.set(links, { clearProps: "all" });
      },
    });
  }, [onHome, isMobile, isReduced, mounted]);

  // Update data-active imperatively on moved buttons
  useEffect(() => {
    const links = linkEls.current.filter(Boolean) as HTMLButtonElement[];
    links.forEach((el) => {
      const id = el.getAttribute("data-nav-id");
      const isAct = id === activeId;
      el.setAttribute("data-active", isAct ? "true" : "false");
      el.setAttribute("aria-current", isAct ? "page" : "false");
    });
  }, [activeId]);

  const scrollTo = useCallback((id: string) => {
    if (id === "hero") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  const activeIdx = Math.max(0, NAV_PAGES.findIndex((p) => p.id === activeId));
  const progressPct = (activeIdx / (NAV_PAGES.length - 1)) * 100;
  const isDark = activeId === "meet-vaya";

  return (
    <>
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <header
        aria-label="Site header"
        style={{
          position: "fixed", top: 0, left: 0, width: "100%", zIndex: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isMobile ? "12px 20px" : "14px 5vw",
          background: "transparent",
          pointerEvents: "none",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          onClick={(e) => { e.preventDefault(); scrollTo("hero"); }}
          style={{ pointerEvents: "auto", display: "block", flexShrink: 0 }}
          aria-label="VAYA home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/vaya-logo-500.webp"
            alt="VAYA"
            style={{
              height: isMobile ? "38px" : "var(--logo-h)",
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
            draggable={false}
          />
        </Link>

        {/* Center: Flip Target 1 (Header slot) */}
        {!isMobile && (
          <nav
            ref={headerSlot}
            aria-label="Header navigation"
            className="nav-header-slot"
          >
            {NAV_PAGES.map((page, i) => (
              <button
                key={page.id}
                ref={(el) => { linkEls.current[i] = el; }}
                data-nav-id={page.id}
                data-active={activeId === page.id ? "true" : "false"}
                onClick={() => scrollTo(page.id)}
                aria-current={activeId === page.id ? "page" : undefined}
                className="vaya-nav-btn"
              >
                <span className="vaya-nav-dot" aria-hidden="true" />
                <span className="vaya-nav-roman">{page.roman}</span>
                <span className="vaya-nav-label">{page.label}</span>
                <span className="vaya-nav-underline" aria-hidden="true" />
              </button>
            ))}
          </nav>
        )}

        {/* Right: Login + Join Waitlist */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "10px" : "18px", pointerEvents: "auto", flexShrink: 0 }}>
          <button
            onClick={onWaitlist}
            style={{
              height: isMobile ? "36px" : "40px",
              padding: isMobile ? "0 14px" : "0 22px",
              borderRadius: "20px", background: NAVY, color: "#fff",
              fontSize: isMobile ? "12px" : "13px",
              fontFamily: "var(--font-jakarta)", fontWeight: 500,
              letterSpacing: "0.04em", border: "none", cursor: "pointer",
              transition: "background 0.2s, transform 0.18s", whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#25205f"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = NAVY; e.currentTarget.style.transform = ""; }}
          >
            Join Waitlist
          </button>
        </div>
      </header>

      {/* ── DESKTOP: SLIM SCROLL RAIL (Flip Target 2, portal to document.body) ── */}
      {!isMobile && mounted && createPortal(
        <aside
          aria-label="Section navigation rail"
          aria-hidden={onHome}
          style={{
            position: "fixed",
            top: "50%",
            transform: "translateY(-50%)",
            left: "28px",
            zIndex: 55,
            opacity: onHome ? 0 : 1,
            pointerEvents: onHome ? "none" : "auto",
            transition: isReduced ? "opacity 0.2s" : "opacity 0.35s ease",
            background: "transparent",
            boxShadow: "none",
            border: "none",
            padding: 0,
          }}
        >
          <div style={{ position: "relative" }}>
            {/* 1px Vertical Track Line */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "4px",
                bottom: "4px",
                left: "3.5px",
                width: "1px",
                background: isDark ? "rgba(255,255,255,0.25)" : "rgba(20,33,61,0.15)",
                zIndex: 0,
              }}
            >
              {/* Active Section Progress Fill */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "1px",
                  height: `${progressPct}%`,
                  background: isDark ? "#f2b84b" : COPPER,
                  transition: isReduced ? "none" : "height 0.35s cubic-bezier(0.25, 1, 0.5, 1)",
                }}
              />
            </div>

            {/* Flip Target 2 (Rail Slot) */}
            <div
              ref={railSlot}
              className="nav-rail-slot"
              data-theme={isDark ? "dark" : "light"}
            />
          </div>
        </aside>,
        document.body
      )}



      {/* ── MOBILE: 5 small 6px dots on right edge ─────────────────────────── */}
      {isMobile && !onHome && (
        <div
          aria-label="Section navigation"
          style={{
            position: "fixed",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "9px",
            padding: "8px 4px",
            pointerEvents: "auto",
          }}
        >
          {NAV_PAGES.map((page) => {
            const isAct = activeId === page.id;
            return (
              <button
                key={page.id}
                onClick={() => scrollTo(page.id)}
                aria-label={page.label}
                aria-current={isAct ? "page" : undefined}
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: isAct ? COPPER : "rgba(20,33,61,0.25)",
                  boxShadow: isAct ? `0 0 0 2px rgba(200,120,42,0.3)` : "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.25s ease",
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
