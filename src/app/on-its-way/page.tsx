// src/app/on-its-way/page.tsx
'use client';

import React, { useState, useRef } from 'react';
import Header from '@/components/Header';
import WaitlistModal from '@/components/WaitlistModal';
import OnItsWay from '@/components/on-its-way/OnItsWay';

export default function OnItsWayPreviewPage() {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);

  return (
    <main className="relative w-full min-h-screen bg-[#FBF1E3]">
      {/*
        Navbar: Reusing the exact site Header component (Logo, "Login", "Join Waitlist" navy pill)
        Wrapped in a div with navbarRef for timeline fade-in synchronization.
      */}
      <div ref={navbarRef} style={{ opacity: 0 }}>
        <Header onWaitlist={() => setShowWaitlist(true)} />
      </div>

      {/* Standalone OnItsWay Component */}
      <OnItsWay navbarRef={navbarRef} />

      {/* Waitlist Modal */}
      {showWaitlist && <WaitlistModal onClose={() => setShowWaitlist(false)} />}
    </main>
  );
}
