'use client';

import React from 'react';

export default function AmbientObjects({ visible = false, isMobile = false }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none z-10 transition-opacity duration-[1500ms] ease-out select-none ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      <style jsx>{`
        @keyframes flockFly {
          0% {
            transform: translate3d(115vw, 0, 0);
          }
          50% {
            transform: translate3d(50vw, -12px, 0);
          }
          100% {
            transform: translate3d(-25vw, -4px, 0);
          }
        }

        @keyframes wingFlapA {
          0%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.48);
          }
        }

        @keyframes wingFlapB {
          0%, 100% {
            transform: scaleY(0.52);
          }
          50% {
            transform: scaleY(1.05);
          }
        }

        @keyframes balloonFloat {
          0% {
            transform: translate3d(0, 0, 0) rotate(-1.5deg);
          }
          50% {
            transform: translate3d(-2.5vw, -2vh, 0) rotate(1.8deg);
          }
          100% {
            transform: translate3d(-5vw, -4vh, 0) rotate(-1.5deg);
          }
        }
      `}</style>

      {/* ── 1. BIRDS: 5 birds in loose V-flock (14-22px, #2a3550, opacity 0.5, Y ~12-28% band) ── */}
      <div
        className="absolute top-[16%] left-0 w-44 h-24 pointer-events-none will-change-transform"
        style={{
          animation: 'flockFly 45s linear infinite',
        }}
      >
        {/* Bird 1: Lead */}
        <div
          className="absolute left-[32px] top-[12px] w-[20px] h-[10px] opacity-50"
          style={{ animation: 'wingFlapA 0.5s ease-in-out infinite' }}
        >
          <svg viewBox="0 0 32 14" fill="none" stroke="#2a3550" strokeWidth="2.2" strokeLinecap="round">
            <path d="M2,10 Q8,2 16,10 Q24,2 30,10" />
          </svg>
        </div>

        {/* Bird 2: Wing Right */}
        <div
          className="absolute left-[56px] top-[22px] w-[18px] h-[9px] opacity-50"
          style={{ animation: 'wingFlapB 0.52s ease-in-out infinite 0.1s' }}
        >
          <svg viewBox="0 0 32 14" fill="none" stroke="#2a3550" strokeWidth="2.0" strokeLinecap="round">
            <path d="M2,10 Q8,2 16,10 Q24,2 30,10" />
          </svg>
        </div>

        {/* Bird 3: Wing Left */}
        <div
          className="absolute left-[10px] top-[24px] w-[17px] h-[9px] opacity-50"
          style={{ animation: 'wingFlapA 0.48s ease-in-out infinite 0.2s' }}
        >
          <svg viewBox="0 0 32 14" fill="none" stroke="#2a3550" strokeWidth="2.0" strokeLinecap="round">
            <path d="M2,10 Q8,2 16,10 Q24,2 30,10" />
          </svg>
        </div>

        {!isMobile && (
          <>
            {/* Bird 4: Trail Right */}
            <div
              className="absolute left-[78px] top-[34px] w-[15px] h-[8px] opacity-45"
              style={{ animation: 'wingFlapB 0.54s ease-in-out infinite 0.15s' }}
            >
              <svg viewBox="0 0 32 14" fill="none" stroke="#2a3550" strokeWidth="1.9" strokeLinecap="round">
                <path d="M2,10 Q8,2 16,10 Q24,2 30,10" />
              </svg>
            </div>

            {/* Bird 5: Trail Left */}
            <div
              className="absolute left-[-6px] top-[38px] w-[14px] h-[7px] opacity-45"
              style={{ animation: 'wingFlapA 0.46s ease-in-out infinite 0.25s' }}
            >
              <svg viewBox="0 0 32 14" fill="none" stroke="#2a3550" strokeWidth="1.9" strokeLinecap="round">
                <path d="M2,10 Q8,2 16,10 Q24,2 30,10" />
              </svg>
            </div>
          </>
        )}
      </div>

      {/* ── 2. HOT AIR BALLOON (~3.5vw desktop, ~8vw mobile, upper-right sky band X 72-80%, Y 24-34%) ── */}
      <div
        className="absolute right-[16%] top-[26%] w-[clamp(40px,3.5vw,56px)] md:w-[3.5vw] opacity-85 will-change-transform"
        style={{
          filter: 'saturate(0.70) drop-shadow(0 2px 6px rgba(0,0,0,0.06))',
          animation: 'balloonFloat 70s ease-in-out infinite alternate',
        }}
      >
        <svg viewBox="0 0 80 115" fill="none" className="w-full h-auto">
          {/* Main envelope */}
          <path
            d="M40 6 C16 6, 4 30, 11 60 C16 78, 29 95, 36 100 L44 100 C51 95, 64 78, 69 60 C76 30, 64 6, 40 6 Z"
            fill="#c46a48"
          />
          {/* Inner stripes */}
          <path
            d="M40 6 C26 6, 18 30, 23 60 C27 78, 35 95, 38 100 L42 100 C45 95, 53 78, 57 60 C62 30, 54 6, 40 6 Z"
            fill="#ebd5b2"
          />
          <path
            d="M40 6 C33 6, 29 30, 32 60 C34 78, 38 95, 39.5 100 L40.5 100 C42 95, 46 78, 48 60 C51 30, 47 6, 40 6 Z"
            fill="#2c4d79"
          />
          {/* Ropes & Basket */}
          <line x1="36" y1="100" x2="36.5" y2="108" stroke="#4a3020" strokeWidth="1.2" />
          <line x1="44" y1="100" x2="43.5" y2="108" stroke="#4a3020" strokeWidth="1.2" />
          <rect x="35" y="108" width="10" height="8" rx="2" fill="#7d5337" stroke="#4a3020" strokeWidth="0.8" />
        </svg>
      </div>
    </div>
  );
}
