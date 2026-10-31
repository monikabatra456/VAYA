'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import WaitlistModal from '@/components/WaitlistModal';
import Section2 from '@/components/section2/Section2';
import WonderWorld from '@/components/wonder/WonderWorld';
import MeetVaya from '@/components/MeetVaya';
import ScrollManager from '@/components/ScrollManager';
import OnItsWay from '@/components/on-its-way/OnItsWay';
import Footer from '@/components/Footer';

export default function Home() {
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <main className="relative w-full overflow-x-hidden">
      <ScrollManager />
      {/* Unified morphing nav — header on HOME, bottom-left index off-home.
          SideIndex and Header are NOT rendered here (nav handles everything). */}
      <Nav onWaitlist={() => setShowWaitlist(true)} />

      {/* Section 1: Hero */}
      <Hero onWaitlist={() => setShowWaitlist(true)} />

      {/* Section 2: The Travel Struggle */}
      <Section2 />

      {/* Section 3: The Wonder World */}
      <WonderWorld onWaitlist={() => setShowWaitlist(true)} />

      {/* Section 4: Meet VAYA */}
      <MeetVaya onWaitlist={() => setShowWaitlist(true)} />

      {/* Section 5: On Its Way */}
      <OnItsWay />

      {/* Footer */}
      <Footer />

      {showWaitlist && <WaitlistModal onClose={() => setShowWaitlist(false)} />}
    </main>
  );
}
