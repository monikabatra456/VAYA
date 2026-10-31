export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { adminDb, adminFirestore } from '@/lib/firebase/admin';
import { getTodayIST } from '@/lib/utils/date';

// Simple bot detection regex
const BOT_REGEX = /bot|spider|crawl|slurp|bing|google|yahoo|duckduckgo|baidu|yandex|facebookexternalhit|curl|wget|lighthouse/i;

function detectDevice(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    return 'tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer/i.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

export async function POST(req: Request) {
  try {
    // 1. Respect Do Not Track
    if (req.headers.get('dnt') === '1' || req.headers.get('sec-gpc') === '1') {
      return NextResponse.json({ ok: true, ignored: 'dnt' });
    }

    const userAgent = req.headers.get('user-agent') || '';

    // 2. Ignore automated bots
    if (BOT_REGEX.test(userAgent)) {
      return NextResponse.json({ ok: true, ignored: 'bot' });
    }

    // 3. Ignore if user holds an admin session cookie (avoid tracking admin's own views)
    const cookieStore = cookies();
    const adminSession = cookieStore.get('session')?.value;
    if (adminSession) {
      return NextResponse.json({ ok: true, ignored: 'admin' });
    }

    const body = await req.json().catch(() => ({}));
    const { pathname, referrer, utmSource, utmMedium, utmCampaign } = body;

    // Never track admin pages
    if (pathname && pathname.startsWith('/admin')) {
      return NextResponse.json({ ok: true, ignored: 'admin_path' });
    }

    // 4. Retrieve or create visitor ID
    let visitorId = cookieStore.get('vaya_vid')?.value;
    let isNewVisitorCookie = false;

    if (!visitorId || visitorId.length < 16) {
      visitorId = crypto.randomUUID();
      isNewVisitorCookie = true;
    }

    const todayIST = getTodayIST();
    const device = detectDevice(userAgent);

    // If service account is not yet configured, gracefully skip Firestore write without crashing
    if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      const response = NextResponse.json({ ok: true, note: 'Service account credentials not yet set in .env.local' });
      if (isNewVisitorCookie) {
        response.cookies.set('vaya_vid', visitorId, {
          maxAge: 365 * 24 * 60 * 60,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
      }
      return response;
    }

    const visitorRef = adminDb.collection('visitors').doc(visitorId);
    const visitorDayDocId = `${todayIST}_${visitorId}`;
    const visitorDayRef = adminDb.collection('visitor_days').doc(visitorDayDocId);
    const dailyAnalyticsRef = adminDb.collection('analytics_daily').doc(todayIST);

    // 5. Execute in ONE transaction
    await adminDb.runTransaction(async (transaction) => {
      const visitorDoc = await transaction.get(visitorRef);
      const visitorDayDoc = await transaction.get(visitorDayRef);

      const now = adminFirestore.FieldValue.serverTimestamp();

      if (!visitorDoc.exists) {
        // New visitor
        transaction.set(visitorRef, {
          firstSeenAt: now,
          firstSeenDay: todayIST,
          lastSeenAt: now,
          lastSeenDay: todayIST,
          visitDays: 1,
          device,
          referrer: (referrer || '').slice(0, 200),
          utmSource: (utmSource || '').slice(0, 100),
          utmMedium: (utmMedium || '').slice(0, 100),
          utmCampaign: (utmCampaign || '').slice(0, 100),
          hasJoined: false,
        });

        transaction.set(visitorDayRef, {
          day: todayIST,
          visitorId,
          isReturning: false,
          createdAt: now,
        });
      } else {
        // Returning visitor
        const visitorData = visitorDoc.data() || {};
        const lastSeenDay = visitorData.lastSeenDay || '';
        const firstSeenDay = visitorData.firstSeenDay || todayIST;
        const isDiffDay = lastSeenDay !== todayIST;

        transaction.update(visitorRef, {
          lastSeenAt: now,
          lastSeenDay: todayIST,
          visitDays: isDiffDay
            ? adminFirestore.FieldValue.increment(1)
            : visitorData.visitDays || 1,
        });

        if (!visitorDayDoc.exists) {
          const isReturning = firstSeenDay < todayIST;
          transaction.set(visitorDayRef, {
            day: todayIST,
            visitorId,
            isReturning,
            createdAt: now,
          });
        }
      }

      // Increment daily pageviews
      transaction.set(
        dailyAnalyticsRef,
        { pageViews: adminFirestore.FieldValue.increment(1) },
        { merge: true }
      );
    });

    const response = NextResponse.json({ ok: true });

    // Set first-party cookie for 1 year if newly created
    if (isNewVisitorCookie) {
      response.cookies.set('vaya_vid', visitorId, {
        maxAge: 365 * 24 * 60 * 60,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }

    return response;
  } catch (err: any) {
    console.error('[POST /api/track] Error:', err?.message || err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
