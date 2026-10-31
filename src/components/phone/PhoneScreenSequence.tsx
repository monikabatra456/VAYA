'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PhoneScreenSequenceProps {
  className?: string;
  style?: React.CSSProperties;
  isActive?: boolean;
  initialTopic?: string;
}

// 7 Hourly slots for crowd forecast
const FORECAST_BARS = [
  { label: '7 AM', height: 22, level: 'low', crowd: '18%' },
  { label: '9 AM', height: 35, level: 'low', crowd: '32%' },
  { label: '11 AM', height: 68, level: 'medium', crowd: '65%' },
  { label: '1 PM', height: 92, level: 'peak', crowd: '94%', isCurrent: true },
  { label: '3 PM', height: 86, level: 'peak', crowd: '88%' },
  { label: '5 PM', height: 58, level: 'medium', crowd: '54%' },
  { label: '7 PM', height: 30, level: 'low', crowd: '26%' },
];

/**
 * PhoneScreenSequence – Sharp interactive HTML/CSS/Framer Motion app demonstration.
 * 
 * Sequence:
 * 1. VAYA logo on brand background for ~1.2s (scale and fade in)
 * 2. Transition into app: type "Jaipur" into "Where to next?" with typing animation, results appear
 * 3. Crowd forecast bars animate up, and crowd alert card slides in:
 *    "Very crowded now, best time 7-9 AM"
 * 4. Loop smoothly without any cursor or fake finger overlay.
 */
