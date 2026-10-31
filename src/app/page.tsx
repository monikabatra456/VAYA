'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import WaitlistModal from '@/components/WaitlistModal';
import Section2 from '@/components/section2/Section2';
import WonderWorld from '@/components/wonder/WonderWorld';
import ScrollManager from '@/components/ScrollManager';

export default function Home() {
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <main className="relative w-full">
      <ScrollManager />
      {/* Unified morphing nav — header on HOME, bottom-left index off-home.
          SideIndex and Header are NOT rendered here (nav handles everything). */}
      <Nav onWaitlist={() => setShowWaitlist(true)} />

      {/* Section 1: Hero */}
      <Hero />

      {/* Section 2: The Travel Struggle */}
      <Section2 />

      {/* Section 3: The Wonder World */}
      <WonderWorld onWaitlist={() => setShowWaitlist(true)} />

      {/* Placeholder sections so scroll spy + nav work */}
      <section id="meet-vaya"     style={{ height: "100svh", background: "#F7F2E7" }} />
      <section id="on-its-way"    style={{ height: "100svh", background: "#F7F2E7" }} />

      {showWaitlist && <WaitlistModal onClose={() => setShowWaitlist(false)} />}
    </main>
  );
}
