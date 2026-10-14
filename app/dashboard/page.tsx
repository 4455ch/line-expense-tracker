'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLiff } from '@/hooks/useLiff';
import { Header } from '@/components/dashboard/Header';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import {
  TransactionList,
  TransactionItem,
} from '@/components/dashboard/TransactionList';
import { AddTransactionModal } from '@/components/dashboard/AddTransactionModal';
import { AlertCircle, LogIn, MessageSquareCode } from 'lucide-react';

interface DashboardData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
  };
  categoryBreakdown: {
    name: string;
    value: number;
    percentage: number;
    color: string;
  }[];
  dailyTrend: {
    date: string;
    income: number;
    expense: number;
  }[];
  transactions: TransactionItem[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

export default function DashboardPage() {
  const {
    profile,
    isReady,
    isLoggedIn,
    login,
    isMockMode,
    setCustomUserId,
  } = useLiff();

  // Current month state in format YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    summary: { totalIncome: 0, totalExpense: 0, netBalance: 0 },
    categoryBreakdown: [],
    dailyTrend: [],
    transactions: [],
    pagination: { page: 1, limit: 20, totalPages: 1, totalItems: 0 },
  });

  // Fetch transactions from API
  const fetchTransactions = useCallback(
    async (targetPage = page, targetMonth = selectedMonth) => {
      if (!profile?.userId) return;

      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          lineUserId: profile.userId,
          month: targetMonth,
          page: String(targetPage),
          limit: '20',
        });

        const res = await fetch(`/api/transactions?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error(`Failed to load data (${res.status})`);
        }

        const data: DashboardData = await res.json();
        setDashboardData(data);
      } catch (err: unknown) {
        console.error('[Dashboard] Fetch error:', err);
        const msg = err instanceof Error ? err.message : 'Error loading dashboard data';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [profile?.userId, page, selectedMonth]
  );

  // Trigger fetch when profile or selected month changes
  useEffect(() => {
    if (profile?.userId) {
      fetchTransactions(page, selectedMonth);
    }
  }, [profile?.userId, selectedMonth, page, fetchTransactions]);

  // Handle month change
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    setPage(1);
  };

  // Handle adding new transaction manually
  const handleAddTransaction = async (data: {
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    categoryName: string;
    note?: string;
    transactionDate: string;
  }) => {
    if (!profile?.userId) return;

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lineUserId: profile.userId,
        ...data,
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to create transaction');
    }

    // Refresh transactions
    await fetchTransactions(1, selectedMonth);
  };

  // Handle deleting transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!profile?.userId) return;

    const res = await fetch(
      `/api/transactions?id=${id}&lineUserId=${profile.userId}`,
      {
        method: 'DELETE',
      }
    );

    if (!res.ok) {
      alert('ไม่สามารถลบรายการได้ กรุณาลองใหม่อีกครั้ง');
      return;
    }

    // Refresh transactions
    await fetchTransactions(page, selectedMonth);
  };

  // 1. Loading screen while LIFF initializes
  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
        <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-semibold text-slate-800">
          กำลังเชื่อมต่อ LINE LIFF...
        </h2>
        <p className="text-xs text-slate-400 mt-1">กรุณารอสักครู่</p>
      </div>
    );
  }

  // 2. Unauthenticated screen (if not logged in and not in mock mode)
  if (!isLoggedIn && !isMockMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-sm">
          <MessageSquareCode className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          เข้าสู่ระบบด้วย LINE
        </h1>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          กรุณาเข้าสู่ระบบผ่านบัญชี LINE เพื่อดูรายงานสรุปรายรับ-รายจ่ายของคุณ
        </p>
        <button
          onClick={login}
          className="flex items-center gap-2 px-6 py-3 bg-[#06C755] hover:bg-[#05b34c] text-white font-medium rounded-xl shadow-md transition-all active:scale-95"
        >
          <LogIn className="w-5 h-5" />
          <span>เข้าสู่ระบบผ่าน LINE</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 safe-area-bottom">
      {/* 1. Header with Avatar & Month Navigation */}
      <Header
        profile={profile}
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
        onRefresh={() => fetchTransactions(page, selectedMonth)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        isLoading={isLoading}
        isMockMode={isMockMode}
      />

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {/* Mock Mode Notice Banner for Developers */}
        {isMockMode && (
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                กำลังอยู่ในโหมดจำลอง (Dev Preview): User ID คือ{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">
                  {profile?.userId}
                </code>
              </span>
            </div>
            <button
              onClick={() => {
                const newId = prompt('ระบุ LINE User ID เพื่อทดสอบ:', profile?.userId);
                if (newId) setCustomUserId(newId);
              }}
              className="text-[11px] font-semibold text-amber-800 underline ml-2 shrink-0"
            >
              เปลี่ยน User ID
            </button>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 2. Monthly Summary Cards */}
        <SummaryCards summary={dashboardData.summary} />

        {/* 3. Expense Charts (Recharts Donut & Bar) */}
        <ExpenseChart
          categoryBreakdown={dashboardData.categoryBreakdown}
          dailyTrend={dashboardData.dailyTrend}
          totalExpense={dashboardData.summary.totalExpense}
        />

        {/* 4. Transaction List Table / Mobile Cards */}
        <TransactionList
          transactions={dashboardData.transactions}
          pagination={dashboardData.pagination}
          onPageChange={(newPage) => setPage(newPage)}
          onDeleteTransaction={handleDeleteTransaction}
          isLoading={isLoading}
        />
      </div>

      {/* 5. Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddTransaction}
      />
    </div>
  );
}
