// src/components/Nav.tsx
// Unified Morphing Nav with GSAP Flip:
// Desktop (>=1024px): Links live in the top header center during HOME,
// and smoothly fly (Flip animation) into the slim left rail as user approaches Section 2.
// Mobile/Tablet (<1024px): Small logo left, Join Waitlist pill + 44px hamburger opening
// full-screen sheet with the 5 section links. Right edge slim vertical dot indicator with 1.2s chip.
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import gsap from "gsap";
import { Flip } from "gsap/Flip";

if (typeof window !== "undefined") gsap.registerPlugin(Flip);

export const NAV_PAGES = [
  { id: "hero",         label: "Home",                roman: "I"   },
  { id: "challenges",   label: "The Travel Struggle", roman: "II"  },
  { id: "wonder",       label: "The Wonder World",    roman: "III" },
  { id: "meet-vaya",    label: "Meet Vaya",           roman: "IV"  },
  { id: "on-its-way",   label: "On Its Way",          roman: "V"   },
];

const COPPER = "#c8782a";
const NAVY   = "#14213d";

interface NavProps { onWaitlist?: () => void; }

export default function Nav({ onWaitlist }: NavProps) {
  const [onHome, setOnHome]               = useState(true);
  const [activeId, setActiveId]           = useState("hero");
  const [isReduced, setIsReduced]         = useState(false);
  const [isDesktop, setIsDesktop]         = useState(true);
  const [mounted, setMounted]             = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chipLabel, setChipLabel]         = useState<string | null>(null);

  const headerSlot   = useRef<HTMLDivElement>(null);
  const railSlot     = useRef<HTMLDivElement>(null);
  const linkEls      = useRef<(HTMLButtonElement | null)[]>([]);
  const prevOnHome   = useRef<boolean | null>(null);
  const chipTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Detect desktop (>=1024px) vs mobile/tablet + reduced motion ─────────────
  useEffect(() => {
    const checkBreakpoint = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkBreakpoint();
    window.addEventListener("resize", checkBreakpoint);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReduced(mq.matches);
    const onMqChange = (e: MediaQueryListEvent) => setIsReduced(e.matches);
    mq.addEventListener("change", onMqChange);

    return () => {
      window.removeEventListener("resize", checkBreakpoint);
      mq.removeEventListener("change", onMqChange);
    };
  }, []);

  // ── Scroll spy for active section ──────────────────────────────────────────
  const handleScroll = useCallback(() => {
    let found = "hero";
    for (const page of NAV_PAGES) {
      const el = document.getElementById(page.id);
      if (el) {
        const r = el.getBoundingClientRect();
        if (page.id === "wonder") {
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
    setActiveId((prev) => {
      if (prev !== found) {
        // Show chip on mobile/tablet for 1.2s on section change
        const pageObj = NAV_PAGES.find((p) => p.id === found);
        if (pageObj) {
          setChipLabel(pageObj.label);
          if (chipTimerRef.current) clearTimeout(chipTimerRef.current);
          chipTimerRef.current = setTimeout(() => {
            setChipLabel(null);
          }, 1200);
        }
      }
      return found;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // ── Transition trigger for Desktop: Flip between Header and Rail ───────────
  useEffect(() => {
    if (!isDesktop) {
      setOnHome(activeId === "hero");
      return;
    }

    const s2 = document.getElementById("challenges");
    if (!s2) return;

    const checkTrigger = () => {
      const r = s2.getBoundingClientRect();
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
  }, [isDesktop, activeId]);

  // ── GSAP Flip: Flowing morph of link elements between Header and Rail (Desktop only) ──
  useEffect(() => {
    const hs = headerSlot.current;
    const rs = railSlot.current;
    const links = linkEls.current.filter(Boolean) as HTMLButtonElement[];
    if (!hs || !rs || !links.length || !isDesktop) return;

    if (prevOnHome.current === null) {
      if (onHome) links.forEach((el) => hs.appendChild(el));
      else        links.forEach((el) => rs.appendChild(el));
      prevOnHome.current = onHome;
      return;
    }

    if (prevOnHome.current === onHome) return;
    prevOnHome.current = onHome;

    if (isReduced) {
      if (onHome) links.forEach((el) => hs.appendChild(el));
      else        links.forEach((el) => rs.appendChild(el));
      return;
    }

    const state = Flip.getState(links, {
      props: "opacity,color,fontSize,fontWeight,letterSpacing",
    });

    if (onHome) {
      links.forEach((el) => hs.appendChild(el));
    } else {
      links.forEach((el) => rs.appendChild(el));
    }

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
  }, [onHome, isDesktop, isReduced]);

  // Update data-active imperatively on moved buttons (Desktop)
  useEffect(() => {
    if (!isDesktop) return;
    const links = linkEls.current.filter(Boolean) as HTMLButtonElement[];
    links.forEach((el) => {
      const id = el.getAttribute("data-nav-id");
      const isAct = id === activeId;
      el.setAttribute("data-active", isAct ? "true" : "false");
      el.setAttribute("aria-current", isAct ? "page" : "false");
    });
  }, [activeId, isDesktop]);

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

  return (
    <>
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <header
        aria-label="Site header"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isDesktop
            ? "14px 5vw"
            : "max(12px, env(safe-area-inset-top, 12px)) max(16px, env(safe-area-inset-right, 16px)) 12px max(16px, env(safe-area-inset-left, 16px))",
          background: "transparent",
          pointerEvents: "none",
        }}
      >
        {/* Logo (small on mobile, default on desktop) */}
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
              height: isDesktop ? "var(--logo-h)" : "36px",
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
            draggable={false}
          />
        </Link>

        {/* Center: Flip Target 1 (Desktop Header slot) */}
        {isDesktop && (
          <nav
            ref={headerSlot}
            aria-label="Header navigation"
            className="nav-header-slot"
          />
        )}

        {/* Right: Desktop (Login + Join Waitlist) vs Mobile (Join Waitlist + Hamburger) */}
        <div style={{ display: "flex", alignItems: "center", gap: isDesktop ? "18px" : "10px", pointerEvents: "auto", flexShrink: 0 }}>
          {isDesktop ? (
            <>
              <a
                href="#login"
                style={{
                  fontFamily: "var(--font-jakarta)",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: NAVY,
                  textDecoration: "none",
                }}
              >
                Login
              </a>
              <button
                onClick={onWaitlist}
                style={{
                  height: "40px",
                  padding: "0 22px",
                  borderRadius: "20px",
                  background: NAVY,
                  color: "#fff",
                  fontSize: "13px",
                  fontFamily: "var(--font-jakarta)",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.2s, transform 0.18s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#25205f"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = NAVY; e.currentTarget.style.transform = ""; }}
              >
                Join Waitlist
              </button>
            </>
          ) : (
            <>
              {/* Mobile "Join Waitlist" Pill Button */}
              <button
                onClick={onWaitlist}
                style={{
                  height: "38px",
                  padding: "0 16px",
                  borderRadius: "9999px",
                  background: NAVY,
                  color: "#fff",
                  fontSize: "13px",
                  fontFamily: "var(--font-jakarta)",
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(20, 33, 61, 0.18)",
                }}
              >
                Join Waitlist
              </button>

              {/* Mobile Hamburger Button (min 44x44px touch target) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                style={{
                  width: "44px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255, 255, 255, 0.75)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(20, 33, 61, 0.12)",
                  borderRadius: "12px",
                  color: NAVY,
                  cursor: "pointer",
                  padding: 0,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── MOBILE / TABLET FULL-SCREEN SHEET MODAL ───────────────────────── */}
      {!isDesktop && mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(247, 242, 231, 0.98)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "calc(env(safe-area-inset-top, 16px) + 16px) max(20px, env(safe-area-inset-right, 20px)) calc(env(safe-area-inset-bottom, 20px) + 24px) max(20px, env(safe-area-inset-left, 20px))",
            animation: "fadeIn 0.22s ease-out",
          }}
        >
          {/* Top Bar inside sheet: Logo & Close Button (44px) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/vaya-logo-500.webp"
              alt="VAYA"
              style={{ height: "34px", width: "auto" }}
            />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              style={{
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: "rgba(20, 33, 61, 0.08)",
                border: "none",
                color: NAVY,
                cursor: "pointer",
                padding: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* 5 Section Links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "16px", margin: "auto 0" }}>
            {NAV_PAGES.map((page) => {
              const isAct = activeId === page.id;
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollTo(page.id);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: "48px",
                    background: isAct ? "rgba(196, 120, 42, 0.08)" : "transparent",
                    border: isAct ? "1px solid rgba(196, 120, 42, 0.3)" : "1px solid transparent",
                    borderRadius: "14px",
                    padding: "10px 16px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: "clamp(20px, 5.5vw, 24px)",
                      fontWeight: isAct ? 700 : 500,
                      color: isAct ? COPPER : NAVY,
                    }}
                  >
                    {page.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-jakarta)",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: isAct ? COPPER : "rgba(20,33,61,0.4)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {page.roman}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Button: Join Waitlist */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onWaitlist?.();
            }}
            style={{
              height: "52px",
              width: "100%",
              borderRadius: "9999px",
              background: NAVY,
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: 600,
              fontFamily: "var(--font-jakarta)",
              letterSpacing: "0.03em",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(20, 33, 61, 0.25)",
            }}
          >
            Join Waitlist →
          </button>
        </div>
      )}

      {/* ── DESKTOP: SLIM SCROLL RAIL (Flip Target 2, portal to document.body) ── */}
      {isDesktop && mounted && createPortal(
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
                background: "rgba(20,33,61,0.15)",
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
                  background: COPPER,
                  transition: isReduced ? "none" : "height 0.35s cubic-bezier(0.25, 1, 0.5, 1)",
                }}
              />
            </div>

            {/* Flip Target 2 (Rail Slot) */}
            <div
              ref={railSlot}
              className="nav-rail-slot"
            />
          </div>
        </aside>,
        document.body
      )}

      {/* ── Hidden link element factory (Desktop Flip moves them between slots) ── */}
      {isDesktop && (
        <div aria-hidden="true" style={{ display: "none" }}>
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
        </div>
      )}

      {/* ── MOBILE/TABLET: Slim vertical dot indicator on right edge ───────── */}
      {!isDesktop && !onHome && (
        <div
          aria-label="Section navigation"
          style={{
            position: "fixed",
            right: "calc(8px + env(safe-area-inset-right, 0px))",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 55,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
            padding: "4px 0",
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
                  width: "44px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {/* Visual Dot */}
                <span
                  style={{
                    display: "block",
                    width: isAct ? "8px" : "6px",
                    height: isAct ? "8px" : "6px",
                    borderRadius: "50%",
                    background: isAct ? COPPER : "rgba(20,33,61,0.28)",
                    boxShadow: isAct ? "0 0 0 3px rgba(200,120,42,0.3)" : "none",
                    transition: "all 0.25s ease",
                  }}
                />

                {/* Current label shown briefly as a small chip for 1.2s on change */}
                {isAct && chipLabel && (
                  <span
                    style={{
                      position: "absolute",
                      right: "38px",
                      whiteSpace: "nowrap",
                      background: "#14213d",
                      color: "#FAF4EA",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontFamily: "var(--font-jakarta)",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                      pointerEvents: "none",
                      animation: "chipFade 0.2s ease-out",
                    }}
                  >
                    {chipLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
