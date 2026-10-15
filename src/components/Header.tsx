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
      className={`fixed top-0 left-0 w-full z-50 flex items-center justify-between pointer-events-none transition-opacity duration-700 ease-out ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        padding: '20px 5vw',
        background: 'transparent',
      }}
    >
      {/* LEFT: Logo (height 88px desktop / 62px mobile, no box/backdrop, click -> top) */}
      <Link
        href="/"
        onClick={scrollToTop}
        className="pointer-events-auto block transition-transform duration-200 hover:opacity-90"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/vaya-logo-500.webp"
          alt="VAYA Logo"
          className="h-[62px] md:h-[88px] w-auto object-contain select-none"
          draggable={false}
        />
      </Link>

      {/* RIGHT: Login text link + Join Waitlist pill */}
      <div className="flex items-center pointer-events-auto">
        <a
          href="#login"
          className="hidden md:inline-block font-normal text-[15px] text-[#1F2D3D] mr-[20px] hover:opacity-75 transition-opacity select-none cursor-pointer"
        >
          Login
        </a>
        <button
          type="button"
          onClick={onWaitlist}
          className="h-11 px-6 rounded-full bg-[#1F2D3D] text-white text-[14px] font-normal tracking-[0.04em] transition-all duration-200 hover:bg-[#2d4258] hover:-translate-y-[1px] active:translate-y-0 active:bg-[#1F2D3D] shadow-sm select-none"
        >
          Join Waitlist
        </button>
      </div>
    </header>
  );
}
