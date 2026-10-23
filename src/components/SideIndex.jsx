// src/components/SideIndex.jsx
// Shopify Editions style left-side index (dots rail).
// Appears only AFTER the hero section (scrolled past hero).
// Light, airy, premium. Never dark.
"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "why-vaya", label: "Why VAYA" },
  { id: "traveller-network", label: "Network" },
  { id: "how-it-works", label: "Experience" },
];

export default function SideIndex() {
  const [visible, setVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("why-vaya");

  useEffect(() => {
    function handleScroll() {
      const heroWrapper = document.querySelector(".hero-wrapper");
      if (!heroWrapper) return;
      const heroBottom = heroWrapper.getBoundingClientRect().bottom;
      // Index fades in as soon as hero unpins / exits
      const pastHero = heroBottom <= window.innerHeight * 0.35;
      setVisible(pastHero);

      // Determine active section based on scroll
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.2) {
            setActiveSection(s.id);
            break;
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    if (id === "hero") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <aside
      aria-label="Section navigation"
      className={`fixed left-5 md:left-8 top-1/2 -translate-y-1/2 z-40 transition-all duration-500 ease-out pointer-events-none ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
      }`}
    >
      <nav className="flex flex-col items-center gap-4 p-2 rounded-full bg-[#fdf8ec]/80 backdrop-blur-md border border-[#25205f]/10 shadow-[0_8px_30px_rgba(37,32,95,0.06)] pointer-events-auto">
        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => scrollTo(sec.id)}
              className="group relative flex items-center justify-center w-6 h-6 rounded-full transition-transform hover:scale-125 focus:outline-none"
              aria-label={`Jump to ${sec.label}`}
            >
              {/* Dot */}
              <span
                className={`block rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-2.5 h-2.5 bg-[#25205f] shadow-[0_0_8px_rgba(63,185,201,0.6)] ring-2 ring-[#3fb9c9]/60"
                    : "w-1.5 h-1.5 bg-[#25205f]/35 group-hover:bg-[#25205f]/80"
                }`}
              />

              {/* Tooltip on hover */}
              <span className="absolute left-8 px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide bg-[#fdf8ec] text-[#25205f] border border-[#25205f]/10 shadow-sm opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap">
                {sec.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
