// src/components/Footer.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/lib/siteConfig';

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#FBF1E3',
        color: '#14264A',
        fontFamily: "var(--font-sans, 'Plus Jakarta Sans', system-ui, sans-serif)",
        padding: '64px 20px 24px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        borderTop: '1px solid rgba(205, 191, 168, 0.45)',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* 1. VAYA Logo & Tagline */}
        <div style={{ marginBottom: '36px' }}>
          <Image
            src={siteConfig.logo}
            alt="VAYA"
            width={120}
            height={42}
            style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
            priority={false}
          />
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: '#3F4A5E',
              marginTop: '12px',
              maxWidth: '480px',
              fontWeight: 500,
            }}
          >
            {siteConfig.tagline}
          </p>
        </div>

        {/* 2. Connect with us: 3 Icon Links (40px circular outlined buttons) */}
        <div style={{ marginBottom: '44px', width: '100%' }}>
          <span
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: '#9A6420',
              marginBottom: '18px',
            }}
          >
            Connect with us
          </span>

          <div
            className="footer-social-links-wrap"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              margin: '0 auto',
            }}
          >
            {siteConfig.socialLinks.map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.ariaLabel}
                className="footer-social-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 16px 6px 6px',
                  borderRadius: '9999px',
                  border: '1px solid #CDBFA8',
                  background: 'rgba(255, 255, 255, 0.45)',
                  textDecoration: 'none',
                  color: '#14264A',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                <span
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '1px solid #CDBFA8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#FFFFFF',
                    color: '#14264A',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                  className="footer-icon-circle"
                >
                  {item.icon === 'whatsapp' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  )}
                  {item.icon === 'linkedin' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  )}
                  {item.icon === 'instagram' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  )}
                </span>
                <span>{item.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* 3. Founders Block: Two columns on desktop, stack on mobile */}
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            marginBottom: '44px',
            padding: '24px 16px',
            background: 'rgba(255, 255, 255, 0.40)',
            borderRadius: '16px',
            border: '1px solid #CDBFA8',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#9A6420',
              marginBottom: '16px',
            }}
          >
            Leadership
          </span>

          <div
            className="footer-founders-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              textAlign: 'center',
            }}
          >
            {siteConfig.founders.map((founder) => (
              <div key={founder.name} style={{ padding: '0 8px' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#14264A' }}>
                  {founder.name}
                </div>
                <div style={{ fontSize: '13px', color: '#3F4A5E', marginTop: '2px', fontWeight: 500 }}>
                  {founder.role}
                </div>
                <a
                  href={`mailto:${founder.email}`}
                  style={{
                    display: 'inline-block',
                    marginTop: '6px',
                    fontSize: '13px',
                    color: '#14264A',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                    fontWeight: 500,
                  }}
                  className="footer-founder-email"
                >
                  {founder.email}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Bottom Line: Credit with gold heart + Copyright */}
        <div
          style={{
            fontSize: '13px',
            color: '#3F4A5E',
            lineHeight: 1.8,
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>Made with love by Monika Batra</span>
            {/* Safe SVG gold heart */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="#9A6420"
              style={{ display: 'inline-block', verticalAlign: 'middle' }}
              aria-hidden="true"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div style={{ fontSize: '12px', color: '#5B6577', marginTop: '4px' }}>
            {siteConfig.copyright}
          </div>
        </div>

        {/* 5. Subtle Admin Link with >= 44x44px touch target area */}
        <div style={{ paddingTop: '8px' }}>
          <Link
            href="/admin"
            style={{
              fontSize: '11px',
              color: 'rgba(20, 38, 74, 0.45)',
              textDecoration: 'none',
              letterSpacing: '0.06em',
              fontWeight: 500,
              minWidth: '44px',
              minHeight: '44px',
              padding: '12px 18px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="footer-admin-link"
          >
            Admin
          </Link>
        </div>
      </div>

      <style jsx>{`
        
        @media (max-width: 640px) {
          .footer-social-links-wrap {
            flex-direction: column !important;
            align-items: center !important;
            width: 100% !important;
            max-width: 340px !important;
            gap: 12px !important;
          }
          .footer-social-link {
            width: 100% !important;
            height: 48px !important;
            box-sizing: border-box !important;
            justifyContent: center !important;
          }
          .footer-founders-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }

        .footer-social-link:hover {
          border-color: #9a6420 !important;
          color: #9a6420 !important;
          background: rgba(255, 255, 255, 0.85) !important;
          transform: translateY(-1px);
        }
        .footer-social-link:hover .footer-icon-circle {
          border-color: #9a6420 !important;
          color: #9a6420 !important;
        }
        .footer-social-link:focus-visible,
        .footer-founder-email:focus-visible,
        .footer-admin-link:focus-visible {
          outline: 2px solid #14264a;
          outline-offset: 3px;
        }
        .footer-founder-email:hover {
          color: #9a6420;
        }
        .footer-admin-link:hover {
          color: rgba(20, 38, 74, 0.8);
          text-decoration: underline;
        }
      `}</style>
    </footer>
  );
}
