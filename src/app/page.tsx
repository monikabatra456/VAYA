'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import SideIndex from '@/components/SideIndex';
import WaitlistModal from '@/components/WaitlistModal';

export default function Home() {
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <main className="relative w-full bg-[#fdf8ec]">
      {/* Fixed header — sits above hero in z-order (z-50) */}
      <Header onWaitlist={() => setShowWaitlist(true)} />

      {/* Shopify-style left side index (dots rail) — appears after hero */}
      <SideIndex />

      {/* Section 1: Hero (pinned scroll-driven experience) */}
      <Hero />

      {/* Section 2 placeholder: soft gradient bg with heading */}
      <section
        id="why-vaya"
        className="relative min-h-screen flex flex-col items-center justify-center px-6 py-32 bg-gradient-to-b from-[#fdf8ec] via-[#f5edd8] to-[#fdf8ec]"
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-[#3fb9c9] font-medium mb-4">
            Next Generation Travel Intelligence
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-[#25205f] font-[family-name:var(--font-outfit)] tracking-tight">
            Why travellers need VAYA
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#14213d]/75 max-w-xl mx-auto font-light leading-relaxed">
            Unfiltered crowd estimation, seasonal conditions, and effortless local insights before you go.
          </p>
        </div>
      </section>

      {/* Waitlist modal */}
      {showWaitlist && <WaitlistModal onClose={() => setShowWaitlist(false)} />}
    </main>
  );
}
