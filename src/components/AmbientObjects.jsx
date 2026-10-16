'use client';

import React from 'react';

export default function AmbientObjects({ visible = false, isMobile = false }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none z-10 transition-opacity duration-1000 ease-out select-none ${
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
            transform: translate3d(50vw, -15px, 0);
          }
          100% {
            transform: translate3d(-25vw, -5px, 0);
          }
        }

        @keyframes wingFlapA {
          0%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.45);
          }
        }

        @keyframes wingFlapB {
          0%, 100% {
            transform: scaleY(0.5);
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
            transform: translate3d(-3vw, -2.5vh, 0) rotate(1.8deg);
          }
          100% {
            transform: translate3d(-6vw, -5vh, 0) rotate(-1.5deg);
          }
        }

        @keyframes balloonFloatFar {
          0% {
            transform: translate3d(0, 0, 0) rotate(1deg);
          }
          50% {
            transform: translate3d(-2vw, -1.8vh, 0) rotate(-1.2deg);
          }
          100% {
            transform: translate3d(-4vw, -3.5vh, 0) rotate(1deg);
          }
        }
      `}</style>

      {/* ── 1. BIRDS V-FLOCK (Upper Sky Band: Y ~14-26%, right to left drift ~40s) ── */}
      <div
        className="absolute top-[15%] left-0 w-48 h-28 pointer-events-none will-change-transform"
        style={{
          animation: 'flockFly 42s linear infinite',
        }}
      >
        {/* Bird 1: Lead Bird */}
        <div
          className="absolute left-[36px] top-[14px] w-[24px] h-[12px] opacity-60"
          style={{ animation: 'wingFlapA 0.5s ease-in-out infinite' }}
        >
          <svg viewBox="0 0 32 14" fill="none" stroke="#2a3550" strokeWidth="2.4" strokeLinecap="round">
            <path d="M2,10 Q8,2 16,10 Q24,2 30,10" />
          </svg>
        </div>

        {/* Bird 2: Wing Right */}
        <div
          className="absolute left-[64px] top-[26px] w-[20px] h-[10px] opacity-55"
          style={{ animation: 'wingFlapB 0.52s ease-in-out infinite 0.1s' }}
        >
          <svg viewBox="0 0 32 14" fill="none" stroke="#2a3550" strokeWidth="2.2" strokeLinecap="round">
            <path d="M2,10 Q8,2 16,10 Q24,2 30,10" />
          </svg>
        </div>

        {/* Bird 3: Wing Left */}
        <div
          className="absolute left-[12px] top-[30px] w-[20px] h-[10px] opacity-55"
          style={{ animation: 'wingFlapA 0.48s ease-in-out infinite 0.2s' }}
        >
          <svg viewBox="0 0 32 14" fill="none" stroke="#2a3550" strokeWidth="2.2" strokeLinecap="round">
            <path d="M2,10 Q8,2 16,10 Q24,2 30,10" />
          </svg>
        </div>

        {!isMobile && (
          <>
            {/* Bird 4: Trail Right */}
            <div
              className="absolute left-[88px] top-[40px] w-[17px] h-[9px] opacity-50"
              style={{ animation: 'wingFlapB 0.54s ease-in-out infinite 0.15s' }}
            >
              <svg viewBox="0 0 32 14" fill="none" stroke="#2a3550" strokeWidth="2.0" strokeLinecap="round">
                <path d="M2,10 Q8,2 16,10 Q24,2 30,10" />
              </svg>
            </div>

            {/* Bird 5: Trail Left */}
            <div
              className="absolute left-[-8px] top-[46px] w-[16px] h-[8px] opacity-50"
              style={{ animation: 'wingFlapA 0.46s ease-in-out infinite 0.25s' }}
            >
              <svg viewBox="0 0 32 14" fill="none" stroke="#2a3550" strokeWidth="2.0" strokeLinecap="round">
                <path d="M2,10 Q8,2 16,10 Q24,2 30,10" />
              </svg>
            </div>
          </>
        )}
      </div>

      {/* ── 2. HOT AIR BALLOONS (Upper Right Sky Band: X ~72-82%, Y ~22-32%) ── */}
      {/* Distant Smaller Balloon (Desktop only) */}
      {!isMobile && (
        <div
          className="absolute right-[24%] top-[19%] w-[3.2vw] max-w-[42px] min-w-[28px] opacity-50 will-change-transform"
          style={{
            animation: 'balloonFloatFar 60s ease-in-out infinite alternate',
          }}
        >
          <svg viewBox="0 0 80 115" fill="none" className="w-full h-auto drop-shadow-sm">
            {/* Balloon envelope */}
            <path
              d="M40 8 C18 8, 8 30, 14 58 C18 74, 30 90, 36 94 L44 94 C50 90, 62 74, 66 58 C72 30, 62 8, 40 8 Z"
              fill="#c87a55"
              opacity="0.85"
            />
            <path
              d="M40 8 C28 8, 22 30, 26 58 C29 74, 36 90, 40 94 C44 90, 51 74, 54 58 C58 30, 52 8, 40 8 Z"
              fill="#e5caa8"
              opacity="0.9"
            />
            {/* Ropes & Basket */}
            <line x1="36" y1="94" x2="37" y2="103" stroke="#5a3d2e" strokeWidth="1.2" />
            <line x1="44" y1="94" x2="43" y2="103" stroke="#5a3d2e" strokeWidth="1.2" />
            <rect x="36" y="103" width="8" height="7" rx="1.5" fill="#5a3d2e" />
          </svg>
        </div>
      )}

      {/* Main Hot Air Balloon (Haze-tinted, drifting gently up & left ~70s) */}
      <div
        className="absolute right-[14%] top-[24%] w-[clamp(48px,6vw,84px)] md:w-[5.8vw] opacity-90 will-change-transform"
        style={{
          animation: 'balloonFloat 70s ease-in-out infinite alternate',
        }}
      >
        <svg viewBox="0 0 80 115" fill="none" className="w-full h-auto drop-shadow-md">
          {/* Main envelope */}
          <path
            d="M40 6 C16 6, 4 30, 11 60 C16 78, 29 95, 36 100 L44 100 C51 95, 64 78, 69 60 C76 30, 64 6, 40 6 Z"
            fill="#d36442"
          />
          {/* Inner stripes */}
          <path
            d="M40 6 C26 6, 18 30, 23 60 C27 78, 35 95, 38 100 L42 100 C45 95, 53 78, 57 60 C62 30, 54 6, 40 6 Z"
            fill="#f7e1b5"
          />
          <path
            d="M40 6 C33 6, 29 30, 32 60 C34 78, 38 95, 39.5 100 L40.5 100 C42 95, 46 78, 48 60 C51 30, 47 6, 40 6 Z"
            fill="#1f4f9c"
          />
          {/* Burner glow */}
          <ellipse cx="40" cy="99" rx="3" ry="1.5" fill="#ffb443" />
          {/* Ropes & Basket */}
          <line x1="36" y1="100" x2="36.5" y2="108" stroke="#3d2a1f" strokeWidth="1.2" />
          <line x1="44" y1="100" x2="43.5" y2="108" stroke="#3d2a1f" strokeWidth="1.2" />
          <rect x="35" y="108" width="10" height="8" rx="2" fill="#7d5337" stroke="#4a3020" strokeWidth="0.8" />
        </svg>
      </div>
    </div>
  );
}
