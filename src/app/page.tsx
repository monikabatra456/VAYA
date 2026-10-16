'use client';

import React from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';

export default function Home() {
  return (
    <main className="relative w-full bg-[#f3f2ee] text-[#14213d] overflow-x-hidden selection:bg-[#14213d] selection:text-[#f3f2ee]">
      {/* Fixed Header: Logo (top-left), Login, Join Waitlist */}
      <Header />

      {/* Hero Pinned WebGL Experience (Page ends with hero pin release) */}
      <Hero />
    </main>
  );
}
