// src/components/Footer.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { siteConfig } from '@/lib/siteConfig';
import styles from './footer.module.css';

gsap.registerPlugin(ScrollTrigger);

interface FooterProps {
  onWaitlist?: () => void;
}

export default function Footer({ onWaitlist }: FooterProps) {
  const footerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!footerRef.current || !contentRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 85%',
            once: true,
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <footer ref={footerRef} className={styles.footer} id="footer">
      {/* Background faded VAYA wordmark */}
      <div className={styles.fadedWordmark} aria-hidden="true">
        VAYA
      </div>

      <div ref={contentRef} className={styles.inner}>
        {/* TOP CTA BAND */}
        <section className={styles.ctaBand} aria-label="Join the Journey">
          <span className={styles.eyebrow}>— JOIN THE JOURNEY —</span>
          <h2 className={styles.ctaHeading}>
            Your next adventure starts with{' '}
            <span className={styles.goldWord}>VAYA</span>.
          </h2>
          <p className={styles.subLine}>Know Before You Go!</p>
          <div className={buttonRowStyles()}>
            <button
              type="button"
              onClick={onWaitlist}
              className={styles.waitlistBtn}
            >
              Join Waitlist
            </button>
            <a
              href={siteConfig.socialLinks[0]?.url || 'https://chat.whatsapp.com/BaBmwyGOnOhGKWXreFZxfQ'}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappBtn}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Join our WhatsApp community</span>
            </a>
          </div>
        </section>

        {/* 3-COLUMN MAIN GRID */}
        <div className={styles.mainGrid}>
          {/* Column 1: Brand */}
          <div className={styles.brandCol}>
            <Image
              src={siteConfig.logo}
              alt="VAYA"
              width={120}
              height={38}
              className={styles.brandLogo}
              priority={false}
            />
            <div className={styles.brandTagline}>Stand In. Step Out.</div>
            <p className={styles.brandDesc}>
              AI-powered travel intelligence. Know where to go, when to go and
              what is happening there.
            </p>
          </div>

          {/* Column 2: Connect with us */}
          <div className={styles.connectCol}>
            <h3 className={styles.colTitle}>Connect with us</h3>
            <div className={styles.socialList}>
              {siteConfig.socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.ariaLabel}
                  className={styles.socialRow}
                >
                  <span className={styles.socialCircle}>
                    {item.icon === 'whatsapp' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
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
                  <span className={styles.socialLabel}>{item.name}</span>
                  <span className={styles.socialArrow} aria-hidden="true">→</span>
                </a>
              ))}
            </div>
          </div>

          {/* Column 3: The Founders */}
          <div className={styles.foundersCol}>
            <h3 className={styles.colTitle}>The founders</h3>
            <div className={styles.founderCards}>
              {siteConfig.founders.map((founder) => {
                const hasValidEmail = founder.email && founder.email.includes('@');
                return (
                  <div key={founder.name} className={styles.founderCard}>
                    <div className={styles.avatar}>
                      {getInitials(founder.name)}
                    </div>
                    <div className={styles.founderInfo}>
                      <span className={styles.founderName}>{founder.name}</span>
                      <span className={styles.founderRole}>{founder.role}</span>
                      {hasValidEmail ? (
                        <a
                          href={`mailto:${founder.email}`}
                          className={`${styles.founderEmail} ${styles.founderEmailLink}`}
                        >
                          {founder.email}
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className={styles.bottomBar}>
          <div>{siteConfig.copyright}</div>
          <div>
            <span>Made with</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={styles.heartSvg}
              aria-hidden="true"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>by Monika Batra</span>
          </div>
          <div>
            <Link href="/admin" className={styles.adminLink} aria-label="Admin portal">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function buttonRowStyles() {
  return styles.buttonRow;
}
