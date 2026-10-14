'use client';

import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Wallet, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SummaryCardsProps {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
  };
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const { totalIncome, totalExpense, netBalance } = summary;
  const isSurplus = netBalance >= 0;

  // Calculate savings percentage
  const savingsRate =
    totalIncome > 0
      ? Math.max(0, Math.round((netBalance / totalIncome) * 100))
      : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Net Balance Card (Primary) */}
      <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute -right-3 -bottom-3 opacity-10">
          <Wallet className="w-24 h-24" />
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-300">คงเหลือสุทธิ</span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isSurplus
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {isSurplus ? 'บวกคงเหลือ' : 'ติดลบ'}
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight">
          {formatCurrency(netBalance)}
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
          <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
          <span>อัตราออม: {savingsRate}%</span>
        </div>
      </div>

      {/* 2. Total Income Card */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-500">รายรับทั้งหมด</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-emerald-600 tracking-tight">
          {formatCurrency(totalIncome)}
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          เงินเข้าในเดือนนี้
        </div>
      </div>

      {/* 3. Total Expense Card */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-500">รายจ่ายทั้งหมด</span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-rose-600 tracking-tight">
          {formatCurrency(totalExpense)}
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          ยอดใช้จ่ายทั้งหมด
        </div>
      </div>

      {/* 4. Financial Health / Cash Flow Ratio */}
      <div className="col-span-2 lg:col-span-1 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-500">สัดส่วนใช้จ่าย</span>
            <span className="text-xs font-bold text-slate-700">
              {totalIncome > 0
                ? `${Math.min(100, Math.round((totalExpense / totalIncome) * 100))}%`
                : '0%'}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalExpense > totalIncome
                  ? 'bg-rose-500'
                  : totalExpense / (totalIncome || 1) > 0.8
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${
                  totalIncome > 0
                    ? Math.min(100, (totalExpense / totalIncome) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          {totalExpense > totalIncome
            ? '⚠️ รายจ่ายเกินกว่ารายรับ'
            : totalIncome > 0
            ? '✅ ยอดใช้จ่ายอยู่ในเกณฑ์ควบคุมได้'
            : 'ยังไม่มีข้อมูลรายรับเดือนนี้'}
        </p>
      </div>
    </div>
  );
}
