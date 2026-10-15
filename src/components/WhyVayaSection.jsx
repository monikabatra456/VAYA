'use client';

import React, { useState } from 'react';

const CHALLENGES = [
  {
    id: 'overcrowding',
    title: 'Overcrowding',
    icon: '👥',
    tag: 'Friction',
    problem: 'Iconic locations overwhelmed by tour buses, endless queues, and crowded viewpoints.',
    vayaFix: 'VAYA reveals live off-peak visiting windows, quiet hidden lookouts, and serene alternative trails.',
  },
  {
    id: 'prices',
    title: 'Unreasonable Prices',
    icon: '🏷️',
    tag: 'Cost',
    problem: 'Tourist-inflated menus, dynamic surge fares, and hidden booking fees everywhere.',
    vayaFix: 'Transparent verified local price baselines so you always pay what locals pay, without markups.',
  },
  {
    id: 'guides',
    title: 'Local Guides',
    icon: '🧭',
    tag: 'Discovery',
    problem: 'Generic script-driven group tours and outdated travel brochure recommendations.',
    vayaFix: 'Curated direct connections with passionate neighborhood insiders who know real stories.',
  },
  {
    id: 'changes',
    title: 'Changing Plans',
    icon: '🌦️',
    tag: 'Flexibility',
    problem: 'Sudden mountain weather changes and unexpected venue closures breaking fixed schedules.',
    vayaFix: 'Smart dynamic schedule re-routing that instantly suggests weather-proof local alternatives.',
  },
  {
    id: 'safety',
    title: 'Safety Concerns',
    icon: '🛡️',
    tag: 'Security',
    problem: 'Uncertainty when navigating unfamiliar streets, night routes, or remote valley transit.',
    vayaFix: 'Verified safe-zone navigation, real-time traveler community notes, and direct emergency assist.',
  },
  {
    id: 'planning',
    title: 'Too Much Planning',
    icon: '📋',
    tag: 'Fatigue',
    problem: 'Dozens of open browser tabs, conflicting Reddit threads, and itinerary fatigue before departure.',
    vayaFix: 'Concise field guides giving you the exact 3 things to know before you step out your door.',
  },
];

