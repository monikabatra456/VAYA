'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import HandAsset from './HandAsset';
import PhoneScreenSequence from './PhoneScreenSequence';

interface PhoneMockupProps {
  children?: React.ReactNode;
  showHand?: boolean;
  className?: string;
  style?: React.CSSProperties;
  customHandSrc?: string;
}

/**
 * PhoneMockup – Modern flagship smartphone held naturally by a human hand
 * Modeled on Shopify Editions Winter '26:
 * - 9:19.5 aspect ratio
 * - Thin bezel & dynamic island
 * - Correct z-order: fingers behind, phone chassis in middle, thumb in front
 * - Gentle idle float & smooth mouse parallax tilt
 * - Fluidly responsive across breakpoints
 */
export default function PhoneMockup({
  children,
  showHand = true,
  className = '',
  style = {},
  customHandSrc,
}: PhoneMockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const idleTweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) return;

    // Gentle idle float (2-3px, slow sine ease)
    idleTweenRef.current = gsap.to(el, {
      y: -3,
      duration: 3.2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    // Subtle parallax tilt on mouse move
    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cX = rect.left + rect.width / 2;
      const cY = rect.top + rect.height / 2;
      const mouseX = (e.clientX - cX) / (window.innerWidth / 2);
      const mouseY = (e.clientY - cY) / (window.innerHeight / 2);

      gsap.to(el, {
        rotateY: Math.max(-4, Math.min(4, mouseX * 4)),
        rotateX: Math.max(-4, Math.min(4, -mouseY * 4)),
        duration: 0.6,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      idleTweenRef.current?.kill();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`phone-mockup-wrapper ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1200px',
        width: '100%',
        height: '100%',
        ...style,
      }}
    >
      {/* 3D Tilting Stage */}
      <div
        ref={tiltRef}
        style={{
          position: 'relative',
          width: 'clamp(280px, 24vw, 370px)',
          aspectRatio: '9 / 19.5',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        {/* Layer 1: Hand Back (Fingers wrapping behind the phone) */}
        {showHand && (
          <div
            style={{
              position: 'absolute',
              inset: '-8% -18% -8% -14%',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <HandAsset layer="back" customSrc={customHandSrc} />
          </div>
        )}

        {/* Layer 2: Phone Chassis & Screen */}
        <div
          className="phone-chassis"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            borderRadius: '44px',
            background: 'linear-gradient(145deg, #2b2e36 0%, #15171b 100%)',
            padding: '4px',
            boxShadow: `
              0 24px 60px -12px rgba(10, 15, 30, 0.42),
              0 10px 24px -6px rgba(10, 15, 30, 0.22),
              inset 0 1px 1px rgba(255, 255, 255, 0.25),
              inset 0 -1px 2px rgba(0, 0, 0, 0.6)
            `,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Outer Metallic Rim Highlight */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '44px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              pointerEvents: 'none',
            }}
          />

          {/* Masked Screen Container */}
          <div
            className="phone-screen-container"
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: '39px',
              overflow: 'hidden',
              background: '#0B0F19',
              contain: 'paint',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Dynamic Island Pill */}
            <div
              style={{
                position: 'absolute',
                top: '9px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '88px',
                height: '24px',
                backgroundColor: '#000000',
                borderRadius: '999px',
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: '9px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
              }}
            >
              {/* Camera Lens Specular */}
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #2a3556 0%, #0c111f 70%)',
                  boxShadow: 'inset 0 0 2px rgba(255,255,255,0.4)',
                }}
              />
            </div>

            {/* Subtle Screen Glass Sheen */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.01) 40%, transparent 60%)',
                pointerEvents: 'none',
                zIndex: 40,
              }}
            />

            {/* Interactive Screen Content */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {children || <PhoneScreenSequence />}
            </div>

            {/* Home Indicator Bar */}
            <div
              style={{
                position: 'absolute',
                bottom: '7px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '115px',
                height: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.45)',
                borderRadius: '2px',
                zIndex: 50,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Layer 3: Hand Front (Thumb overlapping front edge & bezel naturally) */}
        {showHand && (
          <div
            style={{
              position: 'absolute',
              inset: '-8% -18% -8% -14%',
              pointerEvents: 'none',
              zIndex: 20,
            }}
          >
            <HandAsset layer="front" customSrc={customHandSrc} />
          </div>
        )}
      </div>
    </div>
  );
}

