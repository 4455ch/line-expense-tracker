# 📱 LINE OA Expense Tracker Web App (AI-Powered)

แอปพลิเคชันบันทึกรายรับ-รายจ่ายผ่าน **LINE Official Account** โดยใช้ **Google Gemini AI** ในการวิเคราะห์ข้อความภาษาไทย และเปิดดูรายงานสรุปสถิติผ่านหน้า **LIFF Dashboard** สวยงามทันสมัย รองรับการ Deploy บน **Vercel**

---

## 🌟 จุดเด่นของระบบ (Key Features)

1. **บันทึกผ่านการแชทภาษาไทยธรรมชาติ (Gemini AI)**:
   - ผู้ใช้เพียงพิมพ์บอกบอท เช่น *"ข้าวกะเพราหมูกรอบ 65 บาท"*, *"กาแฟเย็น 75"*, *"เติมน้ำมัน 800"*, *"เงินเดือนออก 35,000"*
   - AI สกัด `type` (INCOME / EXPENSE), `amount`, `category`, `note` ให้อัตโนมัติด้วย Structured Output Schema
2. **ระบบตอบกลับ LINE Webhook ปลอดภัย & มาตรฐาน**:
   - ตรวจสอบ `x-line-signature` ด้วย HMAC-SHA256
   - ตอบกลับ 200 OK รวดเร็วป้องกัน LINE Retry Loop
   - ข้อความยืนยันพร้อมสรุปข้อมูลและลิงก์เปิด Dashboard
3. **LIFF Dashboard (Frontend)**:
   - เชื่อมต่อ `@line/liff` ดึง Profile ผู้ใช้ (Avatar, ชื่อ)
   - สรุปยอดรายรับ, รายจ่าย, ยอดเงินคงเหลือสุทธิ และสัดส่วนการออมประจำเดือน
   - กราฟโดนัทจำแนกหมวดหมู่รายจ่าย (Recharts Pie Chart)
   - กราฟแท่งเปรียบเทียบกระแสเงินสดรายวัน (Recharts Bar Chart)
   - ตารางรายการธุรกรรมล่าสุด ค้นหา กรองประเภท ลบรายการ และปุ่มเพิ่มรายการแบบ Manual
4. **โหมดจำลอง (Dev Preview Mode)**:
   - รองรับการทดสอบบน Desktop Browser ก่อนเชื่อมต่อ LINE จริง

