'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MeetPhoneScreenProps {
  activeStep: number; // 0: Smarter Travel, 1: Data-Driven Decisions, 2: Better Experiences
  isSectionInView: boolean;
  onWaitlist?: () => void;
  onVideoTimeUpdate?: (step: number, currentTime: number) => void;
}

const BAR_DATA = [
  { day: 'Mon', height: 26, isWeekend: false },
  { day: 'Tue', height: 20, isWeekend: false },
  { day: 'Wed', height: 35, isWeekend: false },
  { day: 'Thu', height: 28, isWeekend: false },
  { day: 'Fri', height: 68, isWeekend: false },
  { day: 'Sat', height: 96, isWeekend: true },
  { day: 'Sun', height: 82, isWeekend: true },
];

export default function MeetPhoneScreen({
  activeStep,
  isSectionInView,
  onWaitlist,
  onVideoTimeUpdate,
}: MeetPhoneScreenProps) {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  // Logo intro: 1.2s scale + fade on dark app background
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const [showLogoIntro, setShowLogoIntro] = useState(true);
  const [logoIntroFading, setLogoIntroFading] = useState(false);

  // Step 3 animation triggers
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [alertCardVisible, setAlertCardVisible] = useState(false);

  // Initial 1.2s VAYA logo intro: scale + fade on brand app background
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setLogoIntroFading(true);
    }, 1200);

    const hideTimer = setTimeout(() => {
      setShowLogoIntro(false);
    }, 1500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Video playback management tied to activeStep and intro state
  useEffect(() => {
    if (!isSectionInView || (showLogoIntro && !logoIntroFading)) {
      video1Ref.current?.pause();
      video2Ref.current?.pause();
      return;
    }

    if (activeStep === 0) {
      if (video1Ref.current) {
        video1Ref.current.currentTime = 0;
        video1Ref.current.play().catch(() => {});
      }
      video2Ref.current?.pause();
    } else if (activeStep === 1) {
      if (video2Ref.current) {
        video2Ref.current.currentTime = 0;
        video2Ref.current.play().catch(() => {});
      }
      video1Ref.current?.pause();
    } else {
      video1Ref.current?.pause();
      video2Ref.current?.pause();
    }
  }, [activeStep, isSectionInView, showLogoIntro, logoIntroFading]);

  // Step 3 bar and card entrance animation
  useEffect(() => {
    if (activeStep === 2) {
      // Trigger bars growing
      const t1 = setTimeout(() => setBarsAnimated(true), 100);
      // Trigger card sliding in
      const t2 = setTimeout(() => setAlertCardVisible(true), 320);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setBarsAnimated(false);
      setAlertCardVisible(false);
    }
  }, [activeStep]);

  return (
    <div
      className="mv-phone-screen-root"
      style={{
        containerType: 'inline-size',
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 'inherit',
        backgroundColor: '#EEF2FA', // Sampled from video edge pixels
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Fixed HTML Status Bar ────────────────────────────────────────── */}
      <div
        className="mv-screen-status-bar"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '7.5cqw',
          zIndex: 35,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.2cqw 6.5cqw 0',
          backgroundColor: '#FFFFFF',
          color: '#0f172a',
        }}
      >
        <span style={{ fontSize: '3.1cqw', fontWeight: 600, letterSpacing: '-0.01em' }}>
          9:41
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.6cqw' }} aria-hidden="true">
          {/* Signal */}
          <svg width="3.2cqw" height="2.6cqw" viewBox="0 0 14 11" fill="currentColor">
            <rect x="0" y="7" width="2" height="4" rx="0.5" />
            <rect x="4" y="5" width="2" height="6" rx="0.5" />
            <rect x="8" y="2.5" width="2" height="8.5" rx="0.5" />
            <rect x="12" y="0" width="2" height="11" rx="0.5" />
          </svg>
          {/* WiFi */}
          <svg width="3.2cqw" height="2.6cqw" viewBox="0 0 13 10" fill="currentColor">
            <path d="M6.5 7.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-3.5-3a5.5 5.5 0 0 1 7 0 .8.8 0 0 1-.2 1.1.8.8 0 0 1-1.1-.2 3.9 3.9 0 0 0-4.4 0 .8.8 0 0 1-1.1.2.8.8 0 0 1-.2-1.1zm-3-3a9.5 9.5 0 0 1 13 0 .8.8 0 0 1-.2 1.1.8.8 0 0 1-1.1-.2 7.9 7.9 0 0 0-10.4 0 .8.8 0 0 1-1.1.2.8.8 0 0 1-.2-1.1z" />
          </svg>
          {/* Battery */}
          <svg width="4.4cqw" height="2.3cqw" viewBox="0 0 22 11" fill="currentColor">
            <rect x="0" y="0" width="19" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <rect x="2" y="2" width="13" height="7" rx="1.5" />
            <path d="M20.5 4v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* ── STEP 1: Smarter Travel (phone-plan-trip.mp4) ──────────────────── */}
      <div
        className="mv-screen-step"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          opacity: activeStep === 0 ? 1 : 0,
          transition: 'opacity 300ms ease-in-out',
          pointerEvents: activeStep === 0 ? 'auto' : 'none',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#EEF2FA',
        }}
      >
        {/* Top inset (~46px at 1440 width) filled with video's background colour */}
        <div style={{ height: '16.8cqw', backgroundColor: '#FFFFFF', flexShrink: 0 }} />
        {/* Video container scaled 1.045 to clip baked bottom corners */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '174.5cqw',
            overflow: 'hidden',
            flexShrink: 0,
            backgroundColor: '#FFFFFF',
          }}
        >
          <video
            ref={video1Ref}
            src="/videos/phone-plan-trip.mp4"
            poster="/videos/phone-plan-trip-poster.jpg"
            muted
            playsInline
            preload="auto"
            loop
            onTimeUpdate={(e) => onVideoTimeUpdate?.(0, e.currentTarget.currentTime)}
            style={{
              width: '100%',
              display: 'block',
              transform: 'scale(1.045)',
              transformOrigin: 'top center',
            }}
          />
        </div>
        {/* Leftover space at bottom filled with #EEF2FA */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#EEF2FA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: '2cqw',
          }}
        >
          {/* Home indicator */}
          <div
            style={{
              width: '32cqw',
              height: '1.2cqw',
              borderRadius: '1cqw',
              backgroundColor: '#0f172a',
              opacity: 0.8,
            }}
          />
        </div>
      </div>

      {/* ── STEP 2: Data-Driven Decisions (phone-itinerary.mp4) ───────────── */}
      <div
        className="mv-screen-step"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 11,
          opacity: activeStep === 1 ? 1 : 0,
          transition: 'opacity 300ms ease-in-out',
          pointerEvents: activeStep === 1 ? 'auto' : 'none',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#EEF2FA',
        }}
      >
        {/* Top inset (~46px at 1440 width) filled with video's background colour */}
        <div style={{ height: '16.8cqw', backgroundColor: '#FFFFFF', flexShrink: 0 }} />
        {/* Video container scaled 1.045 to clip baked bottom corners */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '174.5cqw',
            overflow: 'hidden',
            flexShrink: 0,
            backgroundColor: '#FFFFFF',
          }}
        >
          <video
            ref={video2Ref}
            src="/videos/phone-itinerary.mp4"
            poster="/videos/phone-itinerary-poster.jpg"
            muted
            playsInline
            preload="auto"
            loop
            onTimeUpdate={(e) => onVideoTimeUpdate?.(1, e.currentTarget.currentTime)}
            style={{
              width: '100%',
              display: 'block',
              transform: 'scale(1.045)',
              transformOrigin: 'top center',
            }}
          />
        </div>
        {/* Leftover space at bottom filled with #EEF2FA */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#EEF2FA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: '2cqw',
          }}
        >
          {/* Home indicator */}
          <div
            style={{
              width: '32cqw',
              height: '1.2cqw',
              borderRadius: '1cqw',
              backgroundColor: '#0f172a',
              opacity: 0.8,
            }}
          />
        </div>
      </div>

      {/* ── STEP 3: Better Experiences (Rebuilt HTML/CSS Crowd Forecast) ─── */}
      <div
        className="mv-screen-step"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 12,
          opacity: activeStep === 2 ? 1 : 0,
          transition: 'opacity 300ms ease-in-out',
          pointerEvents: activeStep === 2 ? 'auto' : 'none',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#EEF2FA',
          overflowY: 'hidden',
        }}
      >
        {/* Top inset (~46px at 1440 width) filled with video's background colour */}
        <div style={{ height: '16.8cqw', backgroundColor: '#FFFFFF', flexShrink: 0 }} />

        {/* Inner App Content */}
        <div
          style={{
            padding: '3cqw 4cqw',
            display: 'flex',
            flexDirection: 'column',
            gap: '3cqw',
            flex: 1,
          }}
        >
          {/* App Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 1cqw',
            }}
          >
            <div
              style={{
                width: '6cqw',
                height: '6cqw',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '1.2cqw',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: '100%', height: '0.5cqw', backgroundColor: '#0f172a', borderRadius: '1px' }} />
              <div style={{ width: '75%', height: '0.5cqw', backgroundColor: '#0f172a', borderRadius: '1px' }} />
              <div style={{ width: '50%', height: '0.5cqw', backgroundColor: '#0f172a', borderRadius: '1px' }} />
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/meet/vaya-symbol.png"
              alt="VAYA"
              style={{ height: '5.2cqw', width: 'auto' }}
              draggable={false}
            />

            <div
              style={{
                width: '6cqw',
                height: '6cqw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f172a',
              }}
            >
              <svg width="5cqw" height="5cqw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
          </div>

          {/* Where to next? Search Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '3.5cqw',
              padding: '3cqw 3.5cqw',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div
              style={{
                fontSize: '2.8cqw',
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '1.5cqw',
              }}
            >
              Where to next?
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#f1f5f9',
                borderRadius: '2.5cqw',
                padding: '2.2cqw 3cqw',
                gap: '2.2cqw',
              }}
            >
              <svg width="4.2cqw" height="4.2cqw" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span style={{ fontSize: '3.4cqw', fontWeight: 500, color: '#0f172a' }}>
                Jaipur, India
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '2.8cqw',
                  color: '#2563eb',
                  fontWeight: 600,
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  padding: '0.6cqw 1.8cqw',
                  borderRadius: '1.5cqw',
                }}
              >
                4 Days
              </span>
            </div>
          </div>

          {/* Crowd Forecast Card (Properly filled, no empty gaps) */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '4cqw',
              padding: '3.6cqw 3.8cqw',
              boxShadow: '0 3px 12px rgba(15, 23, 42, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '3cqw',
            }}
          >
            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '4.2cqw', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  Crowd forecast
                </div>
                <div style={{ fontSize: '3cqw', color: '#64748b', marginTop: '0.6cqw' }}>
                  Expected airport crowds · Jaipur (JAI)
                </div>
              </div>
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a',
                  fontSize: '2.6cqw',
                  fontWeight: 600,
                  padding: '0.8cqw 2cqw',
                  borderRadius: '1.5cqw',
                  border: '1px solid #bbf7d0',
                }}
              >
                Optimal Week
              </div>
            </div>

            {/* 7 Vertical Day Bars */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: '24cqw',
                padding: '2cqw 1.5cqw 0',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '2.2cqw',
              }}
            >
              {BAR_DATA.map((bar, idx) => {
                const targetHeight = barsAnimated ? `${bar.height}%` : '6%';
                return (
                  <div
                    key={bar.day}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1.4cqw',
                      height: '100%',
                      justifyContent: 'flex-end',
                      width: '10cqw',
                    }}
                  >
                    {/* Bar track and fill */}
                    <div
                      style={{
                        position: 'relative',
                        width: '4.5cqw',
                        height: '18cqw',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '2.5cqw',
                        display: 'flex',
                        alignItems: 'flex-end',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: targetHeight,
                          borderRadius: '2.5cqw',
                          background: bar.isWeekend
                            ? 'linear-gradient(180deg, #1d4ed8 0%, #2563eb 100%)'
                            : 'linear-gradient(180deg, #60a5fa 0%, #93c5fd 100%)',
                          boxShadow: bar.isWeekend ? '0 2px 6px rgba(37, 99, 235, 0.35)' : 'none',
                          transition: `height 650ms cubic-bezier(0.34, 1.3, 0.64, 1) ${idx * 45}ms`,
                        }}
                      />
                    </div>
                    {/* Day label */}
                    <span
                      style={{
                        fontSize: '2.8cqw',
                        fontWeight: bar.isWeekend ? 700 : 500,
                        color: bar.isWeekend ? '#1d4ed8' : '#64748b',
                      }}
                    >
                      {bar.day}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* "Lower crowds expected" Sliding Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2.5cqw',
                padding: '2.6cqw 3cqw',
                backgroundColor: '#f8fafd',
                borderRadius: '3cqw',
                border: '1px solid #e2e8f0',
                transform: alertCardVisible ? 'translateY(0)' : 'translateY(16px)',
                opacity: alertCardVisible ? 1 : 0,
                transition: 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1), opacity 450ms ease-out',
              }}
            >
              <div
                style={{
                  width: '7cqw',
                  height: '7cqw',
                  borderRadius: '50%',
                  backgroundColor: '#dbeafe',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="4.2cqw" height="4.2cqw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '3.3cqw', fontWeight: 600, color: '#0f172a' }}>
                  Lower crowds expected
                </div>
                <div style={{ fontSize: '2.7cqw', color: '#64748b', marginTop: '0.4cqw' }}>
                  Tue, Thu · 6:00 AM – 10:00 AM
                </div>
              </div>

              <svg width="3.8cqw" height="3.8cqw" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            {/* "Plan my trip" Button */}
            <button
              type="button"
              onClick={onWaitlist}
              style={{
                width: '100%',
                padding: '3cqw 0',
                borderRadius: '3cqw',
                background: 'linear-gradient(135deg, #14213d 0%, #1e3a8a 100%)',
                color: '#ffffff',
                fontSize: '3.4cqw',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5cqw',
                boxShadow: '0 4px 12px rgba(20, 33, 61, 0.25)',
                transition: 'transform 180ms ease, box-shadow 180ms ease',
              }}
            >
              <span>Plan my trip</span>
              <span style={{ fontSize: '3.6cqw' }}>&rarr;</span>
            </button>
          </div>
        </div>

        {/* Home Indicator */}
        <div
          style={{
            paddingBottom: '2.5cqw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 'auto',
          }}
        >
          <div
            style={{
              width: '32cqw',
              height: '1.2cqw',
              borderRadius: '1cqw',
              backgroundColor: '#0f172a',
              opacity: 0.8,
            }}
          />
        </div>
      </div>

      {/* ── 1.2s VAYA Logo Intro Overlay (Scale + Fade) ───────────────────── */}
      {showLogoIntro && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 45,
            backgroundColor: '#14100c', // Dark app background colour
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: logoIntroFading ? 0 : 1,
            transform: logoIntroFading ? 'scale(1.04)' : 'scale(1)',
            transition: 'opacity 300ms ease-in-out, transform 300ms ease-in-out',
            pointerEvents: 'none',
          }}
        >
          {/* Subtle golden radial glow */}
          <div
            style={{
              position: 'absolute',
              width: '45cqw',
              height: '45cqw',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(242, 184, 75, 0.25) 0%, transparent 70%)',
              filter: 'blur(12px)',
            }}
          />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/meet/vaya-symbol.png"
            alt="VAYA"
            style={{
              height: '14cqw',
              width: 'auto',
              marginBottom: '3cqw',
              position: 'relative',
              zIndex: 1,
            }}
            draggable={false}
          />
          <span
            style={{
              fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
              fontSize: '5.5cqw',
              fontWeight: 600,
              letterSpacing: '0.35em',
              color: '#ffffff',
              textIndent: '0.35em',
              position: 'relative',
              zIndex: 1,
            }}
          >
            VAYA
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2cqw',
              marginTop: '1.6cqw',
              width: '40cqw',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: '#f2b84b', opacity: 0.8 }} />
            <span
              style={{
                fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
                fontSize: '2.5cqw',
                letterSpacing: '0.14em',
                color: 'rgba(255, 255, 255, 0.85)',
                whiteSpace: 'nowrap',
              }}
            >
              Stand In. Step Out.
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#f2b84b', opacity: 0.8 }} />
          </div>
        </div>
      )}
    </div>
  );
}