export default function PhoneScreenSequence({
  className = '',
  style = {},
  isActive = true,
}: PhoneScreenSequenceProps) {
  // Loop cycle key – increments every loop to cleanly replay the animation sequence
  const [cycle, setCycle] = useState(0);

  // Animation timeline phase flags
  const [showLogo, setShowLogo] = useState(true);
  const [typedText, setTypedText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showBars, setShowBars] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    // Reset all states at beginning of each cycle
    setShowLogo(true);
    setTypedText('');
    setShowResults(false);
    setShowBars(false);
    setShowAlert(false);
    setIsFadingOut(false);

    const fullWord = 'Jaipur';
    const timeouts: NodeJS.Timeout[] = [];

    // Timeline:
    // 0ms: VAYA logo on brand background scales and fades in
    // 1200ms: Transition from brand background into the app
    timeouts.push(
      setTimeout(() => {
        setShowLogo(false);
      }, 1250)
    );

    // 1700ms - 2450ms: Type "Jaipur" into "Where to next?"
    for (let i = 1; i <= fullWord.length; i++) {
      timeouts.push(
        setTimeout(() => {
          setTypedText(fullWord.slice(0, i));
        }, 1700 + i * 125)
      );
    }

    // 2700ms: Search results for Jaipur appear
    timeouts.push(
      setTimeout(() => {
        setShowResults(true);
      }, 2700)
    );

    // 3700ms: Crowd forecast bars animate up
    timeouts.push(
      setTimeout(() => {
        setShowBars(true);
      }, 3700)
    );

    // 4700ms: Crowd alert card slides in ("Very crowded now, best time 7-9 AM")
    timeouts.push(
      setTimeout(() => {
        setShowAlert(true);
      }, 4700)
    );

    // 9400ms: Smooth fade-out before seamless restart
    timeouts.push(
      setTimeout(() => {
        setIsFadingOut(true);
      }, 9400)
    );

    // 10000ms: Restart cycle smoothly
    timeouts.push(
      setTimeout(() => {
        setCycle((c) => c + 1);
      }, 10000)
    );

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [cycle, isActive]);

  return (
    <div
      key={cycle}
      className={`vaya-phone-screen-root ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#090D16',
        color: '#FFFFFF',
        fontFamily: "var(--font-outfit), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: 'hidden',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {/* ── Fixed Phone Top Status Bar (9:41, 5G, Battery) ── */}
      <div
        style={{
          height: '42px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          fontWeight: 600,
          color: '#E2E8F0',
          zIndex: 40,
          flexShrink: 0,
        }}
      >
        <span style={{ letterSpacing: '0.02em', fontWeight: 700 }}>9:41</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Cellular Signal (4 bars) */}
          <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
            <rect x="0" y="7.5" width="2.2" height="3.5" rx="0.6" />
            <rect x="4" y="5" width="2.2" height="6" rx="0.6" />
            <rect x="8" y="2.5" width="2.2" height="8.5" rx="0.6" />
            <rect x="12" y="0" width="2.2" height="11" rx="0.6" />
          </svg>
          {/* 5G label */}
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em' }}>5G</span>
          {/* Battery Icon */}
          <svg width="22" height="11" viewBox="0 0 22 11" fill="currentColor">
            <rect x="0.7" y="0.7" width="18" height="9.6" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <rect x="2.5" y="2.5" width="12" height="6" rx="1.5" />
            <path d="M20.2 4v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* ── (1) VAYA LOGO INTRO OVERLAY (~1.2s, Scale & Fade In) ── */}
      <AnimatePresence>
        {showLogo && (
          <motion.div
            key="vaya-intro-splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.06, filter: 'blur(3px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              background: 'radial-gradient(ellipse at 50% 45%, #18233C 0%, #070B14 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              padding: '24px',
            }}
          >
            {/* Ambient Warm Golden Glow behind Logo */}
            <div
              style={{
                position: 'absolute',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(217, 130, 43, 0.28) 0%, transparent 70%)',
                filter: 'blur(20px)',
                pointerEvents: 'none',
              }}
            />

            {/* VAYA Animated Brand Emblem */}
            <motion.div
              initial={{ scale: 0.78, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'relative',
                width: '74px',
                height: '74px',
                borderRadius: '22px',
                background: 'linear-gradient(135deg, #E09545 0%, #C4782A 50%, #9B5718 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 36px -6px rgba(196, 120, 42, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {/* VAYA Symbol image with SVG Monogram fallback */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/meet/vaya-symbol.png"
                alt="VAYA"
                style={{
                  width: '44px',
                  height: '44px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  fontSize: '32px',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  letterSpacing: '-0.03em',
                  textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}
              >
                V
              </span>
            </motion.div>

            {/* VAYA Wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
              style={{
                fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
                fontSize: '26px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                color: '#FFFFFF',
                textIndent: '0.22em',
              }}
            >
              VAYA
            </motion.div>

            {/* Brand Tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#E09545',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              Stand In. Step Out.
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── (2 & 3) MAIN APP INTERFACE SCREEN ── */}
      <motion.div
        animate={{
          opacity: isFadingOut ? 0 : 1,
          scale: isFadingOut ? 0.98 : 1,
        }}
        transition={{ duration: 0.4 }}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '0 16px 14px',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
        }}
      >
        {/* App Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 0 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #E09545 0%, #C4782A 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '13px',
                color: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(196, 120, 42, 0.4)',
              }}
            >
              V
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.04em', color: '#F8FAFC' }}>
              VAYA
            </span>
          </div>

          {/* Live AI Status Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 9px',
              borderRadius: '999px',
              background: 'rgba(196, 120, 42, 0.14)',
              border: '1px solid rgba(196, 120, 42, 0.3)',
              fontSize: '10px',
              fontWeight: 700,
              color: '#F59E0B',
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 6px #10B981',
              }}
            />
            AI RADAR
          </div>
        </div>

        {/* ── SEARCH INPUT: "Where to next?" with typing "Jaipur" ── */}
        <div
          style={{
            position: 'relative',
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%)',
            border: typedText ? '1px solid rgba(224, 149, 69, 0.55)' : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '11px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: typedText ? '0 0 18px rgba(224, 149, 69, 0.15)' : '0 4px 12px rgba(0,0,0,0.2)',
            transition: 'border 0.3s ease, box-shadow 0.3s ease',
          }}
        >
          {/* Search Icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E09545" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          {/* Typing Container */}
          <div style={{ flex: 1, fontSize: '13.5px', fontWeight: typedText ? 600 : 400, color: typedText ? '#FFFFFF' : '#94A3B8' }}>
            {typedText ? (
              <span style={{ color: '#FFFFFF', letterSpacing: '0.01em' }}>{typedText}</span>
            ) : (
              <span style={{ color: '#64748B' }}>Where to next?</span>
            )}
            {/* Blinking Cursor */}
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '14px',
                backgroundColor: '#E09545',
                marginLeft: '2px',
                verticalAlign: '-1px',
                animation: 'vayaCursorBlink 0.8s infinite',
              }}
            />
          </div>

          {/* Location Badge */}
          {typedText && (
            <span
              style={{
                fontSize: '10px',
                padding: '2px 7px',
                borderRadius: '6px',
                background: 'rgba(224, 149, 69, 0.2)',
                color: '#FCD34D',
                fontWeight: 700,
              }}
            >
              India
            </span>
          )}
        </div>

        {/* ── SEARCH RESULT CARD: Jaipur, Rajasthan ── */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              key="jaipur-search-result"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{
                marginTop: '10px',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px -4px rgba(0,0,0,0.35)',
              }}
            >
              <div style={{ display: 'flex', padding: '10px 12px', gap: '12px', alignItems: 'center' }}>
                {/* Destination Thumbnail */}
                <div
                  style={{
                    position: 'relative',
                    width: '62px',
                    height: '62px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: '#1E293B',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/wonder/cards/hawa.webp"
                    alt="Jaipur - Hawa Mahal"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      // Fallback to local destination asset if webp path changes
                      e.currentTarget.src = '/assets/destinations/hawa-mahal.png';
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.5) 100%)',
                    }}
                  />
                </div>

                {/* Destination Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                      Jaipur
                    </h3>
                    <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 700 }}>
                      ★ 4.9
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '2px', fontWeight: 500 }}>
                    The Pink City • Rajasthan
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 600,
                        color: '#38BDF8',
                        background: 'rgba(56, 189, 248, 0.15)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      Hawa Mahal
                    </span>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 600,
                        color: '#E09545',
                        background: 'rgba(224, 149, 69, 0.15)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      Amber Fort
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CROWD FORECAST BARS SECTION ── */}
        <AnimatePresence>
          {showBars && (
            <motion.div
              key="crowd-forecast-section"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{
                marginTop: '10px',
                background: 'linear-gradient(145deg, #131B2E 0%, #0D1322 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Forecast Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#F1F5F9' }}>
                    Crowd Forecast
                  </div>
                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                    Hourly congestion pattern
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#EF4444',
                    background: 'rgba(239, 68, 68, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: '#EF4444',
                      boxShadow: '0 0 6px #EF4444',
                    }}
                  />
                  PEAK HOUR
                </div>
              </div>

              {/* 7 Vertical Animated Bars */}
              <div
                style={{
                  height: '82px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  padding: '6px 2px 2px',
                  gap: '5px',
                }}
              >
                {FORECAST_BARS.map((bar, index) => {
                  const isCurrent = !!bar.isCurrent;
                  // Color gradient according to congestion level
                  const barGradient =
                    bar.level === 'peak'
                      ? 'linear-gradient(180deg, #F87171 0%, #EF4444 60%, #B91C1C 100%)'
                      : bar.level === 'medium'
                      ? 'linear-gradient(180deg, #FBBF24 0%, #F59E0B 70%, #D97706 100%)'
                      : 'linear-gradient(180deg, #34D399 0%, #10B981 70%, #059669 100%)';

                  return (
                    <div
                      key={bar.label}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: '100%',
                        position: 'relative',
                      }}
                    >
                      {/* Active "NOW" indicator above peak bar */}
                      {isCurrent && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.45 }}
                          style={{
                            fontSize: '8px',
                            fontWeight: 800,
                            color: '#FFFFFF',
                            background: '#EF4444',
                            padding: '1px 4px',
                            borderRadius: '4px',
                            marginBottom: '3px',
                            letterSpacing: '0.04em',
                            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.5)',
                          }}
                        >
                          NOW
                        </motion.span>
                      )}

                      {/* Bar fill with spring animation from height: 0 */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${bar.height}%` }}
                        transition={{
                          type: 'spring',
                          stiffness: 140,
                          damping: 15,
                          delay: 0.15 + index * 0.06,
                        }}
                        style={{
                          width: '100%',
                          maxWidth: '22px',
                          borderRadius: '6px 6px 2px 2px',
                          background: barGradient,
                          boxShadow: isCurrent ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none',
                        }}
                      />

                      {/* Label underneath */}
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: isCurrent ? 700 : 500,
                          color: isCurrent ? '#FFFFFF' : '#94A3B8',
                          marginTop: '5px',
                        }}
                      >
                        {bar.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CROWD ALERT CARD ("Very crowded now, best time 7-9 AM") ── */}
        <AnimatePresence>
          {showAlert && (
            <motion.div
              key="crowd-alert-card"
              initial={{ opacity: 0, y: 22, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 220,
                damping: 20,
              }}
              style={{
                marginTop: '10px',
                padding: '12px 14px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(185, 28, 28, 0.24) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                borderRadius: '16px',
                boxShadow: '0 10px 28px -6px rgba(239, 68, 68, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Alert Title with Warning Beacon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.25)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FCA5A5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 700, color: '#FEE2E2', lineHeight: 1.3 }}>
                  Very crowded now, best time 7-9 AM
                </div>
              </div>

              {/* Sub-details & Smart Optimal Timing Window */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 700 }}>Best window:</span>
                  <span style={{ fontSize: '10.5px', color: '#F1F5F9', fontWeight: 600 }}>7:00 – 9:00 AM</span>
                </div>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: '#34D399',
                    background: 'rgba(16, 185, 129, 0.2)',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  -75% wait
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Fixed Phone Bottom Home Indicator Bar ── */}
      <div
        style={{
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 40,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '110px',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
            borderRadius: '999px',
          }}
        />
      </div>

      {/* Cursor Blink CSS */}
      <style jsx global>{`
        @keyframes vayaCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