---

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/), Lucide Icons
- **Charts:** [Recharts](https://recharts.org/)
- **Database & ORM:** [Supabase](https://supabase.com/) (PostgreSQL) + [Prisma ORM](https://www.prisma.io/)
- **AI Service:** [Google Gemini API](https://ai.google.dev/) (`@google/generative-ai`)
- **LINE Integration:** LINE Messaging API (`@line/bot-sdk`) & LINE LIFF (`@line/liff`)
- **Deployment Target:** Vercel

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
line-expense-tracker/
├── app/
│   ├── api/
│   │   ├── transactions/
│   │   │   └── route.ts          # API จัดการข้อมูลธุรกรรม (GET/POST/DELETE สำหรับ LIFF)
│   │   └── webhook/
│   │       └── route.ts          # LINE Messaging API Webhook
│   ├── dashboard/
│   │   └── page.tsx              # หน้าจอ LIFF Dashboard สำหรับผู้ใช้
│   ├── globals.css               # สไตล์ Tailwind และ Safe-area สำหรับมือถือ
│   ├── layout.tsx                # Next.js Root Layout
│   └── page.tsx                  # หน้าแรก Landing Page แนะนำระบบ
├── components/
│   └── dashboard/
│       ├── AddTransactionModal.tsx # Modal บันทึกรายการแบบด่วน
│       ├── ExpenseChart.tsx        # กราฟ Recharts (Pie & Bar)
│       ├── Header.tsx              # เมนูส่วนหัว Profile & Month Selector
│       ├── SummaryCards.tsx        # การ์ดสรุปยอดรายรับ รายจ่าย คงเหลือ
│       └── TransactionList.tsx     # รายการธุรกรรมพร้อมระบบกรองและค้นหา
├── hooks/
│   └── useLiff.ts                # Hook จัดการ LIFF Init, Auth & Dev Preview
├── lib/
│   ├── gemini.ts                 # ฟังก์ชันสกัดข้อมูลด้วย Gemini AI + Fallback Regex
│   ├── line.ts                   # Helper ตรวจสอบ Signature และส่งข้อความ LINE
│   ├── prisma.ts                 # Prisma Client Singleton
│   └── utils.ts                  # เครื่องมือจัดฟอร์แมตเงินและวันที่ไทย
├── prisma/
│   └── schema.prisma             # โครงสร้างฐานข้อมูล User, Category, Transaction
├── .env.example                  # ตัวอย่าง Environment Variables
└── package.json
```

---

## 🚀 วิธีติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
คัดลอกไฟล์ `.env.example` เป็น `.env`:
```bash
cp .env.example .env
```

ระบุค่าคอนฟิกต่างๆ:
```env
# 1. Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# 2. LINE Developers Console (Messaging API)
LINE_CHANNEL_SECRET="your_line_channel_secret"
LINE_CHANNEL_ACCESS_TOKEN="your_line_channel_access_token"

# 3. LINE Developers Console (LIFF)
NEXT_PUBLIC_LIFF_ID="2000000000-XXXXXXXX"

# 4. Google AI Studio (Gemini)
GEMINI_API_KEY="AIzaSy..."

# 5. Base URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Sync โครงสร้างฐานข้อมูลด้วย Prisma
```bash
npx prisma db push
```

### 4. รัน Development Server
```bash
npm run dev
```
เปิดบราวเซอร์ไปที่ `http://localhost:3000`

---

## 📲 การเชื่อมต่อ LINE Messaging API & LIFF

### A. ตั้งค่า LINE Webhook
1. สมัคร/เข้าสู่ระบบ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง Channel ประเภท **Messaging API**
3. คัดลอก **Channel secret** และ **Channel access token (long-lived)** ใส่ใน `.env`
4. รัน Tunnel เพื่อส่ง Webhook เข้าเครื่อง Local (เช่น `ngrok http 3000`)
5. ในแท็บ **Messaging API**:
   - ตั้งค่า **Webhook URL**: `https://<YOUR-DOMAIN>/api/webhook`
   - เปิดสวิตช์ **Use webhook** เป็น Enabled
   - กดปุ่ม **Verify** เพื่อทดสอบสถานะ (ต้องขึ้น Success)
   - ปิด **Auto-reply messages** ใน LINE Official Account Manager

### B. ตั้งค่า LINE LIFF
1. ใน LINE Developers Console สร้าง Channel หรือเพิ่ม **LIFF App**
2. ตั้งค่า **Endpoint URL**: `https://<YOUR-DOMAIN>/dashboard`
3. Scope: เลือก `profile` และ `openid`
4. คัดลอก **LIFF ID** มาใส่ใน `NEXT_PUBLIC_LIFF_ID` ในไฟล์ `.env`
5. นำลิงก์ LIFF URL (`https://liff.line.me/<LIFF_ID>`) ไปใส่ใน Rich Menu ของ LINE OA

---

## ☁️ การ Deploy ขึ้น Vercel

1. Push โค้ดขึ้น GitHub Repository
2. Import เข้าสู่ [Vercel](https://vercel.com/)
3. เพิ่ม Environment Variables ทั้งหมดจาก `.env` ในหน้า Project Settings
4. Vercel จะรัน Build และ Deploy อัตโนมัติ (`prisma generate && next build`)
5. อัปเดต Webhook URL และ LIFF Endpoint URL ใน LINE Developers Console ด้วย Production URL ของ Vercel
