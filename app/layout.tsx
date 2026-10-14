import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LINE OA Expense Tracker | บันทึกรายรับ-รายจ่าย',
  description: 'AI-Powered Thai Expense Tracker via LINE OA & LIFF Dashboard',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="antialiased bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
        <main className="min-h-screen flex flex-col">{children}</main>
      </body>
    </html>
  );
}
