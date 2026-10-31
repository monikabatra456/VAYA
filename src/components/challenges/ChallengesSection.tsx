// src/components/challenges/ChallengesSection.tsx
// "THE TRAVEL CHALLENGES" — Page 2 section
//
// ── Animation Constants (sourced from www.shopify.com2.har Shopify Editions) ──
// INTRO_DURATION = 1000ms          (HAR: Se.duration = 1e3)
// INTRO_DELAY_RANGE = [0, 800]ms   (HAR: Se.delayRange = [0, 800])
// INTRO_SCALE_MULT = 0.5           (HAR: Se.introScaleMultiplier = 0.5)
// INTRO_EASING = "cubic-bezier(0.34, 1.56, 0.64, 1)" (HAR: spring easing on cards)
// PARALLAX_STRENGTH = 15px         (HAR: S * -15, M * -15 for bg cards)
// REPULSION_MAX_DIST = 300px       (HAR: De.maxDistance = 300)
// REPULSION_STRENGTH = 20px        (HAR: De.repulsionStrength = 20)
// ── Approximate (inferred from recording, not found verbatim in HAR) ──
// FLOAT_DURATION_RANGE = [5000, 9000]ms  (typical sine-wave idle animation)
// FLOAT_AMPLITUDE_RANGE = [6, 12]px      (subtle vertical drift)
// GLOW_DURATION = 300ms                   (card hover glow fade)
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ChallengeCard from "./ChallengeCard";
import VideoModal from "./VideoModal";
import SideNav from "./SideNav";
import { CHALLENGES, GHOST_CARDS } from "./challengesData";

gsap.registerPlugin(ScrollTrigger);

// ── Animation constants (HAR-sourced, see header) ──────────────────────────
const INTRO_DURATION = 1; // seconds (GSAP)
const INTRO_DELAY_MAX = 0.8; // seconds
const INTRO_SCALE_MULT = 0.5; // HAR: Se.introScaleMultiplier
const PARALLAX_STRENGTH = 15; // HAR: -15px per 0.5 mouse offset
const REPULSION_MAX_DIST = 300; // HAR: De.maxDistance
const REPULSION_STRENGTH = 20; // HAR: De.repulsionStrength

// Approximate (from recordings):
const FLOAT_DURATION_MIN = 5;
const FLOAT_DURATION_MAX = 9;
const FLOAT_AMPLITUDE_MIN = 6;
const FLOAT_AMPLITUDE_MAX = 12;

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

// Mountain misty illustration (SVG, opacity ~9%)
function MistyMountainIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 800 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: "clamp(300px, 55vw, 700px)",
        height: "auto",
        opacity: 0.09,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <path
        d="M0 320L80 220L160 270L260 140L380 200L460 100L560 180L660 80L800 160L800 320Z"
        fill="var(--charcoal)"
      />
      <path
        d="M0 320L100 240L200 290L320 180L420 240L500 150L600 210L700 120L800 180L800 320Z"
        fill="var(--navy)"
        opacity="0.5"
      />
      {/* Mist layer */}
      <ellipse cx="200" cy="290" rx="220" ry="40" fill="var(--cream)" opacity="0.6" />
      <ellipse cx="500" cy="310" rx="280" ry="35" fill="var(--cream)" opacity="0.5" />
    </svg>
  );
}

// Script/handwritten text line (CSS fallback with Caveat-like styling)
function ScriptLine() {
  return (
    <div
      style={{
        marginTop: "clamp(20px, 3vh, 32px)",
        position: "relative",
        display: "inline-block",
        transform: "rotate(-1.5deg)",
        transformOrigin: "left center",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-caveat), 'Caveat', cursive",
          fontSize: "clamp(22px, 2.4vw, 34px)",
          fontWeight: 400,
          color: "#b8621a",
          letterSpacing: "0.01em",
          lineHeight: 1.3,
          display: "block",
        }}
      >
        Less stress,
      </span>
      <span
        style={{
          fontFamily: "var(--font-caveat), 'Caveat', cursive",
          fontSize: "clamp(22px, 2.4vw, 34px)",
          fontWeight: 400,
          color: "#b8621a",
          letterSpacing: "0.01em",
          lineHeight: 1.3,
          display: "block",
        }}
      >
        more moments.
      </span>
      {/* Hand-drawn underline */}
      <svg
        viewBox="0 0 200 14"
        fill="none"
        style={{
          position: "absolute",
          bottom: "-6px",
          left: "0",
          width: "80%",
          height: "auto",
          overflow: "visible",
        }}
        aria-hidden="true"
      >
        <path
          d="M3 8 C40 4, 80 12, 130 7 C160 4, 185 10, 198 8"
          stroke="#c4782a"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}

