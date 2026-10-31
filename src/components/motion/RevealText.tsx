'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface RevealTextProps {
  children: React.ReactNode;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  className?: string;
  style?: React.CSSProperties;
  stagger?: number;
  duration?: number;
  delay?: number;
  mode?: 'word' | 'line' | 'fade';
}

export default function RevealText({
  children,
  tag = 'h2',
  className = '',
  style = {},
  stagger = 0.045,
  duration = 0.75,
  delay = 0,
  mode = 'word',
}: RevealTextProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const el = containerRef.current;
    if (!el) return;

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    if (mode === 'fade') {
      const anim = gsap.fromTo(
        el,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        }
      );
      return () => {
        anim.scrollTrigger?.kill();
        anim.kill();
      };
    }

    const spans = el.querySelectorAll('.rv-word');
    if (!spans.length) return;

    gsap.set(spans, { yPercent: 115, opacity: 0 });

    const anim = gsap.to(spans, {
      yPercent: 0,
      opacity: 1,
      duration,
      stagger,
      delay,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true,
      },
    });

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, [stagger, duration, delay, mode, children]);

  if (mode === 'fade') {
    const Tag = tag as any;
    return (
      <Tag ref={containerRef} className={className} style={{ willChange: 'opacity, transform', ...style }}>
        {children}
      </Tag>
    );
  }

  // Split text into words with masked wrappers if children is a string
  if (typeof children === 'string') {
    const words = children.split(' ');
    const Tag = tag as any;
    return (
      <Tag
        ref={containerRef}
        className={`rv-container ${className}`}
        style={{
          display: 'inline-block',
          ...style,
        }}
      >
        {words.map((word, i) => (
          <span
            key={i}
            className="rv-word-mask"
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              verticalAlign: 'top',
              marginRight: i === words.length - 1 ? '0' : '0.28em',
            }}
          >
            <span
              className="rv-word"
              style={{
                display: 'inline-block',
                willChange: 'transform, opacity',
              }}
            >
              {word}
            </span>
          </span>
        ))}
      </Tag>
    );
  }

  const Tag = tag as any;
  return (
    <Tag ref={containerRef} className={className} style={style}>
      {children}
    </Tag>
  );
}
