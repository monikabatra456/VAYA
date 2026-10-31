'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Eye,
  UserPlus,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RotateCw,
  Compass,
  MapPin,
  Check,
  CheckCircle,
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

interface ProblemCount {
  problem: string;
  count: number;
}

interface RoleSplit {
  traveller: number;
  localGuide: number;
  total: number;
}

export default function AdminOverviewPage() {
  const { dateRange } = useAdminContext();

  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [visitorActivity, setVisitorActivity] = useState<VisitorActivityData | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [topProblems, setTopProblems] = useState<ProblemCount[]>([]);
  const [roleSplit, setRoleSplit] = useState<RoleSplit | null>(null);
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
        setTopProblems(data.topProblems || []);
        setRoleSplit(data.roleSplit || null);
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
              email: d.email,
              role: d.role || 'traveller',
              biggestProblem: d.biggestProblem || d.problem || '—',
              consent: Boolean(d.consent),
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

  const maxProblemCount = topProblems.length > 0 ? Math.max(...topProblems.map((p) => p.count), 1) : 1;

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
            <div className="w-9 h-9 rounded-xl bg-[#F7F0E5] border border-[#CDBFA8] flex items-center justify-center text-[#167A3E]">
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
              <Users size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold font-serif text-[#0F1B33]">
            {loading ? '—' : kpis?.visitorsNotJoined.value.toLocaleString() ?? 0}
          </div>
          <div className="mt-2 text-xs text-[#5B6577] font-medium">
            <span className="font-semibold text-[#0F1B33]">
              {kpis?.visitorsNotJoined.percent ?? 0}%
            </span>{' '}
            of total visitors
          </div>
        </div>
      </div>

      {/* TOP TRAVEL PROBLEMS & ROLE SPLIT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Travel Problems Bar List (2 cols) */}
        <div className="lg:col-span-2 bg-[#FAF4EA] border border-[#CDBFA8] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif font-bold text-lg text-[#0F1B33]">
                Top Travel Problems
              </h2>
              <p className="text-xs text-[#5B6577] mt-0.5 font-medium">
                Reported by waitlist subscribers in the selected date range
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center text-xs text-[#5B6577]">
              <RotateCw className="animate-spin text-[#9A6420]" size={20} />
            </div>
          ) : topProblems.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#5B6577]">
              No problem reports recorded for this range.
            </div>
          ) : (
            <div className="space-y-3.5">
              {topProblems.map((item) => {
                const pct = Math.round((item.count / maxProblemCount) * 100);
                return (
                  <div key={item.problem} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#0F1B33]">{item.problem}</span>
                      <span className="text-[#14264A] font-mono">{item.count}</span>
                    </div>
                    <div className="w-full bg-[#EFE7D8] h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#D97706] to-[#F59E0B] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Role Split (1 col) */}
        <div className="bg-[#FAF4EA] border border-[#CDBFA8] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#0F1B33]">
              Traveller vs Local Guide
            </h2>
            <p className="text-xs text-[#5B6577] mt-0.5 font-medium">
              Community breakdown
            </p>

            <div className="mt-6 space-y-4">
              {/* Traveller stat */}
              <div className="p-4 bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center">
                    <Compass size={18} />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#0F1B33]">Travellers</span>
                    <span className="text-xs text-[#5B6577]">Exploring & planning</span>
                  </div>
                </div>
                <span className="text-xl font-bold font-serif text-[#0F1B33]">
                  {roleSplit?.traveller ?? 0}
                </span>
              </div>

              {/* Local guide stat */}
              <div className="p-4 bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#92400E] flex items-center justify-center">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#0F1B33]">Local Guides</span>
                    <span className="text-xs text-[#5B6577]">Guiding & sharing</span>
                  </div>
                </div>
                <span className="text-xl font-bold font-serif text-[#9A6420]">
                  {roleSplit?.localGuide ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#CDBFA8] text-xs font-medium text-[#5B6577] text-center">
            Total Co-Creators: {roleSplit?.total ?? 0}
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
                <tr className="border-b border-[#CDBFA8] text-[#3F4A5E] font-semibold text-xs uppercase tracking-wider">
                  <th className="pb-3 pl-2">Email</th>
                  <th className="pb-3 px-3">I am a</th>
                  <th className="pb-3 px-3">Biggest Problem</th>
                  <th className="pb-3 px-3 text-center">Consent</th>
                  <th className="pb-3 px-3">Submitted On (IST)</th>
                  <th className="pb-3 pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DCCD]">
                {recentSignups.map((sub) => {
                  const isLocalGuide = sub.role === 'local_guide' || sub.role === 'local-guide';
                  return (
                    <tr key={sub.id} className="hover:bg-[#F7F0E5] transition">
                      <td className="py-3 pl-2 font-medium text-[#0F1B33]">{sub.email}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isLocalGuide
                              ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/30'
                              : 'bg-[#E0F2FE] text-[#0369A1] border border-[#0284C7]/30'
                          }`}
                        >
                          {isLocalGuide ? <MapPin size={11} /> : <Compass size={11} />}
                          <span>{isLocalGuide ? 'Local guide' : 'Traveller'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#3F4A5E] font-medium">{sub.biggestProblem}</td>
                      <td className="py-3 px-3 text-center">
                        {sub.consent ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#DCFCE7] text-[#16A34A]">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="text-[#5B6577]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#5B6577] text-xs">{sub.submittedOn}</td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
