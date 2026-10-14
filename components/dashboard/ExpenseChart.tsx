'use client';

import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { PieChart as PieIcon, BarChart3, HelpCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CategoryItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface DailyTrendItem {
  date: string;
  income: number;
  expense: number;
}

interface ExpenseChartProps {
  categoryBreakdown: CategoryItem[];
  dailyTrend: DailyTrendItem[];
  totalExpense: number;
}

export function ExpenseChart({
  categoryBreakdown,
  dailyTrend,
  totalExpense,
}: ExpenseChartProps) {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs min-h-[320px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasData =
    (chartType === 'pie' && categoryBreakdown.length > 0) ||
    (chartType === 'bar' && dailyTrend.length > 0);

  // Custom Tooltip for Pie
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CategoryItem;
      return (
        <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg border border-slate-700">
          <p className="font-semibold">{data.name}</p>
          <p className="text-emerald-400 mt-0.5">{formatCurrency(data.value)}</p>
          <p className="text-slate-400 text-[10px]">{data.percentage}% ของรายจ่าย</p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dateStr = label ? label.slice(5) : '';
      return (
        <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg border border-slate-700">
          <p className="font-semibold text-slate-300">วันที่ {dateStr}</p>
          {payload.map((entry: any, i: number) => (
            <p
              key={i}
              style={{ color: entry.dataKey === 'income' ? '#10B981' : '#EF4444' }}
              className="mt-0.5 font-medium"
            >
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
      {/* Chart Header & Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">
            {chartType === 'pie' ? 'หมวดหมู่รายจ่าย' : 'กระแสเงินสดรายวัน'}
          </h2>
          <p className="text-xs text-slate-500">
            {chartType === 'pie'
              ? `รวมรายจ่าย ${formatCurrency(totalExpense)}`
              : 'เปรียบเทียบรายรับและรายจ่ายในแต่ละวัน'}
          </p>
        </div>

        {/* View Switcher buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setChartType('pie')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              chartType === 'pie'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">หมวดหมู่</span>
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              chartType === 'bar'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">รายวัน</span>
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="min-h-[240px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
            <HelpCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-700">ไม่มีข้อมูลธุรกรรมในเดือนนี้</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            พิมพ์ส่งรายการใน LINE OA เพื่อเริ่มบันทึก เช่น &quot;ข้าวกะเพรา 60&quot;
          </p>
        </div>
      ) : chartType === 'pie' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Donut Chart */}
          <div className="md:col-span-7 h-[240px] sm:h-[260px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label inside donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-slate-400 font-medium">รวม</span>
              <span className="text-sm font-bold text-slate-800">
                {formatCurrency(totalExpense)}
              </span>
            </div>
          </div>

          {/* Category List Breakdown */}
          <div className="md:col-span-5 space-y-2 max-h-[240px] overflow-y-auto pr-1">
            {categoryBreakdown.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-slate-700 truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-right">
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(item.value)}
                  </span>
                  <span className="text-slate-400 text-[10px] w-8">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Bar Chart View */
        <div className="h-[260px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailyTrend}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(val) => val.slice(8)} // show day of month (e.g. "13")
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
              />
              <Bar
                dataKey="income"
                name="รายรับ"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="expense"
                name="รายจ่าย"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
