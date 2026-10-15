# 📊 LINE OA Expense Tracker (AI-Powered)
> **ระบบบันทึกและวิเคราะห์รายรับ-รายจ่ายอัจฉริยะผ่าน LINE Official Account และ LIFF Dashboard**

---

## 📌 1. ที่มาและวัตถุประสงค์ (Problem & Solution)
- **ปัญหา (Pain Point):** การบันทึกรายรับ-รายจ่ายแบบเดิมมีความยุ่งยาก ผู้ใช้ต้องดาวน์โหลดแอปพลิเคชันเฉพาะ จำแนกหมวดหมู่ และกรอกฟอร์มหลายขั้นตอน ทำให้คนส่วนใหญ่หมดความอดทนและเลิกบันทึกหลังจากเริ่มได้ไม่กี่วัน
- **แนวทางแก้ไข (Solution):** พัฒนาระบบที่ผสานเข้ากับชีวิตประจำวันผ่าน **LINE** ที่ทุกคนใช้อยู่แล้ว นำ **Google Gemini AI** มาช่วยวิเคราะห์ภาษาไทยธรรมชาติ เพียงพิมพ์แชทบอกบอท เช่น *"ข้าวกะเพราหมูกรอบ 65 บาท"* ระบบจะสกัดข้อมูล บันทึก และแสดงผลเป็นสถิติสรุปบน **LIFF Dashboard** ให้อัตโนมัติทันที

---

## 🛠️ 2. โครงสร้างเทคโนโลยี (Tech Stack)

| ส่วนการทำงาน | เทคโนโลยีที่เลือกใช้ | หน้าที่หลัก |
| :--- | :--- | :--- |
| **Frontend & UI** | **Next.js (App Router)** + **Tailwind CSS** | หน้าจอ LIFF Dashboard แสดงผลสถิติ กราฟ และจัดการรายการ |
| **Data Visualization** | **Recharts** | กราฟโดนัท (หมวดหมู่ค่าใช้จ่าย) และกราฟแท่ง (กระแสเงินสดรายวัน) |
| **AI / NLP** | **Google Gemini API** (`gemini-1.5-flash`) | วิเคราะห์ข้อความแชทภาษาไทยและสกัดออกมาเป็น JSON Structured Output |
| **Database & ORM** | **Supabase (PostgreSQL)** + **Prisma ORM** | จัดเก็บข้อมูล User, Category และ Transaction อย่างรวดเร็วและปลอดภัย |
| **LINE Integration** | **LINE Messaging API** + **LINE LIFF SDK** | รับ-ส่งข้อความแชท และยืนยันตัวตนผู้ใช้ในหน้า Dashboard ผ่าน In-App Browser |
| **Cloud Hosting** | **Vercel** | แพลตฟอร์ม Serverless รองรับ HTTPS มาตรฐาน และ CI/CD Deployment |

---

