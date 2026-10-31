export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server';
import { adminDb } from '@/lib/firebase/admin';
import {
  getTodayIST,
  getDateKeyIST,
  getWeekStartIST,
  getMonthKeyIST,
  parseISTStartOfDay,
  parseISTEndOfDay,
} from '@/lib/utils/date';

// 60-Second In-Memory Cache for Analytics queries
interface CacheEntry {
  timestamp: number;
  data: any;
}
const analyticsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000;

export async function GET(req: Request) {
  // 1. Enforce Server Admin Authorization
  const auth = await requireAdmin();
  if (!auth.authenticated) {
    return NextResponse.json({ ok: false, error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const to = searchParams.get('to') || getTodayIST();
    // Default from: 30 days back
    const defaultFromDate = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
    const from = searchParams.get('from') || getDateKeyIST(defaultFromDate);
    const granularity = (searchParams.get('granularity') || 'day') as 'day' | 'week' | 'month';

    // Protect free-tier quota: cap range at 365 days
    const fromDate = parseISTStartOfDay(from);
    const toDate = parseISTEndOfDay(to);
    const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays > 365) {
      return NextResponse.json(
        { ok: false, error: 'Date range cannot exceed 365 days' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `${from}_${to}_${granularity}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    // Calculate previous period of equal length for % changes
    const prevPeriodLengthMs = toDate.getTime() - fromDate.getTime() + 1;
    const prevToDate = new Date(fromDate.getTime() - 1);
    const prevFromDate = new Date(prevToDate.getTime() - prevPeriodLengthMs + 1);
    const prevFrom = getDateKeyIST(prevFromDate);
    const prevTo = getDateKeyIST(prevToDate);

    // 2. Fetch visitor_days docs for current period
    const visitorDaysSnapshot = await adminDb
      .collection('visitor_days')
      .where('day', '>=', from)
      .where('day', '<=', to)
      .get();

    // 3. Fetch visitor_days docs for previous period (for total visitors diff)
    const prevVisitorDaysSnapshot = await adminDb
      .collection('visitor_days')
      .where('day', '>=', prevFrom)
      .where('day', '<=', prevTo)
      .get();

    // 4. Fetch analytics_daily docs for current and previous period
    const dailySnapshot = await adminDb
      .collection('analytics_daily')
      .where('__name__', '>=', from)
      .where('__name__', '<=', to)
      .get();

    const prevDailySnapshot = await adminDb
      .collection('analytics_daily')
      .where('__name__', '>=', prevFrom)
      .where('__name__', '<=', prevTo)
      .get();

    // 5. Fetch waitlist submissions created in current period
    const waitlistSnapshot = await adminDb
      .collection('waitlist_submissions')
      .where('createdDay', '>=', from)
      .where('createdDay', '<=', to)
      .get();

    // Current metrics
    const currentVisitorIds = new Set<string>();
    const currentReturningVisitorIds = new Set<string>();
    visitorDaysSnapshot.forEach((doc) => {
      const data = doc.data();
      const vid = data.visitorId;
      if (vid) {
        currentVisitorIds.add(vid);
        if (data.isReturning) currentReturningVisitorIds.add(vid);
      }
    });

    let totalPageViews = 0;
    let totalSignups = 0;

    dailySnapshot.forEach((doc) => {
      const data = doc.data();
      totalPageViews += Number(data.pageViews || 0);
      totalSignups += Number(data.signups || 0);
    });

    // Time-series bucketing by granularity
    const bucketMap = new Map<string, { pageViews: number; signups: number; visitorIds: Set<string> }>();

    visitorDaysSnapshot.forEach((doc) => {
      const data = doc.data();
      const day = data.day;
      if (!day) return;

      let bucketKey = day;
      if (granularity === 'week') {
        bucketKey = getWeekStartIST(parseISTStartOfDay(day));
      } else if (granularity === 'month') {
        bucketKey = getMonthKeyIST(parseISTStartOfDay(day));
      }

      if (!bucketMap.has(bucketKey)) {
        bucketMap.set(bucketKey, { pageViews: 0, signups: 0, visitorIds: new Set<string>() });
      }
      const b = bucketMap.get(bucketKey)!;
      if (data.visitorId) b.visitorIds.add(data.visitorId);
    });

    dailySnapshot.forEach((doc) => {
      const day = doc.id;
      const data = doc.data();
      const pv = Number(data.pageViews || 0);
      const su = Number(data.signups || 0);

      let bucketKey = day;
      if (granularity === 'week') {
        bucketKey = getWeekStartIST(parseISTStartOfDay(day));
      } else if (granularity === 'month') {
        bucketKey = day.slice(0, 7);
      }

      if (!bucketMap.has(bucketKey)) {
        bucketMap.set(bucketKey, { pageViews: 0, signups: 0, visitorIds: new Set<string>() });
      }
      const b = bucketMap.get(bucketKey)!;
      b.pageViews += pv;
      b.signups += su;
    });

    // Previous period totals for % change
    const prevVisitorIds = new Set<string>();
    prevVisitorDaysSnapshot.forEach((doc) => {
      const vid = doc.data().visitorId;
      if (vid) prevVisitorIds.add(vid);
    });

    let prevPageViews = 0;
    let prevSignups = 0;
    prevDailySnapshot.forEach((doc) => {
      const data = doc.data();
      prevPageViews += Number(data.pageViews || 0);
      prevSignups += Number(data.signups || 0);
    });

    // Calculate Waitlist Visitor IDs in range for visitorsNotJoined
    const waitlistVisitorIds = new Set<string>();
    const problemCounts: Record<string, number> = {};
    let travellerCount = 0;
    let localGuideCount = 0;

    waitlistSnapshot.forEach((doc) => {
      const d = doc.data();
      const vid = d.visitorId;
      if (vid) waitlistVisitorIds.add(vid);

      const prob = d.biggestProblem || d.problem || 'Other';
      problemCounts[prob] = (problemCounts[prob] || 0) + 1;

      if (d.role === 'local_guide' || d.role === 'local-guide') {
        localGuideCount += 1;
      } else {
        travellerCount += 1;
      }
    });

    const topProblems = Object.entries(problemCounts)
      .map(([problem, count]) => ({ problem, count }))
      .sort((a, b) => b.count - a.count);

    const totalVisitors = currentVisitorIds.size;
    const returningVisitors = currentReturningVisitorIds.size;
    const newVisitors = Math.max(0, totalVisitors - returningVisitors);

    // visitorsNotJoined = max(0, totalVisitors - distinct visitorIds among submissions created in range)
    const visitorsNotJoined = Math.max(0, totalVisitors - waitlistVisitorIds.size);
    const visitorsNotJoinedPercent = totalVisitors > 0 ? Math.round((visitorsNotJoined / totalVisitors) * 100) : 0;

    // Helper for percentage change
    const calcDelta = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    const visitorsDelta = calcDelta(totalVisitors, prevVisitorIds.size);
    const pageViewsDelta = calcDelta(totalPageViews, prevPageViews);
    const signupsDelta = calcDelta(totalSignups, prevSignups);

    // Format sorted time series array
    const sortedBucketKeys = Array.from(bucketMap.keys()).sort();
    const timeSeries = sortedBucketKeys.map((key) => {
      const b = bucketMap.get(key)!;
      return {
        key,
        visitors: b.visitorIds.size,
        pageViews: b.pageViews,
        signups: b.signups,
      };
    });

    const responseData = {
      ok: true,
      range: { from, to, granularity },
      kpis: {
        totalVisitors: { value: totalVisitors, delta: visitorsDelta },
        totalPageViews: { value: totalPageViews, delta: pageViewsDelta },
        waitlistSignups: { value: totalSignups, delta: signupsDelta },
        visitorsNotJoined: {
          value: visitorsNotJoined,
          percent: visitorsNotJoinedPercent,
        },
      },
      visitorActivity: {
        totalVisitors,
        returningVisitors,
        newVisitors,
        returningPercent: totalVisitors > 0 ? Math.round((returningVisitors / totalVisitors) * 100) : 0,
      },
      timeSeries,
      topProblems,
      roleSplit: {
        traveller: travellerCount,
        localGuide: localGuideCount,
        total: travellerCount + localGuideCount,
      },
    };

    // Store in cache
    analyticsCache.set(cacheKey, { timestamp: Date.now(), data: responseData });

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err: any) {
    console.error('[GET /api/admin/analytics] Error:', err);
    return NextResponse.json(
      { ok: false, error: 'Failed to compute analytics' },
      { status: 500 }
    );
  }
}
