'use client';

import React from 'react';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  PlusCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type { LiffUserProfile } from '@/hooks/useLiff';

interface HeaderProps {
  profile: LiffUserProfile | null;
  selectedMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  isLoading: boolean;
  isMockMode?: boolean;
}

export function Header({
  profile,
  selectedMonth,
  onMonthChange,
  onRefresh,
  onOpenAddModal,
  isLoading,
  isMockMode,
}: HeaderProps) {
  // Format current month string into Thai display (e.g. ตุลาคม 2567)
  const formatMonthTitle = (monthStr: string) => {
    const [yearStr, mStr] = monthStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(mStr, 10) - 1;
    const date = new Date(year, month, 1);

    return new Intl.DateTimeFormat('th-TH', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const yStr = prevDate.getFullYear();
    const mStr = String(prevDate.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${yStr}-${mStr}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const yStr = nextDate.getFullYear();
    const mStr = String(nextDate.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${yStr}-${mStr}`);
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-3 safe-area-top">
        {/* Top bar: Profile & Actions */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-500 bg-emerald-50 shrink-0 flex items-center justify-center text-emerald-700 font-bold text-lg shadow-sm">
              {profile?.pictureUrl ? (
                <Image
                  src={profile.pictureUrl}
                  alt={profile.displayName}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                <span>{profile?.displayName?.slice(0, 1) || 'U'}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-slate-900 text-base sm:text-lg truncate">
                  {profile?.displayName || 'กำลังโหลด...'}
                </h1>
                {isMockMode ? (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded-full shrink-0">
                    Dev Preview
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    LINE Sync
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">
                {profile?.statusMessage || 'บันทึกรายรับ-รายจ่ายผ่าน LINE OA'}
              </p>
            </div>
          </div>

          {/* Quick Add & Refresh Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="รีเฟรชข้อมูล"
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`}
              />
            </button>
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-medium rounded-xl shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">เพิ่มรายการ</span>
              <span className="sm:hidden">บันทึก</span>
            </button>
          </div>
        </div>

        {/* Month Selector Bar */}
        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-1.5 border border-slate-200/70">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg active:scale-90 transition-all"
            aria-label="เดือนก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>{formatMonthTitle(selectedMonth)}</span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg active:scale-90 transition-all"
            aria-label="เดือนถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
