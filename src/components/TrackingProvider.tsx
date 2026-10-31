'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function TrackingProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // 1. Never track /admin routes
    if (!pathname || pathname.startsWith('/admin')) {
      return;
    }

    // 2. Respect Do Not Track
    if (typeof window !== 'undefined' && (navigator.doNotTrack === '1' || (window as any).doNotTrack === '1')) {
      return;
    }

    const currentUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    if (lastTrackedPath.current === currentUrl) {
      return;
    }
    lastTrackedPath.current = currentUrl;

    const payload = JSON.stringify({
      pathname,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      utmSource: searchParams?.get('utm_source') || undefined,
      utmMedium: searchParams?.get('utm_medium') || undefined,
      utmCampaign: searchParams?.get('utm_campaign') || undefined,
    });

    const sendTrack = () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          const sent = navigator.sendBeacon('/api/track', blob);
          if (!sent) {
            fetch('/api/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payload,
              keepalive: true,
            }).catch(() => {});
          }
        } else {
          fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // Silent catch: tracking must never impact UX
      }
    };

    // Use requestIdleCallback if available to completely unblock initial paint
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(sendTrack, { timeout: 2000 });
    } else {
      setTimeout(sendTrack, 300);
    }
  }, [pathname, searchParams]);

  return null;
}
