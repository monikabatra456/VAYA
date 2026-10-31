// src/components/challenges/SideNav.tsx
// Left-side Roman numeral section navigation
// Scroll-spy: highlights active section. Click → smooth scroll.
// Mirrors SideIndex.jsx pattern but with different style (Roman numerals + thin vertical line)
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { SIDE_NAV_ITEMS } from "./challengesData";

interface SideNavProps {
  visible: boolean;
}

export default function SideNav({ visible }: SideNavProps) {
  const [activeId, setActiveId] = useState("challenges");

  const handleScroll = useCallback(() => {
    for (const item of SIDE_NAV_ITEMS) {
      const el = document.getElementById(item.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.55 && rect.bottom >= window.innerHeight * 0.15) {
          setActiveId(item.id);
          break;
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollTo = (id: string) => {
    if (id === "hero") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Page sections"
      style={{
        position: "absolute",
        left: "clamp(20px, 3vw, 48px)",
        bottom: "clamp(40px, 6vh, 80px)",
        display: "flex",
        flexDirection: "column",
        gap: "0",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-12px)",
        transition: "opacity 500ms ease, transform 500ms ease",
        pointerEvents: visible ? "auto" : "none",
        zIndex: 20,
      }}
    >
      {/* Thin vertical line */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "8px",
          top: "4px",
          bottom: "4px",
          width: "1px",
          background: "linear-gradient(to bottom, transparent, rgba(20,33,61,0.2) 20%, rgba(20,33,61,0.2) 80%, transparent)",
        }}
      />

      {SIDE_NAV_ITEMS.map((item) => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            aria-label={`Go to ${item.label} section`}
            aria-current={isActive ? "true" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "5px 0 5px 20px",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              transition: "opacity 200ms ease",
            }}
          >
            {/* Active dot on the line */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "4px",
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: isActive ? "rgba(196,130,70,0.9)" : "transparent",
                border: isActive ? "none" : "1px solid rgba(20,33,61,0.2)",
                transition: "background 250ms ease, border 250ms ease",
                transform: "translateY(0)",
              }}
            />

            {/* Roman numeral */}
            <span
              style={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontSize: "10px",
                fontWeight: isActive ? 500 : 300,
                color: isActive ? "rgba(20,33,61,0.9)" : "rgba(20,33,61,0.35)",
                letterSpacing: "0.05em",
                minWidth: "14px",
                transition: "color 250ms ease, font-weight 250ms ease",
              }}
            >
              {item.roman}
            </span>

            {/* Label */}
            <span
              style={{
                fontFamily: "var(--font-jakarta), sans-serif",
                fontSize: "10px",
                fontWeight: isActive ? 500 : 300,
                color: isActive ? "rgba(20,33,61,0.85)" : "rgba(20,33,61,0.35)",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                transition: "color 250ms ease, font-weight 250ms ease",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
