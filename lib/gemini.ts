import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export interface ParsedTransaction {
  isTransaction: boolean;
  type?: 'INCOME' | 'EXPENSE';
  amount?: number;
  category?: string;
  note?: string;
  reason?: string;
}

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_INSTRUCTION = `
คุณคือ AI ผู้ช่วยวิเคราะห์และบันทึกรายรับ-รายจ่ายภาษาไทย (Thai Financial Assistant).
หน้าที่ของคุณคืออ่านข้อความภาษาไทยจากผู้ใช้ และสกัดข้อมูลรายรับหรือรายจ่ายให้ถูกต้องแม่นยำ

กฎการจำแนก:
1. หากเป็นรายจ่าย (EXPENSE):
   - ตัวอย่าง: "ข้าวกะเพรา 60", "กาแฟ 75 บ.", "เติมน้ำมัน 800", "ช้อปเสื้อ 350", "ค่าเน็ต 599", "จ่ายค่าหอ 4500", "แท็กซี่ 120"
   - ให้กำหนด type = "EXPENSE"
   - สกัด category หมวดหมู่ภาษาไทยที่เหมาะสม เช่น:
     - "อาหารและเครื่องดื่ม"
     - "การเดินทาง"
     - "ช้อปปิ้ง"
     - "ที่อยู่อาศัยและบิล"
     - "ความบันเทิง"
     - "สุขภาพและความงาม"
     - "การศึกษา"
     - "รายจ่ายอื่นๆ"
2. หากเป็นรายรับ (INCOME):
   - ตัวอย่าง: "เงินเดือนออก 35000", "ได้เงินคืน 500", "ขายของได้ 1200", "โบนัส 10000", "ได้เงินจากแม่ 2000"
   - ให้กำหนด type = "INCOME"
   - สกัด category หมวดหมู่ภาษาไทย เช่น:
     - "เงินเดือน"
     - "โบนัส"
     - "ขายของ/ธุรกิจ"
     - "การลงทุน/ปันผล"
     - "รายรับอื่นๆ"
3. amount ต้องเป็นตัวเลขจำนวนบวก (number > 0)
4. note คือคำอธิบายรายการสั้นๆ ที่เข้าใจง่าย
5. หากข้อความเป็นคำทักทาย, คำถามทั่วไป, หรือไม่ใช่การบันทึกรายรับรายจ่าย (เช่น "สวัสดีครับ", "วันนี้อากาศดี", "ทำอะไรได้บ้าง"):
   - ให้กำหนด isTransaction = false
`;

/**
 * Parses a Thai text message into a structured financial transaction using Gemini API.
 */
export async function parseTransactionWithGemini(
  text: string
): Promise<ParsedTransaction> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { isTransaction: false, reason: 'Empty text' };
  }

  // Graceful fallback if GEMINI_API_KEY is not configured yet
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('[Gemini] GEMINI_API_KEY is missing, falling back to rule-based parser.');
    return fallbackRegexParser(trimmed);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            isTransaction: {
              type: SchemaType.BOOLEAN,
              description: 'True if message is a financial transaction, false otherwise.',
            },
            type: {
              type: SchemaType.STRING,
              enum: ['INCOME', 'EXPENSE'],
              description: 'Whether this is an INCOME or EXPENSE.',
            },
            amount: {
              type: SchemaType.NUMBER,
              description: 'Monetary amount in Baht (positive number).',
            },
            category: {
              type: SchemaType.STRING,
              description: 'Category name in Thai.',
            },
            note: {
              type: SchemaType.STRING,
              description: 'Brief description of the item or income source.',
            },
          },
          required: ['isTransaction'],
        },
      },
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent(
      `วิเคราะห์ข้อความต่อไปนี้:\n"${trimmed}"`
    );

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText) as ParsedTransaction;

    // Validate parsed output
    if (parsed.isTransaction) {
      if (
        (parsed.type === 'INCOME' || parsed.type === 'EXPENSE') &&
        typeof parsed.amount === 'number' &&
        parsed.amount > 0
      ) {
        return {
          isTransaction: true,
          type: parsed.type,
          amount: Math.round(parsed.amount * 100) / 100,
          category: parsed.category?.trim() || (parsed.type === 'INCOME' ? 'รายรับอื่นๆ' : 'รายจ่ายอื่นๆ'),
          note: parsed.note?.trim() || trimmed,
        };
      }
    }

    return {
      isTransaction: false,
      reason: 'Not recognized as a valid transaction amount/type',
    };
  } catch (error) {
    console.error('[Gemini] Parsing error:', error);
    // In case of rate limit, temporary network issue, or invalid API key, fallback to regex
    return fallbackRegexParser(trimmed);
  }
}

/**
 * Fallback lightweight regex parser for Thai transactions
 * Ensures continuous operation even during AI service downtime.
 */
function fallbackRegexParser(text: string): ParsedTransaction {
  // Regex pattern matching: "รายการ 100", "รายการ 100 บาท", "+100 เงินเดือน", "-50 ข้าว"
  const incomeKeywords = /(เงินเดือน|ขายของ|รายได้|ได้เงิน|รับเงิน|ปันผล|โบนัส|\+)/i;
  const expenseKeywords = /(ซื้อ|กิน|จ่าย|ค่า|เติม|\-)/i;

  // Search for numbers (supports formats like 1,000 or 50.50 or 500)
  const amountMatch = text.match(/(?:฿|\$)?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)\s*(?:บาท|บ\.|฿)?/);

  if (!amountMatch) {
    return { isTransaction: false, reason: 'No numeric amount detected' };
  }

  const rawAmount = amountMatch[1].replace(/,/g, '');
  const amount = parseFloat(rawAmount);

  if (isNaN(amount) || amount <= 0) {
    return { isTransaction: false, reason: 'Invalid amount' };
  }

  const isIncome = incomeKeywords.test(text) && !text.includes('จ่าย');
  const type: 'INCOME' | 'EXPENSE' = isIncome ? 'INCOME' : 'EXPENSE';

  // Determine category approximation
  let category = isIncome ? 'รายรับอื่นๆ' : 'อาหารและเครื่องดื่ม';
  if (/ข้าว|กะเพรา|ก๋วยเตี๋ยว|อาหาร|ขนม|กาแฟ|ชา|น้ำ|กิน/i.test(text)) {
    category = 'อาหารและเครื่องดื่ม';
  } else if (/รถ|บีทีเอส|bts|mrt|แท็กซี่|วิน|น้ำมัน|เดินทาง/i.test(text)) {
    category = 'การเดินทาง';
  } else if (/เสื้อ|กางเกง|รองเท้า|ช้อป|shopee|lazada|tiktok/i.test(text)) {
    category = 'ช้อปปิ้ง';
  } else if (/ค่าห้อง|ค่าหอ|ค่าไฟ|ค่าน้ำ|ค่าเน็ต/i.test(text)) {
    category = 'ที่อยู่อาศัยและบิล';
  } else if (/เงินเดือน/i.test(text)) {
    category = 'เงินเดือน';
  }

  // Clean note
  const note = text
    .replace(/[0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?\s*(?:บาท|บ\.|฿)?/g, '')
    .trim() || text;

  return {
    isTransaction: true,
    type,
    amount,
    category,
    note: note || (isIncome ? 'รายรับ' : 'รายจ่าย'),
  };
}