export default function WhyVayaSection() {
  const [activeVideo, setActiveVideo] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <section
      id="why-vaya"
      className="relative z-20 w-full min-h-screen bg-[#F7F1E6] text-[#14213d] py-28 px-6 md:px-14 lg:px-20 overflow-hidden"
    >
      {/* ── Faint Mountain Line-Sketch Bottom-Left ── */}
      <div
        className="absolute bottom-0 left-0 w-[550px] max-w-[90vw] h-[360px] pointer-events-none opacity-[0.09] z-0 select-none"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 600 400"
          fill="none"
          stroke="#14213d"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full"
        >
          {/* Majestic mountain ridge line sketches */}
          <path d="M 0 380 L 90 260 L 160 310 L 250 180 L 330 270 L 410 140 L 480 240 L 550 190 L 600 280" />
          <path d="M 40 380 L 140 290 L 220 330 L 310 230 L 380 290 L 460 210 L 530 290" opacity="0.6" />
          <path d="M 250 180 L 270 240 M 250 180 L 230 250 M 410 140 L 430 210 M 410 140 L 390 220" opacity="0.5" />
          <path d="M 70 380 Q 200 350 350 370 T 600 360" opacity="0.4" strokeDasharray="4 6" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* ── LEFT COLUMN: The Travel Challenges Editorial ── */}
          <div className="lg:col-span-5 flex flex-col justify-center pt-4 lg:sticky lg:top-28">
            {/* Small uppercase label */}
            <span className="inline-block text-[11px] font-semibold tracking-[0.24em] uppercase text-[#1f4f9c] mb-4">
              THE TRAVEL CHALLENGES
            </span>

            {/* Serif headline */}
            <h2 className="font-serif text-[clamp(32px,3.8vw,52px)] font-normal text-[#14213d] leading-[1.15] tracking-[-0.01em] mb-6">
              Travel was meant to be liberating. Somewhere along the way, it became work.
            </h2>

            {/* 3-line subtext */}
            <p className="text-[16px] md:text-[17px] text-[#4a5568] leading-relaxed font-light mb-8 max-w-[480px]">
              Endless conflicting reviews, tourist-trap pricing, and rigid plans turn spontaneous journeys into logistical stress. VAYA bridges the gap so you step in prepared and step out inspired.
            </p>

            {/* Copper script */}
            <div className="pt-2">
              <span
                className="font-serif italic text-[26px] md:text-[30px] font-medium tracking-wide"
                style={{
                  color: '#C36B3C', // Warm copper tone
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                Less stress, more moments.
              </span>
            </div>

            {/* Stat Pill */}
            <div className="mt-10 inline-flex items-center gap-3 py-2 px-4 rounded-full bg-[#ede6d8]/80 border border-[#e2d8c5] w-fit">
              <span className="w-2 h-2 rounded-full bg-[#1f4f9c] animate-pulse" />
              <span className="text-[12px] text-[#2c3e55] font-normal">
                Curated by independent local specialists worldwide
              </span>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Floating Cards + Video Card ── */}
          <div className="lg:col-span-7 relative">
            {/* Ambient blurred backdrop card for layered floating depth */}
            <div
              className="absolute -top-6 -right-6 w-72 h-72 rounded-3xl bg-[#e8deca]/60 blur-2xl pointer-events-none -z-10"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-8 -left-8 w-80 h-80 rounded-3xl bg-[#e3d7c0]/50 blur-3xl pointer-events-none -z-10"
              aria-hidden="true"
            />

            {/* CENTER HIGHLIGHTED CARD: Video Teaser */}
            <div
              onClick={() => setActiveVideo(true)}
              className="group relative cursor-pointer mb-8 w-full rounded-2xl overflow-hidden bg-white shadow-[0_12px_40px_rgba(20,33,61,0.08)] border border-[#e8dfce] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(20,33,61,0.14)] hover:-translate-y-1"
            >
              <div className="relative h-56 sm:h-64 w-full bg-[#1e2a3f] overflow-hidden">
                {/* Background image preview */}
                <img
                  src="/hero/scene2.webp"
                  alt="VAYA Experience in Swiss Alps"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                />
                {/* Soft gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#14213d]/85 via-[#14213d]/25 to-transparent" />

                {/* Floating Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm shadow-xl flex items-center justify-center text-[#14213d] transition-all duration-300 group-hover:scale-110 group-hover:bg-white">
                    <svg className="w-6 h-6 fill-current translate-x-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                {/* Video Card Tag & Duration */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-medium text-[#14213d]">
                  <span>▶</span>
                  <span>Inside VAYA</span>
                </div>
                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                  <div>
                    <p className="text-[12px] uppercase tracking-wider text-white/70 font-light">Experience</p>
                    <h3 className="text-[18px] sm:text-[20px] font-medium text-white">
                      From Alpine Valleys to Secret Coasts
                    </h3>
                  </div>
                  <span className="text-[12px] text-white/80 font-mono px-2 py-0.5 rounded bg-black/30 backdrop-blur-sm">
                    1:14
                  </span>
                </div>
              </div>
            </div>

            {/* 6 FLOATING WHITE CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CHALLENGES.map((item) => {
                const isHovered = hoveredCard === item.id;
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredCard(item.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className="relative bg-white rounded-2xl p-5 border border-[#eae1d0] shadow-[0_6px_24px_rgba(20,33,61,0.04)] transition-all duration-300 hover:shadow-[0_16px_36px_rgba(20,33,61,0.1)] hover:-translate-y-1.5 flex flex-col justify-between min-h-[175px]"
                  >
                    <div>
                      {/* Top Bar with Icon and Tag */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl" role="img" aria-label={item.title}>
                          {item.icon}
                        </span>
                        <span className="text-[10px] font-medium tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#F7F1E6] text-[#718096]">
                          {item.tag}
                        </span>
                      </div>

                      {/* Card Title */}
                      <h4 className="font-medium text-[16px] text-[#14213d] mb-1.5">
                        {item.title}
                      </h4>

                      {/* Card Content: Swaps smoothly on hover */}
                      <p className="text-[13px] text-[#556377] leading-relaxed transition-opacity duration-200">
                        {isHovered ? item.vayaFix : item.problem}
                      </p>
                    </div>

                    {/* Bottom Status / Fix Indicator */}
                    <div className="mt-3 pt-3 border-t border-[#f0e8dc] flex items-center justify-between">
                      <span
                        className={`text-[11px] font-medium transition-colors duration-200 ${
                          isHovered ? 'text-[#1f4f9c]' : 'text-[#8c9ba5]'
                        }`}
                      >
                        {isHovered ? '✦ VAYA Solution' : 'Hover to see solution'}
                      </span>
                      <span
                        className={`text-[12px] transition-transform duration-200 ${
                          isHovered ? 'translate-x-1 text-[#1f4f9c]' : 'text-[#b0bcc6]'
                        }`}
                      >
                        →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── POPUP VIDEO MODAL ── */}
      {activeVideo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/60 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setActiveVideo(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#14213d] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setActiveVideo(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
              aria-label="Close video"
            >
              ✕
            </button>

            {/* Video Player */}
            <div className="relative aspect-video w-full bg-black">
              <video
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                poster="/hero/scene2.webp"
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-[#0f1a30] flex items-center justify-between text-white">
              <div>
                <h4 className="text-[16px] font-medium">Why Travelers Need VAYA</h4>
                <p className="text-[12px] text-white/60">A cinematic look at frictionless exploration</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(false)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-[13px] font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
