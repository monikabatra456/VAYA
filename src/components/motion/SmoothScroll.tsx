'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Reset scroll restoration so a refresh always starts from page 1 with a clean state
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.clearScrollMemory();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let lenisInstance: any = null;
    let tickerFn: ((time: number) => void) | null = null;

    import('lenis').then(({ default: Lenis }) => {
      lenisInstance = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.95,
        touchMultiplier: 1.5,
      });

      (window as any).lenis = lenisInstance;

      lenisInstance.on('scroll', ScrollTrigger.update);

      tickerFn = (time: number) => {
        lenisInstance.raf(time * 1000);
      };

      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(0);
    });

    return () => {
      if (tickerFn) gsap.ticker.remove(tickerFn);
      if (lenisInstance) {
        lenisInstance.destroy();
        delete (window as any).lenis;
      }
    };
  }, []);

  return null;
}
