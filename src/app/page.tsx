'use client';

import React from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import WhyVayaSection from '@/components/WhyVayaSection';

export default function Home() {
  return (
    <main className="relative w-full bg-[#f3f2ee] text-[#14213d] overflow-x-hidden selection:bg-[#14213d] selection:text-[#f3f2ee]">
      {/* Fixed Header: Logo (top-left), Login, Join Waitlist */}
      <Header />

      {/* Hero Pinned Scroll Animation */}
      <Hero />

      {/* ── Section 2: Why travellers need VAYA ── */}
      <WhyVayaSection />
    </main>
  );
}
