'use client';

import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  visible?: boolean;
  onWaitlist?: () => void;
}

export default function Header({ visible = true, onWaitlist }: HeaderProps) {
  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-[60] flex items-center justify-between pointer-events-none transition-opacity duration-700 ease-out ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        padding: '14px 5vw',
        background: 'transparent',
      }}
    >
      {/* LEFT: Logo (height var(--logo-h) desktop, click -> top) */}
      <Link
        href="/"
        onClick={scrollToTop}
        className="pointer-events-auto block transition-transform duration-200 hover:opacity-90"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/vaya-logo-500.webp"
          alt="VAYA Logo"
          style={{ height: "var(--logo-h)", width: "auto" }}
          className="object-contain select-none"
          draggable={false}
        />
      </Link>

      {/* RIGHT: Join Waitlist pill */}
      <div className="flex items-center pointer-events-auto">
        <button
          type="button"
          onClick={onWaitlist}
          className="h-11 px-7 rounded-full bg-[#14213d] text-white text-[14px] font-normal tracking-[0.03em] transition-all duration-200 hover:bg-[#25205f] hover:shadow-[0_4px_16px_rgba(37,32,95,0.25)] hover:-translate-y-[1px] active:translate-y-0 active:bg-[#14213d] shadow-sm select-none"
        >
          Join Waitlist
        </button>
      </div>
    </header>
  );
}
