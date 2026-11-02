export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { adminDb, adminFirestore } from '@/lib/firebase/admin';
import { getTodayIST } from '@/lib/utils/date';

// Extended bot detection regex per Step 4
const BOT_REGEX = /bot|spider|crawl|slurp|bing|google|yahoo|duckduckgo|baidu|yandex|facebookexternalhit|curl|wget|lighthouse|vercel|headless|phantom|puppeteer|playwright|selenium|whatsapp|telegram|slackbot|twitterbot|linkedinbot|preview|python|node-fetch|axios|go-http-client|okhttp|httpclient|monitor|uptime/i;

// UUID v4 format verification
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    // 1. STEP 1 - Only track in production on allowed hosts
    const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').toLowerCase().split(':')[0];
    const allowedHosts = (process.env.TRACK_ALLOWED_HOSTS || '')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);

    if (process.env.VERCEL_ENV !== 'production' || allowedHosts.length === 0 || !allowedHosts.includes(host)) {
      return NextResponse.json({ ok: true, ignored: 'non_prod' });
    }

    // 2. Respect Do Not Track
    if (req.headers.get('dnt') === '1' || req.headers.get('sec-gpc') === '1') {
      return NextResponse.json({ ok: true, ignored: 'dnt' });
    }

    // 3. STEP 4 - Bot filtering (extended regex, empty User-Agent, missing Accept-Language)
    const userAgent = req.headers.get('user-agent') || '';
    const acceptLanguage = req.headers.get('accept-language');

    if (!userAgent.trim() || !acceptLanguage || BOT_REGEX.test(userAgent)) {
      return NextResponse.json({ ok: true, ignored: 'bot' });
    }

    // 4. STEP 4 - Internal exclusion (admin session or vaya_internal cookie)
    const cookieStore = cookies();
    const adminSession = cookieStore.get('session')?.value;
    const isInternalCookie = cookieStore.get('vaya_internal')?.value === '1';

    if (adminSession || isInternalCookie) {
      return NextResponse.json({ ok: true, ignored: 'internal' });
    }

    const body = await req.json().catch(() => ({}));
    const { pathname, referrer, utmSource, utmMedium, utmCampaign, visitorId: bodyVid, internal } = body;

    // Support visiting /?internal=1 or sending internal=true
    if (internal === true || internal === '1') {
      const res = NextResponse.json({ ok: true, ignored: 'internal' });
      res.cookies.set('vaya_internal', '1', {
        maxAge: 365 * 24 * 60 * 60,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      return res;
    }

    // Never track admin pages (by pathname only)
    const cleanPath = (pathname || '/').split('?')[0];
    if (cleanPath.startsWith('/admin')) {
      return NextResponse.json({ ok: true, ignored: 'admin_path' });
    }

    // 5. STEP 2 - Retrieve or create visitor ID (validate UUID v4, prefer cookie, then body, then create)
    const cookieVid = cookieStore.get('vaya_vid')?.value;
    let visitorId = '';
    let isNewVisitorCookie = false;

    if (cookieVid && UUID_V4_REGEX.test(cookieVid)) {
      visitorId = cookieVid;
    } else if (bodyVid && typeof bodyVid === 'string' && UUID_V4_REGEX.test(bodyVid.trim())) {
      visitorId = bodyVid.trim();
      isNewVisitorCookie = true;
    } else {
      visitorId = crypto.randomUUID();
      isNewVisitorCookie = true;
    }

    const todayIST = getTodayIST();
    const device = detectDevice(userAgent);

    // If service account is not yet configured, gracefully skip Firestore write without crashing
    if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      const response = NextResponse.json({ ok: true, note: 'Service account credentials not yet set' });
      if (isNewVisitorCookie) {
        response.cookies.set('vaya_vid', visitorId, {
          maxAge: 365 * 24 * 60 * 60,
          path: '/',
          httpOnly: false,
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

    // 6. Execute in ONE transaction
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
        httpOnly: false,
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
