'use client';
import { useState, useEffect, useRef } from 'react';
import VAYALogoMark from './VAYALogoMark';

const NAV_LINKS = [
  { href: '#problem',   label: 'The problem' },
  { href: '#how',       label: 'How it works' },
  { href: '#features',  label: 'Features' },
  { href: '#guides',    label: 'Local guides' },
  { href: '#community', label: 'Community' },
];

export default function Header({ onWaitlist }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const drawerRef = useRef(null);
  const firstFocusRef = useRef(null);

  // Colour switches from white (over hero sky) to dark (over white sections)
  useEffect(() => {
    const handler = () => {
      // Switches when scrolled past 75% of viewport
      setScrolled(window.scrollY > window.innerHeight * 0.75);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Focus trap in drawer & Esc to close
  useEffect(() => {
    if (!drawerOpen) return;
    firstFocusRef.current?.focus();
    const trap = (e) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = drawerRef.current?.querySelectorAll(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [drawerOpen]);

  const themeClass = scrolled ? 'header--dark' : 'header--light';

  return (
    <>
      <header className={`site-header ${themeClass}`} role="banner">
        {/* Left: hamburger + waitlist pill */}
        <div className="header-left">
          <button
            className="hamburger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="sidebar-nav"
          >
            <span /><span /><span />
          </button>
          <button
            className="btn-pill"
            onClick={onWaitlist}
            aria-label="Join the VAYA waitlist"
          >
            Join waitlist
          </button>
        </div>

        {/* Right: logo mark with small vaya wordmark */}
        <div className="header-right">
          <span className="header-wordmark" aria-label="VAYA">vaya</span>
          <VAYALogoMark size={32} />
        </div>
      </header>

      {/* Sidebar drawer */}
      {drawerOpen && (
        <div
          className="drawer-overlay"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
      <nav
        id="sidebar-nav"
        ref={drawerRef}
        className={`sidebar ${drawerOpen ? 'sidebar--open' : ''}`}
        aria-label="Site navigation"
        aria-hidden={!drawerOpen}
        role="navigation"
      >
        <button
          ref={firstFocusRef}
          className="sidebar-close"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation menu"
        >
          ✕
        </button>
        <ul className="sidebar-links" role="list">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                className="sidebar-link"
                onClick={() => setDrawerOpen(false)}
              >
                {label}
              </a>
            </li>
          ))}
          <li>
            <button
              className="sidebar-link sidebar-waitlist"
              onClick={() => {
                setDrawerOpen(false);
                onWaitlist();
              }}
            >
              Join waitlist →
            </button>
          </li>
        </ul>
        <div className="sidebar-brand" aria-hidden="true">
          <VAYALogoMark size={40} />
        </div>
      </nav>
    </>
  );
}
