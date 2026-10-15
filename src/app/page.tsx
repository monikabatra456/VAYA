'use client';

import React from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';

export default function Home() {
  return (
    <main className="relative w-full bg-[#f3f2ee] text-[#1e2a3f] overflow-x-hidden selection:bg-[#1e2a3f] selection:text-[#f3f2ee]">
      {/* Fixed Header: Logo (top-left), Login, Join Waitlist */}
      <Header />

      {/* Hero Pinned Scroll Animation */}
      <Hero />

      {/* ── Minimal Placeholder Section (#f3f2ee, min-height 100svh, grey "Next section" text) ── */}
      <section
        id="next"
        className="relative z-20 min-h-[100svh] w-full bg-[#f3f2ee] flex items-center justify-center select-none"
      >
        <span className="text-[13px] text-[#8e98a8] tracking-[0.2em] uppercase font-light">
          Next section
        </span>
      </section>
    </main>
  );
}
