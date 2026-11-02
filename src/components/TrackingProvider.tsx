'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Module-level in-flight guard preventing StrictMode / concurrent double effects
const inFlightPaths = new Set<string>();

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION_TTL_MS = 30 * 60 * 1000; // 30-minute session guard

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * STEP 2 - Create visitor id on the client synchronously BEFORE the track call.
 * Sets vaya_vid cookie (1 year, SameSite=Lax, Secure in prod) & mirrors in localStorage.
 */
function getOrCreateVisitorId(): string | null {
  if (typeof window === 'undefined') return null;
  let vid = getCookie('vaya_vid');

  if (!vid || !UUID_V4_REGEX.test(vid)) {
    try {
      const lsVid = localStorage.getItem('vaya_vid');
      if (lsVid && UUID_V4_REGEX.test(lsVid)) {
        vid = lsVid;
      }
    } catch {}
  }

  if (!vid || !UUID_V4_REGEX.test(vid)) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      vid = crypto.randomUUID();
    }
  }

  if (vid) {
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `vaya_vid=${encodeURIComponent(vid)}; path=/; max-age=31536000; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    try {
      localStorage.setItem('vaya_vid', vid);
    } catch {}
  }

  return vid;
}

export default function TrackingProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. Never track /admin routes
    if (!pathname || pathname.startsWith('/admin')) {
      return;
    }

    // 2. Respect Do Not Track
    if (typeof window !== 'undefined' && (navigator.doNotTrack === '1' || (window as any).doNotTrack === '1')) {
      return;
    }

    // STEP 3: Count by pathname only, ignore query string
    const path = pathname || '/';
    const isInternal = searchParams?.get('internal') === '1';

    // Module-level in-flight guard
    if (inFlightPaths.has(path)) {
      return;
    }

    // Client-side guard with sessionStorage: 1 page view per pathname per 30 minutes
    const storageKey = `vaya_pv_${path}`;
    if (!isInternal) {
      try {
        const lastTracked = sessionStorage.getItem(storageKey);
        if (lastTracked) {
          const timestamp = parseInt(lastTracked, 10);
          if (!isNaN(timestamp) && Date.now() - timestamp < SESSION_TTL_MS) {
            return; // Already tracked inside this 30-min session
          }
        }
      } catch {}
    }

    // Acquire lock for this pathname
    inFlightPaths.add(path);
    setTimeout(() => {
      inFlightPaths.delete(path);
    }, 2000);

    // Record session timestamp in sessionStorage
    try {
      sessionStorage.setItem(storageKey, Date.now().toString());
    } catch {}

    // Synchronously ensure visitor ID exists
    const visitorId = getOrCreateVisitorId();

    const payload = JSON.stringify({
      pathname: path,
      visitorId,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      utmSource: searchParams?.get('utm_source') || undefined,
      utmMedium: searchParams?.get('utm_medium') || undefined,
      utmCampaign: searchParams?.get('utm_campaign') || undefined,
      internal: isInternal ? true : undefined,
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
