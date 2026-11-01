'use client';

import { useState, useEffect } from 'react';

/**
 * Unified mobile breakpoint hook across the entire site.
 * Mobile layout = screens below 1024px (max-width: 1023px), encompassing phones and tablets.
 * SSR-safe: returns false on server, updates on mount and on viewport resize/orientationchange.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mql.matches);

    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
    } else {
      mql.addListener(onChange);
    }

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', onChange);
      } else {
        mql.removeListener(onChange);
      }
    };
  }, []);

  return isMobile;
}

/**
 * Phone-only breakpoint (< 768px) where a distinct phone-vs-tablet difference is needed.
 */
export function useIsPhone(): boolean {
  const [isPhone, setIsPhone] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(max-width: 767px)');
    setIsPhone(mql.matches);

    const onChange = (e: MediaQueryListEvent) => {
      setIsPhone(e.matches);
    };

    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
    } else {
      mql.addListener(onChange);
    }

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', onChange);
      } else {
        mql.removeListener(onChange);
      }
    };
  }, []);

  return isPhone;
}

