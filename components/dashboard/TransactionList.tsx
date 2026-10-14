'use client';

import React, { useState } from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Banknote,
  Home,
  Film,
  HeartPulse,
  GraduationCap,
  Tag,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
} from 'lucide-react';
import { formatCurrency, formatThaiDate } from '@/lib/utils';

export interface TransactionItem {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  categoryName: string;
  note?: string | null;
  transactionDate: string;
  createdAt: string;
}

interface TransactionListProps {
  transactions: TransactionItem[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
  onPageChange: (newPage: number) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function TransactionList({
  transactions,
  pagination,
  onPageChange,
  onDeleteTransaction,
  isLoading,
}: TransactionListProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Return relevant icon based on category name
  const getCategoryIcon = (category: string, type: 'INCOME' | 'EXPENSE') => {
    const cat = category.toLowerCase();
    if (type === 'INCOME') return <Banknote className="w-4 h-4 text-emerald-600" />;

    if (/อาหาร|กิน|กาแฟ|น้ำ|ข้าว|ขนม/.test(cat))
      return <Utensils className="w-4 h-4 text-amber-600" />;
    if (/เดินทาง|รถ|น้ำมัน|bts|mrt|แท็กซี่/.test(cat))
      return <Car className="w-4 h-4 text-blue-600" />;
    if (/ช้อป|ซื้อ|เสื้อ|shopee|lazada/.test(cat))
      return <ShoppingBag className="w-4 h-4 text-purple-600" />;
    if (/บ้าน|หอ|ไฟ|น้ำ|เน็ต|บิล/.test(cat))
      return <Home className="w-4 h-4 text-cyan-600" />;
    if (/บันเทิง|หนัง|เที่ยว|เกม/.test(cat))
      return <Film className="w-4 h-4 text-pink-600" />;
    if (/ยา|แพทย์|หมอ|สุขภาพ/.test(cat))
      return <HeartPulse className="w-4 h-4 text-rose-600" />;
    if (/เรียน|หนังสือ|คอร์ส/.test(cat))
      return <GraduationCap className="w-4 h-4 text-indigo-600" />;

    return <Tag className="w-4 h-4 text-slate-600" />;
  };

  // Filter list by type and search query
  const filteredTransactions = transactions.filter((tx) => {
    const matchesType =
      filterType === 'ALL' || tx.type === filterType;
    const matchesSearch =
      searchQuery === '' ||
      tx.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesSearch;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
      setDeletingId(id);
      try {
        await onDeleteTransaction(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
      {/* List Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            รายการธุรกรรมล่าสุด
          </h2>
          <p className="text-xs text-slate-500">
            รวม {pagination.totalItems} รายการในรอบเดือนนี้
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl shrink-0">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2 py-1 text-xs font-medium rounded-lg transition-all ${
                filterType === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setFilterType('EXPENSE')}
              className={`px-2 py-1 text-xs font-medium rounded-lg transition-all ${
                filterType === 'EXPENSE'
                  ? 'bg-rose-50 text-rose-700 font-semibold shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              จ่าย
            </button>
            <button
              onClick={() => setFilterType('INCOME')}
              className={`px-2 py-1 text-xs font-medium rounded-lg transition-all ${
                filterType === 'INCOME'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              รับ
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <p className="text-sm font-medium">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
          <p className="text-xs mt-1">ลองเปลี่ยนคำค้นหา หรือพิมพ์ส่งรายการใน LINE OA</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'INCOME';
            return (
              <div
                key={tx.id}
                className="py-3 px-1 sm:px-2 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-colors group"
              >
                {/* Left: Category Icon & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome ? 'bg-emerald-50' : 'bg-slate-100'
                    }`}
                  >
                    {getCategoryIcon(tx.categoryName, tx.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs sm:text-sm text-slate-800 truncate">
                        {tx.categoryName}
                      </span>
                      {tx.note && (
                        <span className="text-[11px] text-slate-400 truncate max-w-[120px] sm:max-w-[180px]">
                          • {tx.note}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {formatThaiDate(tx.transactionDate)}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-sm sm:text-base font-bold ${
                        isIncome ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(tx.id)}
                    disabled={deletingId === tx.id}
                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="ลบรายการ"
                  >
                    <Trash2
                      className={`w-3.5 h-3.5 ${
                        deletingId === tx.id ? 'animate-spin' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            หน้า {pagination.page} จาก {pagination.totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