export default function ChallengesSection() {
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [activeCardRect, setActiveCardRect] = useState<DOMRect | null>(null);
  const [isReduced, setIsReduced] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sectionVisible, setSectionVisible] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const ghostRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const floatTweensRef = useRef<gsap.core.Tween[]>([]);
  const rafRef = useRef<number | null>(null);
  const cardRectCacheRef = useRef<Map<string, { cx: number; cy: number; w: number; h: number }>>( new Map() );
  const containerRectRef = useRef<DOMRect | null>(null);
  const gsapCtxRef = useRef<gsap.Context | null>(null);

  // Detect prefers-reduced-motion + mobile
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReduced(mq.matches);
    const onMqChange = (e: MediaQueryListEvent) => setIsReduced(e.matches);
    mq.addEventListener("change", onMqChange);

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      mq.removeEventListener("change", onMqChange);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // ── GSAP context — card entry + idle float ─────────────────────────────
  useEffect(() => {
    if (isMobile) return;

    const section = sectionRef.current;
    const container = cardsContainerRef.current;
    if (!section || !container) return;

    gsapCtxRef.current = gsap.context(() => {
      const allCardEls = Array.from(container.querySelectorAll(".challenge-card-wrapper"));
      const ghostEls = Array.from(container.querySelectorAll(".ghost-card-wrapper"));

      if (isReduced) {
        // Accessibility: just fade in
        ScrollTrigger.create({
          trigger: section,
          start: "top 80%",
          once: true,
          onEnter: () => {
            gsap.fromTo(
              allCardEls,
              { opacity: 0 },
              { opacity: 1, duration: 0.6, stagger: 0.08, ease: "power2.out" }
            );
            gsap.fromTo(
              ghostEls,
              { opacity: 0 },
              { opacity: (i) => GHOST_CARDS[i]?.baseOpacity ?? 0.35, duration: 0.5, delay: 0.2, stagger: 0.05 }
            );
          },
        });
        return;
      }

      // ── Entry animation (HAR: Se.introScaleMultiplier=0.5, duration=1s, delay 0-800ms, spring easing)
      const entryTl = gsap.timeline({ paused: true });
      allCardEls.forEach((el) => {
        const wrapper = el as HTMLElement;
        const baseScale = parseFloat(wrapper.dataset.baseScale ?? "1");
        const baseOpacity = parseFloat(wrapper.dataset.baseOpacity ?? "1");
        const delay = randomBetween(0, INTRO_DELAY_MAX);

        entryTl.fromTo(
          wrapper,
          {
            scale: baseScale * INTRO_SCALE_MULT, // HAR: scale(${x*Se.introScaleMultiplier})
            opacity: 0,
          },
          {
            scale: baseScale,
            opacity: baseOpacity,
            duration: INTRO_DURATION,
            delay,
            ease: "cubic-bezier(0.34, 1.56, 0.64, 1)", // HAR spring easing
            clearProps: "scale",
          },
          "<" // all start together from timeline start
        );
      });
      // Ghost cards also enter (slightly before or with main cards)
      ghostEls.forEach((el) => {
        const wrapper = el as HTMLElement;
        const baseScale = parseFloat(wrapper.dataset.baseScale ?? "0.5");
        const baseOpacity = parseFloat(wrapper.dataset.baseOpacity ?? "0.35");
        const delay = randomBetween(0, INTRO_DELAY_MAX * 0.7);
        entryTl.fromTo(
          wrapper,
          { scale: baseScale * INTRO_SCALE_MULT, opacity: 0 },
          {
            scale: baseScale,
            opacity: baseOpacity,
            duration: INTRO_DURATION * 0.9,
            delay,
            ease: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            clearProps: "scale",
          },
          "<"
        );
      });

      ScrollTrigger.create({
        trigger: section,
        start: "top 75%",
        once: true,
        onEnter: () => {
          entryTl.play();
          setSectionVisible(true);
        },
      });

      // Visibility toggle for performance (pause float when off-screen)
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => setSectionVisible(true),
        onLeave: () => setSectionVisible(false),
        onEnterBack: () => setSectionVisible(true),
        onLeaveBack: () => setSectionVisible(false),
      });

      // ── Idle float animation (approximate — sine-wave drift, 5-9s, 6-12px amplitude)
      // Each card gets a unique duration, amplitude, and delay to feel organic
      allCardEls.forEach((el, i) => {
        const wrapper = el as HTMLElement;
        const duration = randomBetween(FLOAT_DURATION_MIN, FLOAT_DURATION_MAX);
        const amplitude = randomBetween(FLOAT_AMPLITUDE_MIN, FLOAT_AMPLITUDE_MAX);
        const delay = randomBetween(0, duration); // offset phase

        const tween = gsap.to(wrapper, {
          y: amplitude,
          duration: duration / 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay,
          paused: true,
        });
        floatTweensRef.current.push(tween);
      });
    }, container);

    return () => {
      gsapCtxRef.current?.revert();
      floatTweensRef.current = [];
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isMobile, isReduced]);

  // Pause/resume float tweens based on visibility
  useEffect(() => {
    if (isReduced || isMobile) return;
    floatTweensRef.current.forEach((t) => {
      if (sectionVisible) t.resume();
      else t.pause();
    });
  }, [sectionVisible, isReduced, isMobile]);

  // ── Mouse parallax (HAR: pointermove → translate3d(S*-15, M*-15) for bg cards,
  //    repulsion on interactive cards: repulsionStrength=20, maxDistance=300)
  const updateCardRectCache = useCallback(() => {
    const container = cardsContainerRef.current;
    if (!container) return;
    containerRectRef.current = container.getBoundingClientRect();
    const cr = containerRectRef.current;

    cardRectCacheRef.current.clear();
    cardRefs.current.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      cardRectCacheRef.current.set(id, {
        cx: r.left - cr.left + r.width / 2,
        cy: r.top - cr.top + r.height / 2,
        w: r.width,
        h: r.height,
      });
    });
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isReduced || isMobile || !sectionVisible) return;
      if (rafRef.current !== null) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const cr = containerRectRef.current;
        if (!cr) return;

        const cx = e.clientX - cr.left;
        const cy = e.clientY - cr.top;
        const S = cx / cr.width - 0.5; // -0.5 to 0.5
        const M = cy / cr.height - 0.5;

        // Parallax for ghost cards (HAR: translate3d(S*-15, M*-15))
        ghostRefs.current.forEach((el) => {
          el.style.transform = `translate3d(${S * -PARALLAX_STRENGTH}px, ${M * -PARALLAX_STRENGTH}px, 0)`;
        });

        // Repulsion for interactive cards (HAR: De.maxDistance=300, De.repulsionStrength=20)
        cardRefs.current.forEach((el, id) => {
          const info = cardRectCacheRef.current.get(id);
          if (!info) return;

          const dx = cx - info.cx;
          const dy = cy - info.cy;
          const dist2 = dx * dx + dy * dy;
          const maxDist2 = REPULSION_MAX_DIST * REPULSION_MAX_DIST;

          if (dist2 > maxDist2) {
            el.style.transform = "";
            return;
          }

          const dist = Math.sqrt(dist2);
          const falloff = 1 - Math.pow(dist / REPULSION_MAX_DIST, 2); // smooth falloff
          let tx = 0;
          let ty = 0;
          if (dist > 0) {
            tx = (-dx / dist) * falloff * REPULSION_STRENGTH;
            ty = (-dy / dist) * falloff * REPULSION_STRENGTH;
          }
          el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        });
      });
    },
    [isReduced, isMobile, sectionVisible]
  );

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    ghostRefs.current.forEach((el) => {
      el.style.transform = "";
    });
    cardRefs.current.forEach((el) => {
      el.style.transform = "";
    });
  }, []);

  const handleContainerEnter = useCallback(() => {
    updateCardRectCache();
  }, [updateCardRectCache]);

  // Resize debounce → update cache
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(updateCardRectCache, 100);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    };
  }, [updateCardRectCache]);

  // Open modal
  const openCard = useCallback((cardId: string) => {
    const wrapperEl = cardRefs.current.get(cardId);
    const rect = wrapperEl?.getBoundingClientRect() ?? null;
    setActiveCardRect(rect);
    setActiveCard(cardId);
  }, []);

  const closeCard = useCallback(() => {
    setActiveCard(null);
    setActiveCardRect(null);
  }, []);

  const activeCardData = useMemo(
    () => CHALLENGES.find((c) => c.id === activeCard) ?? null,
    [activeCard]
  );

  // Mobile carousel: active card index
  const [mobileActiveIdx, setMobileActiveIdx] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const mobileCardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <section
        ref={sectionRef}
        id="challenges"
        aria-label="The Travel Challenges"
        style={{
          position: "relative",
          minHeight: "100vh",
          background: "var(--cream)",
          overflow: "hidden",
          display: "flex",
          alignItems: "stretch",
        }}
      >
        {/* Misty mountain illustration — bottom-left, opacity ~9% */}
        <MistyMountainIllustration />

        {/* Inner layout: 40/60 left/right split */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            width: "100%",
            minHeight: "100vh",
            padding: isMobile ? "80px 24px 60px" : "clamp(80px, 10vh, 120px) clamp(32px, 5vw, 80px)",
            gap: isMobile ? "40px" : "0",
          }}
        >
          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div
            style={{
              flex: isMobile ? "none" : "0 0 38%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingRight: isMobile ? "0" : "clamp(24px, 3vw, 60px)",
              position: "relative",
            }}
          >
            {/* Eyebrow: terracotta line + small caps label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "clamp(14px, 2vh, 22px)",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: "28px",
                  height: "1.5px",
                  background: "#b8621a",
                  borderRadius: "1px",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-jakarta), sans-serif",
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#b8621a",
                }}
              >
                The Travel Challenges
              </span>
            </div>

            {/* H1 headline: large serif, dark navy */}
            <h1
              style={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontSize: "clamp(36px, 4.5vw, 68px)",
                fontWeight: 200,
                color: "var(--charcoal)",
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
                marginBottom: "clamp(18px, 2.5vh, 28px)",
              }}
            >
              Why travellers
              <br />
              <em style={{ fontStyle: "normal", color: "var(--navy)" }}>need VAYA</em>
            </h1>

            {/* Primary paragraph */}
            <p
              style={{
                fontFamily: "var(--font-jakarta), sans-serif",
                fontSize: "clamp(14px, 1.15vw, 17px)",
                fontWeight: 300,
                color: "rgba(20,33,61,0.82)",
                lineHeight: 1.65,
                marginBottom: "clamp(10px, 1.5vh, 16px)",
                maxWidth: "420px",
              }}
            >
              Travel is exciting, but it comes with real challenges — from overcrowded
              destinations to high prices, finding guides, and unexpected situations.
            </p>

            {/* Secondary muted paragraph */}
            <p
              style={{
                fontFamily: "var(--font-jakarta), sans-serif",
                fontSize: "clamp(12px, 1vw, 14.5px)",
                fontWeight: 300,
                color: "rgba(20,33,61,0.45)",
                lineHeight: 1.6,
                maxWidth: "380px",
              }}
            >
              VAYA brings everything you need to plan smarter, travel safer and make every
              moment count.
            </p>

            {/* Handwritten script line */}
            <ScriptLine />

            {/* Side nav — desktop only, positioned at bottom-left of section */}
            {!isMobile && (
              <SideNav visible={sectionVisible} />
            )}
          </div>

          {/* ── RIGHT COLUMN: Floating cards cluster ─────────────────────── */}
          {!isMobile ? (
            <div
              ref={cardsContainerRef}
              onPointerMove={handlePointerMove}
              onMouseLeave={handleMouseLeave}
              onMouseEnter={handleContainerEnter}
              style={{
                flex: "1 1 62%",
                position: "relative",
                containerType: "inline-size", // HAR: containerType: "inline-size"
                // Fixed height so cqi calculations work
                minHeight: "clamp(480px, 72vh, 720px)",
                // overflow visible: cards with negative top still appear
                overflow: "visible",
                paddingTop: "20px",
              }}
            >
              {/* Ghost / decorator cards (parallax, pointer-events-none) */}
              {GHOST_CARDS.map((ghost) => (
                <div
                  key={ghost.id}
                  ref={(el) => {
                    if (el) ghostRefs.current.set(ghost.id, el);
                  }}
                  className="ghost-card-wrapper"
                  data-base-scale={ghost.baseScale}
                  data-base-opacity={ghost.baseOpacity}
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: ghost.position.left,
                    top: ghost.position.top,
                    pointerEvents: "none",
                    zIndex: 1,
                    opacity: 0, // animated in by GSAP
                    transformOrigin: "left center",
                    willChange: "transform",
                  }}
                >
                  {/* Ghost card visual */}
                  <div
                    style={{
                      width: "clamp(140px, 18cqi, 200px)",
                      borderRadius: "14px",
                      background: "rgba(255,252,246,0.55)",
                      border: "1px solid rgba(196,130,70,0.1)",
                      backdropFilter: "blur(6px)",
                      WebkitBackdropFilter: "blur(6px)",
                      padding: "12px 14px",
                      filter: "blur(0.6px)",
                    }}
                  >
                    <div
                      style={{
                        height: "8px",
                        borderRadius: "4px",
                        background: "rgba(20,33,61,0.12)",
                        marginBottom: "6px",
                        width: "60%",
                      }}
                    />
                    <div
                      style={{
                        fontFamily: "var(--font-jakarta), sans-serif",
                        fontSize: "10px",
                        color: "rgba(20,33,61,0.35)",
                        lineHeight: 1.4,
                      }}
                    >
                      {ghost.text}
                    </div>
                  </div>
                </div>
              ))}

              {/* Interactive cards */}
              {CHALLENGES.map((card) => (
                <div
                  key={card.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(card.id, el);
                  }}
                  className="challenge-card-wrapper"
                  data-base-scale={card.baseScale}
                  data-base-opacity={card.baseOpacity}
                  style={{
                    position: "absolute",
                    left: card.position.left,
                    top: card.position.top,
                    zIndex: 10,
                    opacity: 0, // animated in by GSAP
                    willChange: "transform",
                    transformOrigin: "center center",
                  }}
                >
                  <ChallengeCard
                    card={card}
                    onClick={() => openCard(card.id)}
                    isReduced={isReduced}
                  />
                </div>
              ))}
            </div>
          ) : (
            // ── MOBILE: Horizontal scroll-snap carousel ────────────────────
            <div style={{ width: "100%", overflow: "hidden" }}>
              <div
                ref={carouselRef}
                style={{
                  display: "flex",
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                  gap: "16px",
                  paddingLeft: "24px",
                  paddingRight: "24px",
                  paddingBottom: "16px",
                  msOverflowStyle: "none",
                  scrollbarWidth: "none",
                }}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const idx = Math.round(el.scrollLeft / (el.offsetWidth * 0.8));
                  setMobileActiveIdx(Math.max(0, Math.min(idx, CHALLENGES.length - 1)));
                }}
              >
                {CHALLENGES.map((card, i) => (
                  <button
                    key={card.id}
                    ref={(el) => { mobileCardRefs.current[i] = el; }}
                    onClick={() => openCard(card.id)}
                    aria-label={`${card.title}: ${card.desc}`}
                    style={{
                      flexShrink: 0,
                      width: "75vw",
                      maxWidth: "320px",
                      scrollSnapAlign: "center",
                      opacity: i === mobileActiveIdx ? 1 : 0.55,
                      transition: "opacity 300ms ease",
                      background: "rgba(255, 252, 246, 0.95)",
                      borderRadius: "18px",
                      border: "1px solid rgba(196,130,70,0.15)",
                      boxShadow:
                        "0 4px 20px rgba(37,32,95,0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
                      padding: "20px",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
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
                        marginBottom: "14px",
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" width={24} height={24}>
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </div>
                    <h3
                      style={{
                        fontFamily: "var(--font-outfit), sans-serif",
                        fontSize: "17px",
                        fontWeight: 500,
                        color: "var(--charcoal)",
                        marginBottom: "8px",
                      }}
                    >
                      {card.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "var(--font-jakarta), sans-serif",
                        fontSize: "13px",
                        fontWeight: 300,
                        color: "rgba(20,33,61,0.6)",
                        lineHeight: 1.5,
                      }}
                    >
                      {card.desc}
                    </p>
                  </button>
                ))}
              </div>

              {/* Mobile carousel dots */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "16px",
                }}
              >
                {CHALLENGES.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === mobileActiveIdx ? "20px" : "6px",
                      height: "6px",
                      borderRadius: "3px",
                      background:
                        i === mobileActiveIdx ? "#b8621a" : "rgba(20,33,61,0.2)",
                      transition: "all 300ms ease",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Video Modal — rendered via portal to avoid stacking context issues */}
      {activeCard && activeCardData &&
        createPortal(
          <VideoModal
            card={activeCardData}
            sourceRect={activeCardRect}
            onClose={closeCard}
            isReduced={isReduced}
          />,
          document.body
        )}
    </>
  );
}
