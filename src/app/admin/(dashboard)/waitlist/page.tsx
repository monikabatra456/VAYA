'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Download,
  Filter,
  CheckCircle,
  XCircle,
  Check,
  RotateCw,
  ChevronRight,
  User,
  Compass,
  MapPin,
  Calendar,
  ShieldCheck,
  Smartphone,
  Globe,
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase/client';
import { useAdminContext } from '@/components/admin/AdminLayoutClient';
import { formatDisplayIST } from '@/lib/utils/date';
import { VALID_PROBLEMS } from '@/lib/constants/waitlist';

interface WaitlistRow {
  id: string;
  email: string;
  emailLower?: string;
  role: 'traveller' | 'local_guide' | string;
  biggestProblem: string;
  consent: boolean;
  status: 'new' | 'reviewed';
  submittedOn: string;
  visitorId: string | null;
  isRealtimeNew?: boolean;
}

export default function WaitlistPage() {
  const { dateRange } = useAdminContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'reviewed'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'traveller' | 'local_guide'>('all');
  const [problemFilter, setProblemFilter] = useState<string>('all');

  const [items, setItems] = useState<WaitlistRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Real-time toast & banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasNewRealtimeUpdates, setHasNewRealtimeUpdates] = useState(false);

  // Drawer details state
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [drawerData, setDrawerData] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // 1. Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const isFiltered =
    debouncedSearch !== '' ||
    statusFilter !== 'all' ||
    roleFilter !== 'all' ||
    problemFilter !== 'all';

  // 2. Fetch submissions via Server API
  const fetchSubmissions = async (cursor: string | null = null) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      let url = `/api/admin/waitlist?status=${statusFilter}&role=${roleFilter}&problem=${encodeURIComponent(problemFilter)}&limit=25`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (dateRange.from) url += `&from=${dateRange.from}`;
      if (dateRange.to) url += `&to=${dateRange.to}`;
      if (cursor) url += `&startAfter=${cursor}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (cursor) {
          setItems((prev) => [...prev, ...data.items]);
        } else {
          setItems(data.items);
        }
        setNextCursor(data.nextCursor);
      }
    } catch (err) {
      console.error('Failed to fetch waitlist:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(null);
  }, [debouncedSearch, statusFilter, roleFilter, problemFilter, dateRange.from, dateRange.to]);

  // 3. Real-time Firestore Listener
  const initialMountRef = useRef(true);
  useEffect(() => {
    try {
      const q = query(
        collection(clientDb, 'waitlist_submissions'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (initialMountRef.current) {
            initialMountRef.current = false;
            return;
          }

          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const d = change.doc.data();
              const email = d.email || 'A new user';

              // Show Toast
              setToastMessage(`New signup: ${email}`);
              setTimeout(() => setToastMessage(null), 5000);

              if (isFiltered) {
                setHasNewRealtimeUpdates(true);
              } else {
                // Prepend directly into items
                const date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();
                const newRow: WaitlistRow = {
                  id: change.doc.id,
                  email: d.email,
                  emailLower: d.emailLower,
                  role: d.role || 'traveller',
                  biggestProblem: d.biggestProblem || d.problem || '—',
                  consent: Boolean(d.consent),
                  status: d.status || 'new',
                  submittedOn: formatDisplayIST(date),
                  visitorId: d.visitorId || null,
                  isRealtimeNew: true,
                };
                setItems((prev) => [newRow, ...prev.filter((i) => i.id !== newRow.id)]);
              }
            }
          });
        },
        (err) => {
          console.warn('[onSnapshot Waitlist]:', err.message);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Listener error:', err);
    }
  }, [isFiltered]);

  // 4. Drawer row details fetch
  const handleOpenDrawer = async (id: string) => {
    setSelectedSubmissionId(id);
    setDrawerLoading(true);
    setDrawerData(null);

    try {
      const res = await fetch(`/api/admin/waitlist/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDrawerData(data.submission);
      }
    } catch (err) {
      console.error('Failed to load submission details:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  // 5. Status Toggle (New <-> Reviewed)
  const handleToggleStatus = async () => {
    if (!drawerData) return;
    const newStatus = drawerData.status === 'new' ? 'reviewed' : 'new';
    setUpdatingStatus(true);

    try {
      const res = await fetch(`/api/admin/waitlist/${drawerData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setDrawerData((prev: any) => ({ ...prev, status: newStatus }));
        setItems((prev) =>
          prev.map((item) =>
            item.id === drawerData.id ? { ...item, status: newStatus } : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // 6. CSV Export Trigger
  const handleExportCsv = () => {
    let url = `/api/admin/export?status=${statusFilter}&role=${roleFilter}&problem=${encodeURIComponent(problemFilter)}`;
    if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
    if (dateRange.from) url += `&from=${dateRange.from}`;
    if (dateRange.to) url += `&to=${dateRange.to}`;
    window.location.href = url;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[#0F1B33]">
      {/* Real-time Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#14264A] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#CDBFA8] animate-bounce">
          <CheckCircle className="text-[#F2B84B]" size={18} />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* FILTER & CONTROLS TOOLBAR */}
      <div className="bg-[#FAF4EA] border border-[#CDBFA8] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Email Prefix Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6577]" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email prefix…"
              className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#CDBFA8] rounded-xl text-sm font-medium text-[#0F1B33] placeholder-[#5B6577] focus:outline-none focus:ring-2 focus:ring-[#14264A] transition"
            />
          </div>

          {/* Filter Controls Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-[#FFFFFF] border border-[#CDBFA8] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F1B33] focus:outline-none focus:ring-2 focus:ring-[#14264A]"
            >
              <option value="all">All Roles</option>
              <option value="traveller">Traveller</option>
              <option value="local_guide">Local Guide</option>
            </select>

            {/* Problem Filter */}
            <select
              value={problemFilter}
              onChange={(e) => setProblemFilter(e.target.value)}
              className="bg-[#FFFFFF] border border-[#CDBFA8] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F1B33] focus:outline-none focus:ring-2 focus:ring-[#14264A]"
            >
              <option value="all">All Problems</option>
              {VALID_PROBLEMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Status Segmented Buttons */}
            <div className="flex bg-[#F7F0E5] p-1 rounded-xl border border-[#CDBFA8]">
              {(['all', 'new', 'reviewed'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    statusFilter === s
                      ? 'bg-[#FFFFFF] text-[#0F1B33] shadow-sm'
                      : 'text-[#3F4A5E] hover:text-[#0F1B33]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-2 bg-[#14264A] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm hover:bg-[#1E3056] transition whitespace-nowrap"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Update Banner */}
      {hasNewRealtimeUpdates && (
        <div className="flex items-center justify-between bg-[#FCE8C8] border border-[#CDBFA8] text-[#8A4B00] px-4 py-2.5 rounded-xl text-xs font-semibold">
          <span>New submissions are available in your live stream.</span>
          <button
            type="button"
            onClick={() => {
              setHasNewRealtimeUpdates(false);
              fetchSubmissions(null);
            }}
            className="bg-[#8A4B00] text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-[#6D3B00]"
          >
            Refresh List
          </button>
        </div>
      )}

      {/* SUBMISSIONS TABLE */}
      <div className="bg-[#FAF4EA] border border-[#CDBFA8] rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-xs text-[#5B6577]">
            <RotateCw className="animate-spin mb-3 text-[#9A6420]" size={24} />
            <span>Loading waitlist submissions…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#5B6577]">
            No submissions found matching your filters.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#F7F0E5] border-b border-[#CDBFA8] text-[#3F4A5E] font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3.5 pl-6">Email</th>
                    <th className="py-3.5 px-4">I am a</th>
                    <th className="py-3.5 px-4">Biggest Problem</th>
                    <th className="py-3.5 px-4 text-center">Consent</th>
                    <th className="py-3.5 px-4">Submitted On (IST)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 pr-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DCCD]">
                  {items.map((sub) => {
                    const isLocalGuide = sub.role === 'local_guide' || sub.role === 'local-guide';
                    return (
                      <tr
                        key={sub.id}
                        onClick={() => handleOpenDrawer(sub.id)}
                        className={`cursor-pointer hover:bg-[#F7F0E5] transition ${
                          sub.isRealtimeNew ? 'bg-[#FCE8C8]/50' : ''
                        }`}
                      >
                        <td className="py-4 pl-6 font-semibold text-[#0F1B33]">{sub.email}</td>
                        <td className="py-4 px-4">
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
                        <td className="py-4 px-4 text-[#3F4A5E] font-medium">{sub.biggestProblem}</td>
                        <td className="py-4 px-4 text-center">
                          {sub.consent ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#DCFCE7] text-[#16A34A]">
                              <Check size={12} strokeWidth={3} />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FEE2E2] text-[#DC2626]">
                              <XCircle size={12} />
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-[#3F4A5E] whitespace-nowrap text-xs font-medium">
                          {sub.submittedOn}
                        </td>
                        <td className="py-4 px-4">
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
                        <td className="py-4 pr-6 text-right text-[#5B6577]">
                          <ChevronRight size={16} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked View */}
            <div className="md:hidden divide-y divide-[#E6DCCD]">
              {items.map((sub) => {
                const isLocalGuide = sub.role === 'local_guide' || sub.role === 'local-guide';
                return (
                  <div
                    key={sub.id}
                    onClick={() => handleOpenDrawer(sub.id)}
                    className="p-4 space-y-2 hover:bg-[#F7F0E5] transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#0F1B33]">{sub.email}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          sub.status === 'reviewed'
                            ? 'bg-[#DCEAFB] text-[#1F4E8C]'
                            : 'bg-[#FCE8C8] text-[#8A4B00]'
                        }`}
                      >
                        {sub.status === 'reviewed' ? 'Reviewed' : 'New'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
                          isLocalGuide
                            ? 'bg-[#FEF3C7] text-[#92400E]'
                            : 'bg-[#E0F2FE] text-[#0369A1]'
                        }`}
                      >
                        {isLocalGuide ? 'Local guide' : 'Traveller'}
                      </span>
                      <span className="text-[#3F4A5E]">{sub.biggestProblem}</span>
                    </div>
                    <div className="text-xs text-[#5B6577] pt-1">{sub.submittedOn}</div>
                  </div>
                );
              })}
            </div>

            {/* Pagination / Load More */}
            {nextCursor && (
              <div className="p-4 bg-[#F7F0E5] border-t border-[#CDBFA8] flex justify-center">
                <button
                  type="button"
                  onClick={() => fetchSubmissions(nextCursor)}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#FAF4EA] border border-[#CDBFA8] text-xs font-semibold text-[#0F1B33] hover:bg-[#EFE7D8] transition disabled:opacity-60"
                >
                  {loadingMore ? <RotateCw className="animate-spin" size={14} /> : null}
                  <span>Load More Submissions</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* RIGHT-SIDE DETAILS DRAWER */}
      {selectedSubmissionId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedSubmissionId(null)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-lg bg-[#FAF4EA] border-l border-[#CDBFA8] shadow-2xl h-full flex flex-col justify-between overflow-y-auto z-10 p-6 sm:p-8">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[#CDBFA8]">
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#0F1B33]">
                    Submission Details
                  </h3>
                  <span className="text-xs text-[#5B6577] font-mono">
                    ID: {selectedSubmissionId.slice(0, 16)}…
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSubmissionId(null)}
                  className="p-2 rounded-full hover:bg-[#F7F0E5] text-[#3F4A5E] transition"
                  aria-label="Close drawer"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {drawerLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-xs text-[#5B6577]">
                  <RotateCw className="animate-spin mb-3 text-[#9A6420]" size={24} />
                  <span>Loading details…</span>
                </div>
              ) : drawerData ? (
                <div className="mt-6 space-y-6">
                  {/* Status & Action */}
                  <div className="flex items-center justify-between p-4 bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl">
                    <div>
                      <span className="block text-xs font-semibold text-[#3F4A5E]">Current Status</span>
                      <span
                        className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${
                          drawerData.status === 'reviewed'
                            ? 'bg-[#DCEAFB] text-[#1F4E8C]'
                            : 'bg-[#FCE8C8] text-[#8A4B00]'
                        }`}
                      >
                        {drawerData.status === 'reviewed' ? 'Reviewed' : 'New'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleStatus}
                      disabled={updatingStatus}
                      className="px-4 py-2 bg-[#14264A] text-white rounded-xl text-xs font-semibold hover:bg-[#1E3056] transition disabled:opacity-60"
                    >
                      {updatingStatus
                        ? 'Updating…'
                        : drawerData.status === 'new'
                        ? 'Mark as Reviewed'
                        : 'Revert to New'}
                    </button>
                  </div>

                  {/* Submission Fields */}
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="block text-xs font-semibold text-[#3F4A5E] uppercase tracking-wider mb-1">
                        Email Address
                      </span>
                      <span className="font-semibold text-[#0F1B33]">{drawerData.email}</span>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-[#3F4A5E] uppercase tracking-wider mb-1">
                        I am a
                      </span>
                      <span className="font-medium text-[#0F1B33] capitalize">
                        {drawerData.role === 'local_guide' ? 'Local guide' : 'Traveller'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-[#3F4A5E] uppercase tracking-wider mb-1">
                        Biggest Travel Problem
                      </span>
                      <span className="font-medium text-[#0F1B33]">{drawerData.biggestProblem}</span>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-[#3F4A5E] uppercase tracking-wider mb-1">
                        Consent Given
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#16A34A]">
                        <Check size={16} /> Yes, agreed to receive updates
                      </span>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-[#3F4A5E] uppercase tracking-wider mb-1">
                        Submitted On (IST)
                      </span>
                      <span className="font-medium text-[#0F1B33]">{drawerData.submittedOn}</span>
                    </div>
                  </div>

                  {/* Visitor Journey Info */}
                  {drawerData.visitor ? (
                    <div className="pt-6 border-t border-[#CDBFA8] space-y-3">
                      <h4 className="font-semibold text-xs text-[#3F4A5E] uppercase tracking-wider">
                        Linked Visitor Profile
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs bg-[#F7F0E5] p-4 rounded-xl border border-[#CDBFA8]">
                        <div>
                          <span className="block text-[#5B6577]">Device:</span>
                          <span className="font-semibold capitalize">{drawerData.visitor.device}</span>
                        </div>
                        <div>
                          <span className="block text-[#5B6577]">Referrer:</span>
                          <span className="font-semibold truncate">{drawerData.visitor.referrer}</span>
                        </div>
                        <div>
                          <span className="block text-[#5B6577]">First Seen:</span>
                          <span className="font-semibold">{drawerData.visitor.firstSeenOn}</span>
                        </div>
                        <div>
                          <span className="block text-[#5B6577]">Visit Days:</span>
                          <span className="font-semibold">{drawerData.visitor.visitDays} day(s)</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
