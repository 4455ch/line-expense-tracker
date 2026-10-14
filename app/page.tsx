import Link from 'next/link';
import {
  MessageSquare,
  Sparkles,
  PieChart,
  ShieldCheck,
  ArrowRight,
  Bot,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
              LINE Expense Tracker
            </span>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#06C755] hover:bg-[#05b34c] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-95"
          >
            <span>เปิด LIFF Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-800 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>ขับเคลื่อนด้วย Google Gemini AI & LINE LIFF</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
          บันทึกรายรับ-รายจ่ายง่ายๆ <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
            เพียงแค่พิมพ์แชทใน LINE
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
          ไม่ต้องจำแนกหมวดหมู่เอง AI สกัดข้อมูลภาษาไทยอัตโนมัติ
          บันทึกเข้าสู่ระบบทันที พร้อมดูรายงานสรุปรายเดือนผ่านหน้าเว็บ LIFF สวยงาม
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto mb-10">
          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">
              เข้าใจภาษาไทยธรรมชาติ
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              พิมพ์บอกบอท เช่น &ldquo;ข้าวกะเพรา 60&rdquo; หรือ &ldquo;เงินเดือนเข้า 35,000&rdquo; ระบบรู้ทันทีว่าเป็นรายรับหรือจ่าย
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">
              LIFF Dashboard สรุปยอด
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              เปิดดูสถิติรายเดือน ชาร์ตสัดส่วนค่าใช้จ่าย และกระแสเงินสดรายวันแบบเรียลไทม์ผ่านมือถือ
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">
              Supabase + Prisma
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              โครงสร้างฐานข้อมูลมาตรฐาน ปลอดภัย ความเร็วสูง พร้อม Deploy ขึ้น Vercel ได้ทันที
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 bg-[#06C755] hover:bg-[#05b34c] text-white text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>เข้าสู่ระบบ Dashboard (LIFF)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="/api/webhook"
            target="_blank"
            className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>ตรวจสอบสถานะ Webhook API</span>
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <p>LINE OA Expense Tracker Web App &bull; Powered by Next.js & Google Gemini</p>
      </footer>
    </div>
  );
}