## 🔄 3. สถาปัตยกรรมการทำงาน (System Architecture Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 ผู้ใช้งาน (LINE App)
    participant LINE as 📱 LINE Platform
    participant Vercel as ⚡ Next.js API (Vercel)
    participant Gemini as 🧠 Google Gemini AI
    participant DB as 🗄️ Supabase (PostgreSQL)

    %% Flow 1: Chat Recording
    Note over User, DB: ส่วนที่ 1: การบันทึกผ่านแชท (Chat to Record)
    User->>LINE: พิมพ์แชท เช่น "ข้าวกะเพราหมูกรอบ 65 บาท"
    LINE->>Vercel: ยิง Webhook (POST /api/webhook พร้อม Signature)
    Vercel->>Vercel: ตรวจสอบความปลอดภัย (HMAC-SHA256 Signature)
    Vercel->>Gemini: ส่งข้อความไปวิเคราะห์ (Thai NLP Structured Prompt)
    Gemini-->>Vercel: ส่ง JSON กลับมา {type: EXPENSE, amount: 65, category: อาหาร, note: ข้าวกะเพราหมูกรอบ}
    Vercel->>DB: Upsert User และ Insert Transaction ลงฐานข้อมูล
    Vercel->>LINE: สั่ง Reply Message ส่งข้อความยืนยันพร้อมลิงก์ LIFF
    LINE-->>User: แสดงการ์ดยืนยันการบันทึกสำเร็จในแชท

    %% Flow 2: Dashboard Visualization
    Note over User, DB: ส่วนที่ 2: การเปิดดู Dashboard (LIFF Dashboard)
    User->>LINE: กดปุ่มเปิดดู Dashboard (https://liff.line.me/...)
    LINE->>Vercel: เปิดหน้าเว็บ Next.js (/dashboard)
    Vercel->>LINE: LIFF SDK ดึง Profile ผู้ใช้ (User ID, ชื่อ, รูปโปรไฟล์)
    Vercel->>DB: ยิง Query ข้อมูลธุรกรรมประจำเดือนของผู้ใช้คนนั้น
    DB-->>Vercel: ส่งข้อมูลตัวเลข, สัดส่วนหมวดหมู่, ประวัติรายการ
    Vercel-->>User: เรนเดอร์การ์ดสรุปยอด กราฟ Recharts และตารางธุรกรรม
```

---

## ⚙️ 4. การเชื่อมต่อของแต่ละส่วน (Component Details)

### 1) LINE Messaging API ⟷ Next.js Webhook (`/api/webhook`)
- **ความปลอดภัย:** ตรวจสอบความถูกต้องของคำขอผ่าน Header `x-line-signature` เทียบกับ `LINE_CHANNEL_SECRET` ด้วยอัลกอริทึม HMAC-SHA256 ป้องกันการปลอมแปลง
- **Multi-tenant Isolation:** ดึง `lineUserId` จาก Event Payload เพื่อแยกบัญชีผู้ใช้งานแต่ละบุคคลอย่างสมบูรณ์ ข้อมูลไม่ปะปนกัน

### 2) Webhook ⟷ Google Gemini AI (`lib/gemini.ts`)
- ส่งข้อความแชทภาษาไทยไปยัง Gemini API พร้อมกำหนด **JSON Schema (Structured Output)** บังคับฟิลด์:
  - `type`: "INCOME" | "EXPENSE"
  - `amount`: number
  - `category`: string (เช่น อาหารและเครื่องดื่ม, การเดินทาง, ช้อปปิ้ง, เงินเดือน)
  - `note`: string
- **Fallback Regex Parser:** หาก Gemini มีปัญหาขัดข้องชั่วคราว ระบบสำรองจะตรวจจับตัวเลขและคีย์เวิร์ดภาษาไทยเพื่อบันทึกรายการได้ต่อเนื่อง

### 3) ฐานข้อมูล Supabase + Prisma (`prisma/schema.prisma`)
- **Connection Pooling:** ใช้ PgBouncer ของ Supabase (Port 6543) สำหรับ Serverless บน Vercel ป้องกัน Connection ล้น
- **โครงสร้างตาราง:**
  - `User`: เก็บ `lineUserId`, ชื่อ `displayName`, รูปโปรไฟล์ `pictureUrl`
  - `Category`: เก็บหมวดหมู่ค่าใช้จ่าย
  - `Transaction`: จัดเก็บรายการรายรับ-รายจ่าย เชื่อมโยงกับผู้ใช้ พร้อม Index ที่ `[userId, transactionDate]` ช่วยให้ Query รวดเร็ว

### 4) LINE LIFF ⟷ Frontend Dashboard (`/dashboard`)
- รันผ่าน In-App Browser ของ LINE โดยใช้ `@line/liff`
- อ่าน Profile ผู้ใช้ (User ID, ชื่อ, รูป) จาก LINE Login โดยไม่ต้องล็อกอินซ้ำ
- เชื่อมต่อ REST API `/api/transactions?lineUserId=...&month=YYYY-MM` เพื่อดึงข้อมูลรายเดือน คำนวณยอดสุทธิ และแสดงกราฟ Recharts
- รองรับการกรองรายการ (Filter), ค้นหา (Search), เพิ่มรายการแบบ Manual และลบรายการ

---

## 🚀 5. การติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env` จาก `.env.example`:
```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# LINE Messaging API (ได้จากแท็บ Basic settings และ Messaging API)
LINE_CHANNEL_SECRET="your_channel_secret"
LINE_CHANNEL_ACCESS_TOKEN="your_channel_access_token"

# LINE LIFF (ได้จากแท็บ LIFF ใน LINE Login Channel)
NEXT_PUBLIC_LIFF_ID="your_liff_id"

# Google Gemini API (ได้จาก Google AI Studio)
GEMINI_API_KEY="your_gemini_api_key"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Sync โครงสร้างฐานข้อมูล
```bash
npx prisma db push
```

### 4. รัน Development Server
```bash
npm run dev
```
เปิดใช้งานที่ `http://localhost:3000` (หน้าแรก) หรือ `http://localhost:3000/dashboard` (หน้า Dashboard)

---

## 🌟 6. จุดเด่นของระบบ (Key Highlights)

1. **Zero-Friction User Experience:** ใช้งานผ่าน LINE ที่คุ้นเคย ไม่ต้องดาวน์โหลดหรือสลับแอป
2. **AI-Driven Automation:** เข้าใจภาษาไทยธรรมชาติ เช่น *"กาแฟ 60"*, *"เงินเดือนออก 35000"*, *"เติมน้ำมัน 800"* AI แยกประเภทและหมวดหมู่ให้อัตโนมัติ
3. **Enterprise-Grade Architecture:** พัฒนาด้วย Strict TypeScript, Next.js App Router, Tailwind CSS และ Prisma ORM
4. **Serverless & Cost Effective:** โครงสร้างระบบทั้งหมดทำงานบน Serverless (Vercel + Supabase) สเกลได้ไม่จำกัดและประหยัดต้นทุน
5. **High Privacy & Security:** แยกข้อมูลตาม `lineUserId` ของผู้ใช้แต่ละคน พร้อมการตรวจสอบ Signature ตามมาตรฐานความปลอดภัยของ LINE Platform
