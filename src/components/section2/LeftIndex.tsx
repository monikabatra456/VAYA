// src/components/section2/LeftIndex.tsx
// Roman numeral scroll-spy side navigation
// Active item: copper color + left marker line
"use client";

import React, { useEffect, useState, useCallback } from "react";

const ITEMS = [
  { roman: "I",   label: "Home",           id: "hero" },
  { roman: "II",  label: "Challenges",     id: "challenges" },
  { roman: "III", label: "About VAYA",     id: "about-vaya" },
  { roman: "IV",  label: "Travel Network", id: "traveller-network" },
  { roman: "V",   label: "Blog",           id: "blog" },
  { roman: "VI",  label: "Coming Soon",    id: "coming-soon" },
];

const COPPER = "#C4782A";
const GHOST  = "rgba(20,33,61,0.38)";

export default function LeftIndex() {
  const [activeId, setActiveId] = useState("challenges");

  const handleScroll = useCallback(() => {
    for (const item of ITEMS) {
      const el = document.getElementById(item.id);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.top <= window.innerHeight * 0.55 && r.bottom >= window.innerHeight * 0.1) {
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
    if (id === "hero") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Page sections"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
      }}
    >
      {ITEMS.map((item) => {
        const active = activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            aria-current={active ? "true" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 0",
              background: "none",
              border: "none",
              cursor: "pointer",
              transition: "all 250ms ease",
            }}
          >
            {/* Active marker */}
            <span
              aria-hidden="true"
              style={{
                display: "block",
                width: active ? "18px" : "0px",
                height: "2px",
                background: COPPER,
                borderRadius: "1px",
                transition: "width 300ms ease",
                flexShrink: 0,
              }}
            />
            {/* Roman numeral */}
            <span
              style={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontSize: "10px",
                fontWeight: active ? 600 : 400,
                color: active ? COPPER : GHOST,
                letterSpacing: "0.04em",
                minWidth: "14px",
                transition: "color 250ms ease",
              }}
            >
              {item.roman}
            </span>
            {/* Label */}
            <span
              style={{
                fontFamily: "var(--font-jakarta), sans-serif",
                fontSize: "11px",
                fontWeight: active ? 600 : 400,
                color: active ? COPPER : GHOST,
                whiteSpace: "nowrap",
                transition: "color 250ms ease",
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
