'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Eye,
  UserPlus,
  UserMinus,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RotateCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase/client';
import { useAdminContext } from '@/components/admin/AdminLayoutClient';
import { formatDisplayIST } from '@/lib/utils/date';

interface KpiData {
  totalVisitors: { value: number; delta: number };
  totalPageViews: { value: number; delta: number };
  waitlistSignups: { value: number; delta: number };
  visitorsNotJoined: { value: number; percent: number };
}

interface VisitorActivityData {
  totalVisitors: number;
  returningVisitors: number;
  newVisitors: number;
  returningPercent: number;
}

interface TimeSeriesPoint {
  key: string;
  visitors: number;
  pageViews: number;
  signups: number;
}

export default function AdminOverviewPage() {
  const { dateRange } = useAdminContext();

  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [visitorActivity, setVisitorActivity] = useState<VisitorActivityData | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [recentSignups, setRecentSignups] = useState<any[]>([]);

  // 1. Fetch Analytics data from Server API
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/analytics?from=${dateRange.from}&to=${dateRange.to}&granularity=${granularity}`
      );
      if (res.ok) {
        const data = await res.json();
        setKpis(data.kpis);
        setVisitorActivity(data.visitorActivity);
        setTimeSeries(data.timeSeries || []);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange.from, dateRange.to, granularity]);

  // 2. Real-time listener for Recent Waitlist Submissions (latest 5)
  useEffect(() => {
    try {
      const q = query(
        collection(clientDb, 'waitlist_submissions'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: any[] = [];
          snapshot.forEach((doc) => {
            const d = doc.data();
            const date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();
            list.push({
              id: doc.id,
              name: d.name || 'Anonymous',
              email: d.email,
              role: d.role || 'traveller',
              travelInterest: d.travelInterest || d.problem || 'General',
              status: d.status || 'new',
              submittedOn: formatDisplayIST(date),
            });
          });
          setRecentSignups(list);
        },
        (error) => {
          console.warn('[onSnapshot Recent Submissions]: Direct read denied or failed:', error.message);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Realtime listener init:', err);
    }
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-[#0F1B33]">
      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Visitors */}
        <div className="bg-[#FAF4EA] border border-[#CDBFA8] rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#3F4A5E] uppercase tracking-wider">
              Total Visitors
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F7F0E5] border border-[#CDBFA8] flex items-center justify-center text-[#9A6420]">
              <Users size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold font-serif text-[#0F1B33]">
            {loading ? '—' : kpis?.totalVisitors.value.toLocaleString() ?? 0}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {kpis && kpis.totalVisitors.delta >= 0 ? (
              <span className="flex items-center text-[#167A3E] font-semibold">
                <TrendingUp size={13} className="mr-0.5" /> +{kpis.totalVisitors.delta}%
              </span>
            ) : (
              <span className="flex items-center text-[#B42318] font-semibold">
                <TrendingDown size={13} className="mr-0.5" /> {kpis?.totalVisitors.delta}%
              </span>
            )}
            <span className="text-[#5B6577] font-medium">vs previous period</span>
          </div>
        </div>

        {/* KPI 2: Total Page Views */}
        <div className="bg-[#FAF4EA] border border-[#CDBFA8] rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#3F4A5E] uppercase tracking-wider">
              Total Page Views
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F7F0E5] border border-[#CDBFA8] flex items-center justify-center text-[#14264A]">
              <Eye size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold font-serif text-[#0F1B33]">
            {loading ? '—' : kpis?.totalPageViews.value.toLocaleString() ?? 0}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {kpis && kpis.totalPageViews.delta >= 0 ? (
              <span className="flex items-center text-[#167A3E] font-semibold">
                <TrendingUp size={13} className="mr-0.5" /> +{kpis.totalPageViews.delta}%
              </span>
            ) : (
              <span className="flex items-center text-[#B42318] font-semibold">
                <TrendingDown size={13} className="mr-0.5" /> {kpis?.totalPageViews.delta}%
              </span>
            )}
            <span className="text-[#5B6577] font-medium">vs previous period</span>
          </div>
        </div>

        {/* KPI 3: Waitlist Signups */}
        <div className="bg-[#FAF4EA] border border-[#CDBFA8] rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#3F4A5E] uppercase tracking-wider">
              Waitlist Signups
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F7F0E5] border border-[#CDBFA8] flex items-center justify-center text-[#9A6420]">
              <UserPlus size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold font-serif text-[#0F1B33]">
            {loading ? '—' : kpis?.waitlistSignups.value.toLocaleString() ?? 0}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {kpis && kpis.waitlistSignups.delta >= 0 ? (
              <span className="flex items-center text-[#167A3E] font-semibold">
                <TrendingUp size={13} className="mr-0.5" /> +{kpis.waitlistSignups.delta}%
              </span>
            ) : (
              <span className="flex items-center text-[#B42318] font-semibold">
                <TrendingDown size={13} className="mr-0.5" /> {kpis?.waitlistSignups.delta}%
              </span>
            )}
            <span className="text-[#5B6577] font-medium">vs previous period</span>
          </div>
        </div>

        {/* KPI 4: Visitors Not Joined */}
        <div className="bg-[#FAF4EA] border border-[#CDBFA8] rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#3F4A5E] uppercase tracking-wider">
              Visitors Not Joined
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F7F0E5] border border-[#CDBFA8] flex items-center justify-center text-[#5B6577]">
              <UserMinus size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold font-serif text-[#0F1B33]">
            {loading ? '—' : kpis?.visitorsNotJoined.value.toLocaleString() ?? 0}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-[#5B6577]">
            <span className="font-semibold text-[#0F1B33]">{kpis?.visitorsNotJoined.percent ?? 0}%</span>
            <span>of total visitors</span>
          </div>
        </div>
      </div>

      {/* CHART & VISITOR ACTIVITY ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart (2 cols) */}
        <div className="lg:col-span-2 bg-[#FAF4EA] border border-[#CDBFA8] rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-serif font-bold text-lg text-[#0F1B33]">
                Website Traffic & Growth
              </h2>
              <p className="text-xs text-[#5B6577] mt-0.5 font-medium">
                Comparison of Unique Visitors vs Total Page Views
              </p>
            </div>

            {/* Granularity Toggle */}
            <div className="flex items-center bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl p-1 self-start sm:self-auto">
              {(['day', 'week', 'month'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGranularity(g)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition border ${
                    granularity === g
                      ? 'bg-[#14264A] text-[#FFFFFF] border-[#14264A] shadow-sm'
                      : 'text-[#3F4A5E] border-transparent hover:text-[#0F1B33]'
                  }`}
                >
                  {g === 'day' ? 'Daily' : g === 'week' ? 'Weekly' : 'Monthly'}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Display */}
          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-[#5B6577]">
                <RotateCw className="animate-spin mr-2" size={16} /> Loading chart data…
              </div>
            ) : timeSeries.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-xs text-[#5B6577]">
                No traffic recorded in this date range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#CDBFA8" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="key"
                    stroke="#5B6577"
                    fontSize={12}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={{ stroke: '#CDBFA8' }}
                  />
                  <YAxis
                    stroke="#5B6577"
                    fontSize={12}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={{ stroke: '#CDBFA8' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FAF4EA',
                      borderColor: '#CDBFA8',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    }}
                    itemStyle={{ color: '#0F1B33', fontWeight: 500 }}
                  />
                  {/* Deep Navy: Line 1 (Visitors) */}
                  <Line
                    type="monotone"
                    name="Visitors"
                    dataKey="visitors"
                    stroke="#14264A"
                    strokeWidth={2.5}
                    dot={{ fill: '#14264A', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                  {/* Warm Gold: Line 2 (Page Views) */}
                  <Line
                    type="monotone"
                    name="Page Views"
                    dataKey="pageViews"
                    stroke="#9A6420"
                    strokeWidth={2}
                    dot={{ fill: '#9A6420', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-[#CDBFA8] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#14264A]" />
              <span className="font-medium text-[#0F1B33]">Unique Visitors</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#9A6420]" />
              <span className="font-medium text-[#0F1B33]">Page Views</span>
            </div>
          </div>
        </div>

        {/* Visitor Activity Card (1 col) */}
        <div className="bg-[#FAF4EA] border border-[#CDBFA8] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#0F1B33] mb-1">
              Visitor Activity
            </h2>
            <p className="text-xs text-[#5B6577] mb-6 font-medium">
              New vs Returning traffic breakdown
            </p>

            <div className="space-y-5">
              <div className="p-4 bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl flex items-center justify-between">
                <div>
                  <span className="block text-xs font-medium text-[#3F4A5E]">Total Visitors</span>
                  <span className="text-2xl font-bold font-serif text-[#0F1B33]">
                    {visitorActivity?.totalVisitors.toLocaleString() ?? 0}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#FAF4EA] border border-[#CDBFA8] flex items-center justify-center text-[#14264A]">
                  <Users size={18} />
                </div>
              </div>

              {/* Returning visitors percentage bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#0F1B33]">Returning Visitors</span>
                  <span className="font-bold text-[#9A6420]">
                    {visitorActivity?.returningPercent ?? 0}% ({visitorActivity?.returningVisitors ?? 0})
                  </span>
                </div>
                <div className="w-full h-3 bg-[#E6DCCD] rounded-full overflow-hidden flex">
                  <div
                    className="bg-[#9A6420] h-full transition-all duration-500"
                    style={{ width: `${visitorActivity?.returningPercent ?? 0}%` }}
                    title="Returning Visitors"
                  />
                  <div
                    className="bg-[#14264A] h-full transition-all duration-500"
                    style={{ width: `${100 - (visitorActivity?.returningPercent ?? 0)}%` }}
                    title="New Visitors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl">
                  <span className="block text-xs font-medium text-[#3F4A5E]">New Visitors</span>
                  <span className="text-lg font-bold text-[#0F1B33]">
                    {visitorActivity?.newVisitors ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl">
                  <span className="block text-xs font-medium text-[#3F4A5E]">Returning</span>
                  <span className="text-lg font-bold text-[#9A6420]">
                    {visitorActivity?.returningVisitors ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-[#CDBFA8] text-xs font-medium text-[#5B6577] text-center">
            Deduplicated daily per Asia/Kolkata (IST)
          </div>
        </div>
      </div>

      {/* RECENT WAITLIST SUBMISSIONS TABLE */}
      <div className="bg-[#FAF4EA] border border-[#CDBFA8] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#0F1B33]">
              Recent Waitlist Submissions
            </h2>
            <p className="text-xs text-[#5B6577] mt-0.5 font-medium">
              Live updates via Firebase Real-Time Firestore Listener
            </p>
          </div>
          <Link
            href="/admin/waitlist"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#14264A] hover:text-[#9A6420] transition"
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {recentSignups.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#5B6577]">
            No recent submissions available yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#CDBFA8] text-[#5B6577] font-medium text-xs">
                  <th className="pb-3 pl-2">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Interest / Challenge</th>
                  <th className="pb-3">Submitted On</th>
                  <th className="pb-3 pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DCCD]">
                {recentSignups.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#F7F0E5] transition">
                    <td className="py-3 pl-2 font-medium text-[#0F1B33]">{sub.name}</td>
                    <td className="py-3 text-[#3F4A5E]">{sub.email}</td>
                    <td className="py-3 capitalize text-[#3F4A5E]">{sub.role}</td>
                    <td className="py-3 text-[#3F4A5E] capitalize">{sub.travelInterest}</td>
                    <td className="py-3 text-[#5B6577]">{sub.submittedOn}</td>
                    <td className="py-3 pr-2">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          sub.status === 'reviewed'
                            ? 'bg-[#DCEAFB] text-[#1F4E8C]'
                            : 'bg-[#FCE8C8] text-[#8A4B00]'
                        }`}
                      >
                        {sub.status === 'reviewed' ? 'Reviewed' : 'New'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
