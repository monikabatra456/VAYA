'use client';

import React from 'react';
import PhoneScreenSequence from '@/components/phone/PhoneScreenSequence';
import PhoneMockup from '@/components/phone/PhoneMockup';

export default function PhonePreviewPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0B0F19',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        gap: '40px',
        flexWrap: 'wrap',
      }}
    >
      {/* 1. Only the content inside the phone screen (standalone raw container) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ color: '#E09545', fontSize: '14px', fontWeight: 600, letterSpacing: '0.06em' }}>
          SCREEN CONTENT ONLY (STANDALONE)
        </h2>
        <div
          id="screen-container"
          style={{
            width: '320px',
            height: '680px',
            borderRadius: '38px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.12)',
            position: 'relative',
          }}
        >
          <PhoneScreenSequence />
        </div>
      </div>

      {/* 2. Embedded inside PhoneMockup */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ color: '#E09545', fontSize: '14px', fontWeight: 600, letterSpacing: '0.06em' }}>
          INSIDE PHONE MOCKUP
        </h2>
        <div style={{ width: '360px', height: '740px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PhoneMockup showHand={false} />
        </div>
      </div>
    </div>
  );
}

