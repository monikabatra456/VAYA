'use client';

import React, { forwardRef } from 'react';

interface MeetPhoneScreenProps {
  onWaitlist?: () => void;
  screensRef: React.MutableRefObject<(HTMLDivElement | null)[]>;
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

const MeetPhoneScreen = forwardRef<HTMLDivElement, MeetPhoneScreenProps>(function MeetPhoneScreen(
  { onWaitlist, screensRef },
  ref
) {
  return (
    <div
      ref={ref}
      className="mv-phone-screen-root"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 'inherit',
        backgroundColor: '#F6F8FC',
        userSelect: 'none',
      }}
    >
      {/* ── Fixed iPhone Status Bar (Always crisp at top) ────────────────── */}
      <div
        className="mv-screen-status-bar"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '7.8cqw',
          zIndex: 35,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.4cqw 6.5cqw 0',
          color: '#0f172a',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: '3.1cqw', fontWeight: 600, letterSpacing: '-0.01em' }}>
          9:41
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.6cqw' }} aria-hidden="true">
          {/* Cellular */}
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

      {/* ── SCREEN 0: Plan My Trip (Tall Scrollable Layout) ───────────────── */}
      <div
        ref={(el) => {
          screensRef.current[0] = el;
        }}
        className="mv-tall-screen"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          minHeight: '148%',
          padding: '8.8cqw 4cqw 6cqw',
          display: 'flex',
          flexDirection: 'column',
          gap: '3cqw',
          backgroundColor: '#FFFFFF',
          zIndex: 10,
          willChange: 'transform, opacity',
        }}
      >
        {/* App Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1cqw' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2cqw' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/meet/vaya-symbol.png" alt="VAYA" style={{ height: '4.8cqw', width: 'auto' }} />
            <span style={{ fontSize: '3.6cqw', fontWeight: 700, color: '#0f172a', letterSpacing: '0.04em' }}>VAYA</span>
          </div>
          <span style={{ fontSize: '2.5cqw', fontWeight: 600, color: '#2563eb', backgroundColor: '#eff6ff', padding: '0.8cqw 2cqw', borderRadius: '999px' }}>
            AGENTIC TRIP
          </span>
        </div>

        {/* Hero Title */}
        <div style={{ marginTop: '1cqw' }}>
          <h4 style={{ fontSize: '4.8cqw', fontWeight: 700, color: '#0f172a', lineHeight: 1.15, margin: 0 }}>
            Plan My Trip
          </h4>
          <p style={{ fontSize: '2.8cqw', color: '#64748b', marginTop: '0.8cqw', margin: 0 }}>
            Tell VAYA where and how you want to travel.
          </p>
        </div>

        {/* Input Card */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '3.5cqw',
            padding: '3cqw 3.5cqw',
            display: 'flex',
            flexDirection: 'column',
            gap: '2cqw',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '2cqw' }}>
            <span style={{ fontSize: '3.6cqw' }}>📍</span>
            <div>
              <div style={{ fontSize: '2.4cqw', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Destination</div>
              <div style={{ fontSize: '3.4cqw', fontWeight: 600, color: '#0f172a' }}>Jaipur, Rajasthan</div>
            </div>
          </div>
          <div style={{ height: '1px', backgroundColor: '#E2E8F0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '2.4cqw', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Duration</div>
              <div style={{ fontSize: '3.1cqw', fontWeight: 600, color: '#0f172a' }}>4 Days · Nov 14-18</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.4cqw', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Travelers</div>
              <div style={{ fontSize: '3.1cqw', fontWeight: 600, color: '#0f172a' }}>2 Adults</div>
            </div>
          </div>
        </div>

        {/* Travel Preferences Chips */}
        <div>
          <div style={{ fontSize: '2.6cqw', fontWeight: 600, color: '#64748b', marginBottom: '1.5cqw' }}>Trip Preferences</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.8cqw' }}>
            {['Heritage & Forts', 'Photography', 'Low Crowds', 'Royal Dining'].map((tag, i) => (
              <span
                key={tag}
                style={{
                  fontSize: '2.6cqw',
                  fontWeight: 500,
                  backgroundColor: i === 0 ? '#1e3a8a' : '#F1F5F9',
                  color: i === 0 ? '#ffffff' : '#334155',
                  padding: '1cqw 2.2cqw',
                  borderRadius: '2cqw',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div
          style={{
            background: 'linear-gradient(135deg, #14213d 0%, #1d4ed8 100%)',
            color: '#FFFFFF',
            borderRadius: '3cqw',
            padding: '3cqw 0',
            textAlign: 'center',
            fontSize: '3.3cqw',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5cqw',
            boxShadow: '0 4px 14px rgba(20, 33, 61, 0.25)',
          }}
        >
          <span>Create My Trip</span>
          <span>&rarr;</span>
        </div>

        {/* Lower Highlights preview */}
        <div style={{ marginTop: '1cqw' }}>
          <div style={{ fontSize: '2.6cqw', fontWeight: 600, color: '#64748b', marginBottom: '1.5cqw' }}>Featured Route Stops</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8cqw' }}>
            {[
              { name: 'Amber Palace', note: 'Best morning lighting', time: '08:00 AM' },
              { name: 'Hawa Mahal', note: 'Rear corridor route', time: '11:30 AM' },
              { name: 'Jal Mahal', note: 'Lake sunset vista', time: '05:00 PM' },
            ].map((item) => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '2cqw 2.5cqw', backgroundColor: '#F8FAFC', borderRadius: '2cqw', border: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: '3cqw', fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                  <div style={{ fontSize: '2.3cqw', color: '#64748b' }}>{item.note}</div>
                </div>
                <span style={{ fontSize: '2.5cqw', fontWeight: 600, color: '#2563eb' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SCREEN 1: Creating your Jaipur trip (AI Agent Synthesis) ──────── */}
      <div
        ref={(el) => {
          screensRef.current[1] = el;
        }}
        className="mv-tall-screen"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          minHeight: '148%',
          padding: '8.8cqw 4cqw 6cqw',
          display: 'flex',
          flexDirection: 'column',
          gap: '3cqw',
          backgroundColor: '#FFFFFF',
          zIndex: 11,
          opacity: 0,
          willChange: 'transform, opacity',
        }}
      >
        {/* Status Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1cqw' }}>
          <span style={{ fontSize: '2.5cqw', fontWeight: 600, color: '#16a34a', backgroundColor: '#f0fdf4', padding: '0.8cqw 2cqw', borderRadius: '999px' }}>
            AI AGENT ACTIVE
          </span>
          <span style={{ fontSize: '2.6cqw', color: '#64748b' }}>Processing Step 3 of 4</span>
        </div>

        {/* Pulsing AI Header Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
            borderRadius: '3.8cqw',
            padding: '3.6cqw 3.5cqw',
            color: '#FFFFFF',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ fontSize: '4.4cqw', fontWeight: 700, lineHeight: 1.2 }}>
            Creating your Jaipur trip...
          </div>
          <div style={{ fontSize: '2.8cqw', color: '#93c5fd', marginTop: '1cqw' }}>
            Synthesizing 48 heritage locations with real-time crowd metrics.
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '1.2cqw', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '1cqw', marginTop: '3cqw', overflow: 'hidden' }}>
            <div style={{ width: '82%', height: '100%', backgroundColor: '#60a5fa', borderRadius: '1cqw' }} />
          </div>
        </div>

        {/* Live Synthesis Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2cqw' }}>
          {[
            { title: 'Historical landmarks analyzed', desc: '48 monuments evaluated for time of day', done: true },
            { title: 'Traffic congestion modeling', desc: 'Amber fort highway detour calculated', done: true },
            { title: 'Crowd footfall predictions', desc: 'Off-peak window identified for Day 2', done: true },
            { title: 'Fair price ticket verification', desc: 'Validating government ASI pricing', done: false },
          ].map((step, idx) => (
            <div
              key={step.title}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '2.5cqw',
                padding: '2.4cqw 3cqw',
                backgroundColor: '#F8FAFC',
                borderRadius: '2.8cqw',
                border: '1px solid #E2E8F0',
              }}
            >
              <div
                style={{
                  width: '5.5cqw',
                  height: '5.5cqw',
                  borderRadius: '50%',
                  backgroundColor: step.done ? '#dcfce7' : '#dbeafe',
                  color: step.done ? '#16a34a' : '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.8cqw',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '0.4cqw',
                }}
              >
                {step.done ? '✓' : '●'}
              </div>
              <div>
                <div style={{ fontSize: '3cqw', fontWeight: 600, color: '#0f172a' }}>{step.title}</div>
                <div style={{ fontSize: '2.4cqw', color: '#64748b', marginTop: '0.3cqw' }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Insight Box */}
        <div
          style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: '2.8cqw',
            padding: '2.5cqw 3cqw',
            display: 'flex',
            alignItems: 'center',
            gap: '2cqw',
          }}
        >
          <span style={{ fontSize: '3.4cqw' }}>💡</span>
          <div style={{ fontSize: '2.6cqw', color: '#92400E', fontWeight: 500, lineHeight: 1.3 }}>
            <strong>VAYA Intelligence:</strong> Shifting Hawa Mahal to Day 2 morning saves 45 minutes of wait time.
          </div>
        </div>
      </div>

      {/* ── SCREEN 2: Itinerary (Day-by-Day Timeline) ────────────────────── */}
      <div
        ref={(el) => {
          screensRef.current[2] = el;
        }}
        className="mv-tall-screen"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          minHeight: '154%',
          padding: '8.8cqw 4cqw 6cqw',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.8cqw',
          backgroundColor: '#FFFFFF',
          zIndex: 12,
          opacity: 0,
          willChange: 'transform, opacity',
        }}
      >
        {/* Day Pills Bar */}
        <div style={{ display: 'flex', gap: '1.8cqw', overflowX: 'auto', paddingBottom: '0.5cqw' }}>
          {['Day 1', 'Day 2 · Active', 'Day 3', 'Day 4'].map((day, i) => (
            <span
              key={day}
              style={{
                fontSize: '2.6cqw',
                fontWeight: 600,
                backgroundColor: i === 1 ? '#1e3a8a' : '#F1F5F9',
                color: i === 1 ? '#ffffff' : '#64748b',
                padding: '1.2cqw 2.8cqw',
                borderRadius: '2cqw',
                whiteSpace: 'nowrap',
              }}
            >
              {day}
            </span>
          ))}
        </div>

        {/* Heading */}
        <div>
          <h4 style={{ fontSize: '4.4cqw', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Jaipur: Royal Heritage
          </h4>
          <p style={{ fontSize: '2.6cqw', color: '#64748b', marginTop: '0.6cqw', margin: 0 }}>
            Optimized route · 4 curated stops · Low congestion
          </p>
        </div>

        {/* Timeline Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.2cqw' }}>
          {[
            {
              time: '08:00 AM',
              title: 'Amber Palace (Amer)',
              tag: 'Crowd: Low',
              desc: 'Arrive before group coaches. Best sunlight on front façade.',
              price: '₹100 entry',
            },
            {
              time: '11:15 AM',
              title: 'Panna Meena Ka Kund',
              tag: 'Optimal Window',
              desc: 'Iconic stepwell photography. 12-minute transit from palace.',
              price: 'Free access',
            },
            {
              time: '01:30 PM',
              title: '1135 AD Royal Dining',
              tag: 'Curated Lunch',
              desc: 'Authentic Rajasthani thali inside palace ramparts.',
              price: 'Table reserved',
            },
            {
              time: '04:00 PM',
              title: 'Hawa Mahal Corridor',
              tag: 'Sunset View',
              desc: 'Rear courtyard access avoiding street noise.',
              price: '₹50 entry',
            },
          ].map((item, idx) => (
            <div
              key={item.title}
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '3cqw',
                padding: '2.6cqw 3cqw',
                display: 'flex',
                flexDirection: 'column',
                gap: '1cqw',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '2.4cqw', fontWeight: 700, color: '#2563eb' }}>{item.time}</span>
                <span style={{ fontSize: '2.2cqw', fontWeight: 600, color: '#16a34a', backgroundColor: '#f0fdf4', padding: '0.4cqw 1.6cqw', borderRadius: '1cqw' }}>
                  {item.tag}
                </span>
              </div>
              <div style={{ fontSize: '3.2cqw', fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
              <div style={{ fontSize: '2.4cqw', color: '#64748b' }}>{item.desc}</div>
              <div style={{ fontSize: '2.3cqw', fontWeight: 600, color: '#94a3b8', marginTop: '0.5cqw' }}>{item.price}</div>
            </div>
          ))}
        </div>

        {/* Accept Button */}
        <div
          style={{
            background: 'linear-gradient(135deg, #14213d 0%, #1e3a8a 100%)',
            color: '#FFFFFF',
            borderRadius: '3cqw',
            padding: '3cqw 0',
            textAlign: 'center',
            fontSize: '3.3cqw',
            fontWeight: 600,
            marginTop: '1cqw',
          }}
        >
          Accept Itinerary &rarr;
        </div>
      </div>

      {/* ── SCREEN 3: Crowd Prediction (Predictive Footfall Model) ────────── */}
      <div
        ref={(el) => {
          screensRef.current[3] = el;
        }}
        className="mv-tall-screen"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          minHeight: '148%',
          padding: '8.8cqw 4cqw 6cqw',
          display: 'flex',
          flexDirection: 'column',
          gap: '3cqw',
          backgroundColor: '#FFFFFF',
          zIndex: 13,
          opacity: 0,
          willChange: 'transform, opacity',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '4.4cqw', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              Crowd Forecast
            </div>
            <div style={{ fontSize: '2.8cqw', color: '#64748b', marginTop: '0.4cqw' }}>
              Jaipur (JAI) · Weekly footfall model
            </div>
          </div>
          <span style={{ fontSize: '2.4cqw', fontWeight: 600, color: '#16a34a', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.8cqw 2cqw', borderRadius: '1.5cqw' }}>
            Optimal Week
          </span>
        </div>

        {/* 7-Day Bar Chart */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '3.5cqw',
            padding: '3cqw 3cqw 2cqw',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '24cqw', borderBottom: '1px solid #E2E8F0', paddingBottom: '2cqw' }}>
            {BAR_DATA.map((bar) => (
              <div key={bar.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2cqw', height: '100%', justifyContent: 'flex-end', width: '10cqw' }}>
                <div style={{ position: 'relative', width: '4.5cqw', height: '18cqw', backgroundColor: '#E2E8F0', borderRadius: '2cqw', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${bar.height}%`,
                      borderRadius: '2cqw',
                      background: bar.isWeekend
                        ? 'linear-gradient(180deg, #1d4ed8 0%, #2563eb 100%)'
                        : 'linear-gradient(180deg, #60a5fa 0%, #93c5fd 100%)',
                    }}
                  />
                </div>
                <span style={{ fontSize: '2.6cqw', fontWeight: bar.isWeekend ? 700 : 500, color: bar.isWeekend ? '#1d4ed8' : '#64748b' }}>
                  {bar.day}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2cqw' }}>
            <span style={{ fontSize: '2.4cqw', color: '#64748b' }}>Low: Tue & Thu (6 AM - 10 AM)</span>
            <span style={{ fontSize: '2.4cqw', fontWeight: 600, color: '#dc2626' }}>Peak: Saturday</span>
          </div>
        </div>

        {/* Live Intel Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2cqw' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5cqw', padding: '2.4cqw 3cqw', backgroundColor: '#F0FDF4', borderRadius: '2.8cqw', border: '1px solid #BBF7D0' }}>
            <span style={{ fontSize: '3.6cqw' }}>🛡️</span>
            <div>
              <div style={{ fontSize: '3cqw', fontWeight: 600, color: '#14532D' }}>Fair Price Lock</div>
              <div style={{ fontSize: '2.4cqw', color: '#166534' }}>Auto fare: ₹150 · Verified guide: ₹1,200</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5cqw', padding: '2.4cqw 3cqw', backgroundColor: '#EFF6FF', borderRadius: '2.8cqw', border: '1px solid #BFDBFE' }}>
            <span style={{ fontSize: '3.6cqw' }}>⚡</span>
            <div>
              <div style={{ fontSize: '3cqw', fontWeight: 600, color: '#1E40AF' }}>Hawa Mahal Congestion Low</div>
              <div style={{ fontSize: '2.4cqw', color: '#1D4ED8' }}>Courtyard footfall 38% under seasonal peak</div>
            </div>
          </div>
        </div>

        {/* Button */}
        <div
          onClick={onWaitlist}
          style={{
            background: 'linear-gradient(135deg, #14213d 0%, #1e3a8a 100%)',
            color: '#FFFFFF',
            borderRadius: '3cqw',
            padding: '3cqw 0',
            textAlign: 'center',
            fontSize: '3.3cqw',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Plan my trip &rarr;
        </div>
      </div>

      {/* ── SCREEN 4: Coming Soon (Final State 85-100%) ───────────────────── */}
      <div
        ref={(el) => {
          screensRef.current[4] = el;
        }}
        className="mv-tall-screen"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#0c1322',
          zIndex: 15,
          opacity: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8cqw 5cqw',
          textAlign: 'center',
          willChange: 'transform, opacity',
        }}
      >
        {/* Golden VAYA Symbol */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/meet/vaya-symbol.png"
          alt="VAYA"
          style={{ height: '14cqw', width: 'auto', marginBottom: '2.5cqw' }}
          draggable={false}
        />

        <div
          style={{
            fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
            fontSize: '5.8cqw',
            fontWeight: 700,
            letterSpacing: '0.28em',
            color: '#FFFFFF',
            textIndent: '0.28em',
            marginBottom: '1.2cqw',
          }}
        >
          VAYA
        </div>

        {/* Pulsing Coming Soon Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1.8cqw',
            backgroundColor: 'rgba(242, 184, 75, 0.15)',
            border: '1px solid rgba(242, 184, 75, 0.4)',
            padding: '1cqw 3cqw',
            borderRadius: '999px',
            marginBottom: '4cqw',
          }}
        >
          <span
            style={{
              width: '1.8cqw',
              height: '1.8cqw',
              borderRadius: '50%',
              backgroundColor: '#f2b84b',
              boxShadow: '0 0 8px #f2b84b',
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
              fontSize: '2.8cqw',
              fontWeight: 600,
              color: '#f2b84b',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Coming Soon
          </span>
        </div>

        <p
          style={{
            fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
            fontSize: '3.2cqw',
            lineHeight: 1.45,
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '5cqw',
            maxWidth: '82%',
          }}
        >
          AI-powered travel intelligence with real-time routing and crowd forecasts.
        </p>

        {/* Join Waitlist Button */}
        <button
          type="button"
          onClick={onWaitlist}
          style={{
            width: '85%',
            padding: '3.4cqw 0',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #f2b84b 0%, #d99a2b 100%)',
            color: '#0f172a',
            fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
            fontSize: '3.6cqw',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(242, 184, 75, 0.35)',
          }}
        >
          Join Waitlist
        </button>
      </div>

      {/* ── Fixed iPhone Bottom Indicator ─────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4cqw',
          zIndex: 35,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '32cqw',
            height: '1.1cqw',
            borderRadius: '1cqw',
            backgroundColor: '#0f172a',
            opacity: 0.7,
          }}
        />
      </div>
    </div>
  );
});

export default MeetPhoneScreen;
