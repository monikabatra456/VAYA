'use client';

import React, { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
} from 'lucide-react';
import { getTodayIST } from '@/lib/utils/date';

export type DateRangePreset = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface DateRangeState {
  preset: DateRangePreset;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

interface AdminContextType {
  dateRange: DateRangeState;
  setDateRange: (range: DateRangeState) => void;
  userEmail: string;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdminContext() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error('useAdminContext must be used within AdminLayoutClient');
  }
  return ctx;
}

function calculatePresetDates(preset: DateRangePreset): { from: string; to: string } {
  const today = getTodayIST();
  const now = new Date();

  if (preset === 'today') {
    return { from: today, to: today };
  }

  let daysBack = 7;
  if (preset === '30d') daysBack = 30;
  if (preset === '90d') daysBack = 90;

  const past = new Date(now.getTime() - (daysBack - 1) * 24 * 60 * 60 * 1000);
  const from = past.toISOString().slice(0, 10);
  return { from, to: today };
}

export default function AdminLayoutClient({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [dateRange, setDateRangeState] = useState<DateRangeState>(() => {
    const dates = calculatePresetDates('30d');
    return { preset: '30d', ...dates };
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(dateRange.from);
  const [customTo, setCustomTo] = useState(dateRange.to);

  const handlePresetSelect = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setCustomModalOpen(true);
      return;
    }
    const dates = calculatePresetDates(preset);
    setDateRangeState({ preset, ...dates });
  };

  const handleApplyCustom = () => {
    if (customFrom && customTo) {
      setDateRangeState({ preset: 'custom', from: customFrom, to: customTo });
      setCustomModalOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/session', { method: 'DELETE' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Waitlist', href: '/admin/waitlist', icon: Users },
  ];

  return (
    <AdminContext.Provider value={{ dateRange, setDateRange: setDateRangeState, userEmail }}>
      <div className="min-h-screen bg-[#F7F0E5] text-[#0F1B33] flex flex-col md:flex-row font-sans">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-[#FAF4EA] border-b border-[#CDBFA8]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#0F1B33] border border-[#CDBFA8] hover:bg-[#EFE7D8]"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/vaya-logo-500.webp" alt="VAYA" className="h-7 w-auto" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              className="w-8 h-8 rounded-full bg-[#14264A] text-[#FAF4EA] border border-[#CDBFA8] flex items-center justify-center font-medium text-xs"
            >
              {userEmail.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>

        {/* Left Sidebar / Mobile Full-Screen Sheet */}
        <aside
          className={`fixed inset-0 z-50 w-full bg-[#FAF4EA] border-r border-[#CDBFA8] p-6 flex flex-col justify-between transition-transform duration-200 md:static md:w-64 md:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div>
            {/* Logo & Mobile Close */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/vaya-logo-500.webp"
                alt="VAYA"
                className="h-10 w-auto object-contain"
              />
              <div>
                <span className="font-serif font-bold text-lg tracking-wider text-[#0F1B33]">VAYA</span>
                <span className="block text-[11px] tracking-widest text-[#9A6420] font-semibold uppercase">
                  Admin Panel
                </span>
              </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden p-2 rounded-lg text-[#0F1B33] border border-[#CDBFA8] hover:bg-[#EFE7D8]"
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#14264A] text-[#FFFFFF] shadow-sm'
                        : 'text-[#3F4A5E] hover:text-[#0F1B33] hover:bg-[#EFE7D8]'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-[#F2B84B]' : 'text-[#5B6577]'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer note */}
          <div className="pt-6 border-t border-[#CDBFA8]">
            <div className="flex items-center justify-between text-xs text-[#5B6577]">
              <span className="font-medium">VAYA Admin Panel</span>
              <span className="text-xs bg-[#EFE7D8] text-[#0F1B33] px-2 py-0.5 rounded-full font-medium border border-[#CDBFA8]">v3.0</span>
            </div>
            <div className="mt-2 text-xs text-[#5B6577] truncate font-medium" title={userEmail}>
              {userEmail}
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/25 z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar Header */}
          <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-[#CDBFA8] bg-[#FAF4EA]">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#0F1B33]">
                {pathname === '/admin/waitlist' ? 'Waitlist Submissions' : 'Analytics & Performance'}
              </h1>
              <p className="text-xs text-[#5B6577] mt-0.5 font-medium">
                {pathname === '/admin/waitlist'
                  ? 'Real-time viewer and manager for early access registrations'
                  : 'Platform traffic, conversion intelligence and visitor engagement'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Date-Range Dropdown */}
              <div className="relative">
                <div className="flex items-center bg-[#F7F0E5] border border-[#CDBFA8] rounded-xl px-3 py-1.5 shadow-sm">
                  <Calendar size={15} className="text-[#9A6420] mr-2" />
                  <select
                    value={dateRange.preset}
                    onChange={(e) => handlePresetSelect(e.target.value as DateRangePreset)}
                    className="bg-transparent text-xs font-medium text-[#0F1B33] outline-none cursor-pointer pr-4"
                  >
                    <option value="today">Today</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="custom">Custom Range…</option>
                  </select>
                </div>
              </div>

              {/* Admin Avatar Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                  className="flex items-center gap-2 bg-[#F7F0E5] border border-[#CDBFA8] rounded-full p-1 pr-3 hover:bg-[#EFE7D8] transition"
                >
                  <div className="w-8 h-8 rounded-full bg-[#14264A] text-[#FFFFFF] flex items-center justify-center text-xs font-semibold">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-[#0F1B33] max-w-[120px] truncate">
                    {userEmail.split('@')[0]}
                  </span>
                  <ChevronDown size={14} className="text-[#5B6577]" />
                </button>

                {avatarMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#FAF4EA] border border-[#CDBFA8] rounded-2xl shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-[#CDBFA8]">
                      <span className="block text-xs text-[#5B6577] uppercase tracking-wider font-semibold">
                        Signed in as
                      </span>
                      <span className="block text-xs font-medium text-[#0F1B33] truncate">{userEmail}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#B42318] hover:bg-[#FEE2E2] transition text-left font-medium"
                    >
                      <LogOut size={15} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Subheader / Mobile Date Filter */}
          <div className="md:hidden flex items-center justify-between p-4 bg-[#FAF4EA] border-b border-[#CDBFA8]">
            <span className="text-xs font-medium text-[#3F4A5E]">Range:</span>
            <select
              value={dateRange.preset}
              onChange={(e) => handlePresetSelect(e.target.value as DateRangePreset)}
              className="bg-[#F7F0E5] border border-[#CDBFA8] rounded-lg px-2.5 py-1 text-xs font-medium text-[#0F1B33]"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="custom">Custom…</option>
            </select>
          </div>

          {/* Main Page Content */}
          <main className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Custom Date Range Modal */}
        {customModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#FAF4EA] border border-[#CDBFA8] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="font-serif font-bold text-lg text-[#0F1B33] mb-4">Select Date Range</h3>
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#3F4A5E] font-medium text-xs mb-1">From Date (IST):</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full bg-[#FAF4EA] border border-[#CDBFA8] rounded-xl px-3 py-2 text-sm text-[#0F1B33] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#3F4A5E] font-medium text-xs mb-1">To Date (IST):</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full bg-[#FAF4EA] border border-[#CDBFA8] rounded-xl px-3 py-2 text-sm text-[#0F1B33] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setCustomModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#3F4A5E] border border-[#CDBFA8] rounded-xl hover:text-[#0F1B33] hover:bg-[#EFE7D8]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  className="px-4 py-2 bg-[#14264A] text-white border border-[#14264A] rounded-xl text-xs font-medium hover:bg-[#1E3056]"
                >
                  Apply Range
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminContext.Provider>
  );
}
