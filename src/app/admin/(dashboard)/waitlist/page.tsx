'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Download,
  Filter,
  CheckCircle,
  Clock,
  ExternalLink,
  X,
  ChevronRight,
  RotateCw,
  Bell,
  Smartphone,
  Globe,
  Compass,
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase/client';
import { useAdminContext } from '@/components/admin/AdminLayoutClient';
import { formatDisplayIST } from '@/lib/utils/date';

interface WaitlistRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  problem: string;
  travelInterest: string;
  destination: string;
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

  const isFiltered = debouncedSearch !== '' || statusFilter !== 'all';

  // 2. Fetch submissions via Server API
  const fetchSubmissions = async (cursor: string | null = null) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      let url = `/api/admin/waitlist?status=${statusFilter}&limit=25`;
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
  }, [debouncedSearch, statusFilter, dateRange.from, dateRange.to]);

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
              const name = d.name || 'A new traveller';

              // Show Toast
              setToastMessage(`New signup: ${name}`);
              setTimeout(() => setToastMessage(null), 5000);

              if (isFiltered) {
                setHasNewRealtimeUpdates(true);
              } else {
                // Prepend directly into items
                const date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();
                const newRow: WaitlistRow = {
                  id: change.doc.id,
                  name: d.name || 'Anonymous',
                  email: d.email,
                  phone: d.phone || '—',
                  role: d.role || 'traveller',
                  problem: d.problem || '—',
                  travelInterest: d.travelInterest || d.problem || 'General',
                  destination: d.destination || '—',
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
          prev.map((item) => (item.id === drawerData.id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Keyboard Escape listener for drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedSubmissionId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 6. Export CSV Handler
  const handleExportCsv = () => {
    let url = `/api/admin/export?status=${statusFilter}`;
    if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
    if (dateRange.from) url += `&from=${dateRange.from}`;
    if (dateRange.to) url += `&to=${dateRange.to}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative text-[#0F1B33]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#14264A] text-[#FFFFFF] border border-[#9A6420] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Bell size={18} className="text-[#9A6420]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* FILTER & ACTIONS BAR */}
      <div className="bg-[#FAF4EA] border border-[#CDBFA8] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6577]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email or phone (starts with)"
            className="w-full bg-[#FAF4EA] border border-[#CDBFA8] rounded-xl pl-10 pr-4 py-2 text-sm text-[#0F1B33] placeholder-[#6B7385] outline-none focus:border-[#14264A] transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6577] hover:text-[#0F1B33]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter & Export Button */}
        <div className="flex items-center gap-3 self-end md:self-auto w-full md:w-auto">
          {/* Status Filter Pills */}
          <div className="flex items-center bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl p-1 text-xs">
            {(['all', 'new', 'reviewed'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition border ${
                  statusFilter === s
                    ? 'bg-[#14264A] text-white border-[#14264A] shadow-sm'
                    : 'text-[#3F4A5E] border-transparent hover:text-[#0F1B33]'
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
            className="flex items-center gap-2 bg-[#14264A] text-white border border-[#14264A] px-4 py-2 rounded-xl text-xs font-semibold shadow-sm hover:bg-[#1E3056] transition whitespace-nowrap ml-auto md:ml-0"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Real-time Update Chip for Filtered Views */}
      {hasNewRealtimeUpdates && (
        <div className="flex items-center justify-between bg-[#FCE8C8] border border-[#CDBFA8] text-[#8A4B00] px-4 py-2.5 rounded-xl text-xs font-medium">
          <span>New submissions are available that match your live stream.</span>
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

      {/* SUBMISSIONS TABLE & CARDS */}
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
                  <tr className="bg-[#F7F0E5] border-b border-[#CDBFA8] text-[#5B6577] font-medium text-xs">
                    <th className="py-3.5 pl-6">Name</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Interest / Challenge</th>
                    <th className="py-3.5 px-4">Destination</th>
                    <th className="py-3.5 px-4">Submitted On</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 pr-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DCCD]">
                  {items.map((sub) => (
                    <tr
                      key={sub.id}
                      onClick={() => handleOpenDrawer(sub.id)}
                      className={`cursor-pointer hover:bg-[#F7F0E5] transition ${
                        sub.isRealtimeNew ? 'bg-[#FCE8C8]/40' : ''
                      }`}
                    >
                      <td className="py-4 pl-6 font-semibold text-[#0F1B33]">{sub.name}</td>
                      <td className="py-4 px-4 text-[#3F4A5E]">{sub.email}</td>
                      <td className="py-4 px-4 text-[#3F4A5E]">{sub.phone}</td>
                      <td className="py-4 px-4 text-[#3F4A5E] capitalize">{sub.travelInterest}</td>
                      <td className="py-4 px-4 text-[#3F4A5E]">{sub.destination}</td>
                      <td className="py-4 px-4 text-[#5B6577] whitespace-nowrap">{sub.submittedOn}</td>
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards View */}
            <div className="md:hidden divide-y divide-[#E6DCCD]">
              {items.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => handleOpenDrawer(sub.id)}
                  className="p-4 space-y-2 hover:bg-[#F7F0E5] transition cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[#0F1B33]">{sub.name}</span>
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
                  <div className="text-sm text-[#3F4A5E]">{sub.email}</div>
                  <div className="flex items-center justify-between text-xs text-[#5B6577] pt-1">
                    <span>{sub.travelInterest}</span>
                    <span>{sub.submittedOn}</span>
                  </div>
                </div>
              ))}
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
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
                  className="p-1.5 rounded-xl border border-[#CDBFA8] hover:bg-[#EFE7D8] text-[#5B6577]"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {drawerLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-xs text-[#5B6577]">
                  <RotateCw className="animate-spin mb-3 text-[#9A6420]" size={20} />
                  <span>Loading full record…</span>
                </div>
              ) : drawerData ? (
                <div className="mt-6 space-y-6 text-xs">
                  {/* Status & Action */}
                  <div className="flex items-center justify-between p-4 bg-[#F7F0E5] border border-[#CDBFA8] rounded-2xl">
                    <div>
                      <span className="block text-xs font-medium text-[#3F4A5E]">Review Status</span>
                      <span
                        className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${
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
                      className="px-4 py-2 bg-[#14264A] text-white border border-[#14264A] rounded-xl text-xs font-semibold hover:bg-[#1E3056] transition"
                    >
                      {updatingStatus
                        ? 'Updating…'
                        : drawerData.status === 'new'
                        ? 'Mark as Reviewed'
                        : 'Mark as New'}
                    </button>
                  </div>

                  {/* Form Submission Fields */}
                  <div className="space-y-3">
                    <h4 className="font-serif font-bold text-sm text-[#0F1B33]">Applicant Profile</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl">
                        <span className="block text-[#5B6577] text-xs font-medium uppercase">Name</span>
                        <span className="font-semibold text-sm text-[#0F1B33]">{drawerData.name}</span>
                      </div>
                      <div className="p-3 bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl">
                        <span className="block text-[#5B6577] text-xs font-medium uppercase">Email</span>
                        <span className="font-medium text-sm text-[#0F1B33] break-all">{drawerData.email}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl">
                        <span className="block text-[#5B6577] text-xs font-medium uppercase">Phone</span>
                        <span className="font-medium text-sm text-[#0F1B33]">{drawerData.phone}</span>
                      </div>
                      <div className="p-3 bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl">
                        <span className="block text-[#5B6577] text-xs font-medium uppercase">Role</span>
                        <span className="font-medium text-sm text-[#0F1B33] capitalize">{drawerData.role}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl">
                      <span className="block text-[#5B6577] text-xs font-medium uppercase">Travel Challenge</span>
                      <span className="font-medium text-sm text-[#0F1B33] capitalize">{drawerData.problem}</span>
                    </div>

                    <div className="p-3 bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl">
                      <span className="block text-[#5B6577] text-xs font-medium uppercase">Destination</span>
                      <span className="font-medium text-sm text-[#0F1B33]">{drawerData.destination}</span>
                    </div>

                    <div className="p-3 bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl">
                      <span className="block text-[#5B6577] text-xs font-medium uppercase">Timestamp (IST)</span>
                      <span className="font-medium text-sm text-[#0F1B33]">{drawerData.submittedOn}</span>
                    </div>
                  </div>

                  {/* Linked Visitor Intelligence */}
                  <div className="space-y-3 pt-4 border-t border-[#CDBFA8]">
                    <h4 className="font-serif font-bold text-sm text-[#0F1B33] flex items-center gap-2">
                      <Globe size={15} className="text-[#9A6420]" />
                      <span>Linked Visitor Intelligence</span>
                    </h4>

                    {drawerData.visitor ? (
                      <div className="space-y-2 bg-[#F7F0E5] border border-[#CDBFA8] rounded-2xl p-4">
                        <div className="flex justify-between py-1 border-b border-[#CDBFA8]">
                          <span className="text-[#5B6577] font-medium text-xs">Device:</span>
                          <span className="font-semibold capitalize text-[#0F1B33] text-xs">
                            {drawerData.visitor.device}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#CDBFA8]">
                          <span className="text-[#5B6577] font-medium text-xs">Referrer:</span>
                          <span className="font-medium text-[#0F1B33] text-xs truncate max-w-[200px]">
                            {drawerData.visitor.referrer}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#CDBFA8]">
                          <span className="text-[#5B6577] font-medium text-xs">Campaign / UTM:</span>
                          <span className="font-medium text-[#0F1B33] text-xs">
                            {drawerData.visitor.utmCampaign} ({drawerData.visitor.utmSource})
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#CDBFA8]">
                          <span className="text-[#5B6577] font-medium text-xs">Days Visited:</span>
                          <span className="font-semibold text-[#0F1B33] text-xs">
                            {drawerData.visitor.visitDays}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#5B6577] font-medium text-xs">First Seen On:</span>
                          <span className="font-medium text-[#0F1B33] text-xs">
                            {drawerData.visitor.firstSeenOn}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl text-[#5B6577] text-xs">
                        No linked visitor cookie was captured for this submission.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-6 border-t border-[#CDBFA8] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSubmissionId(null)}
                className="px-5 py-2 bg-[#FAF4EA] border border-[#CDBFA8] rounded-xl text-xs font-semibold text-[#0F1B33] hover:bg-[#EFE7D8]"
              >
                Close Drawer (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
