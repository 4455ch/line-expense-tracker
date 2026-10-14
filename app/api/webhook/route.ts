import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseTransactionWithGemini } from '@/lib/gemini';
import {
  verifyLineSignature,
  sendLineReply,
  getLineUserProfile,
  createTransactionConfirmationMessage,
} from '@/lib/line';

interface LineWebhookEvent {
  type: string;
  replyToken?: string;
  source?: {
    userId?: string;
    type?: string;
  };
  message?: {
    id: string;
    type: string;
    text?: string;
  };
  timestamp?: number;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-line-signature');

    // 1. Verify LINE Signature
    if (!verifyLineSignature(rawBody, signature)) {
      console.error('[Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid LINE signature' },
        { status: 401 }
      );
    }

    let payload: { events?: LineWebhookEvent[] } = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
    }

    const events = payload.events || [];

    // Handle all events asynchronously
    // LINE requires quick 200 response to avoid retries
    await Promise.all(
      events.map(async (event) => {
        try {
          await processLineEvent(event);
        } catch (eventErr) {
          console.error('[Webhook] Error processing event:', eventErr);
        }
      })
    );

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('[Webhook] Unhandled server error:', error);
    // Always return 200 to LINE to prevent infinite retries
    return NextResponse.json({ status: 'error', message: 'Internal error' }, { status: 200 });
  }
}

/**
 * Handles individual LINE event (message, follow, etc.)
 */
async function processLineEvent(event: LineWebhookEvent) {
  const lineUserId = event.source?.userId;
  const replyToken = event.replyToken;

  if (!lineUserId) {
    console.warn('[Webhook] Event has no userId, skipping.');
    return;
  }

  // Handle 'follow' event (when user adds bot as friend)
  if (event.type === 'follow' && replyToken) {
    const profile = await getLineUserProfile(lineUserId);
    await prisma.user.upsert({
      where: { lineUserId },
      update: {
        displayName: profile?.displayName,
        pictureUrl: profile?.pictureUrl,
      },
      create: {
        lineUserId,
        displayName: profile?.displayName || 'User',
        pictureUrl: profile?.pictureUrl,
      },
    });

    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    const liffUrl = liffId ? `https://liff.line.me/${liffId}` : undefined;

    await sendLineReply(replyToken, [
      {
        type: 'text',
        text: `🎉 ยินดีต้อนรับสู่ "บอทบันทึกรายรับ-รายจ่าย"!\n\n💡 บันทึกรายการง่ายๆ เพียงพิมพ์ส่งมา เช่น:\n• "ข้าวกะเพรา 60 บาท"\n• "กาแฟเย็น 75"\n• "เติมน้ำมัน 800"\n• "เงินเดือนออก 35,000"\n\n📊 ${
          liffUrl ? `เปิดดู Dashboard สรุปยอด: ${liffUrl}` : 'พร้อมใช้งานแล้วครับ!'
        }`,
      },
    ]);
    return;
  }

  // Handle incoming text message
  if (event.type === 'message' && event.message?.type === 'text') {
    const userText = event.message.text?.trim() || '';
    if (!userText || !replyToken) return;

    // 2. Fetch or Upsert User Record in DB
    const profile = await getLineUserProfile(lineUserId);
    const user = await prisma.user.upsert({
      where: { lineUserId },
      update: {
        displayName: profile?.displayName ?? undefined,
        pictureUrl: profile?.pictureUrl ?? undefined,
      },
      create: {
        lineUserId,
        displayName: profile?.displayName || 'User',
        pictureUrl: profile?.pictureUrl,
      },
    });

    // Check for explicit "สรุป" or "dashboard" keyword
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    const liffUrl = liffId ? `https://liff.line.me/${liffId}` : undefined;

    if (/^(สรุป|ดูยอด|ยอดรวม|รายงาน|dashboard|report)/i.test(userText)) {
      await sendLineReply(replyToken, [
        {
          type: 'text',
          text: `📊 ตรวจสอบสรุปรายรับ-รายจ่ายของคุณได้ที่นี่:\n${
            liffUrl || 'เปิดหน้า Dashboard จากเมนูของระบบ'
          }`,
        },
      ]);
      return;
    }

    // 3. Send text to Gemini API for Thai Natural Language Transaction Extraction
    const parsed = await parseTransactionWithGemini(userText);

    if (
      parsed.isTransaction &&
      parsed.type &&
      parsed.amount &&
      parsed.amount > 0
    ) {
      // 4. Save Parsed Transaction to Prisma DB
      const categoryName = parsed.category || (parsed.type === 'INCOME' ? 'รายรับอื่นๆ' : 'รายจ่ายอื่นๆ');
      
      const newTransaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          type: parsed.type,
          amount: parsed.amount,
          categoryName,
          note: parsed.note || null,
          transactionDate: new Date(),
        },
      });

      // 5. Send LINE Confirmation Reply Message
      const confirmation = createTransactionConfirmationMessage({
        type: newTransaction.type,
        amount: Number(newTransaction.amount),
        category: newTransaction.categoryName,
        note: newTransaction.note || undefined,
        liffUrl,
      });

      await sendLineReply(replyToken, [confirmation]);
    } else {
      // Non-transaction message (greeting or unrecognized text)
      await sendLineReply(replyToken, [
        {
          type: 'text',
          text: `🤖 ไม่พบข้อมูลจำนวนเงินหรือรายการรายรับ-รายจ่าย\n\n💡 ตัวอย่างการพิมพ์:\n• "ข้าวกะเพราหมูกรอบ 65 บาท"\n• "ชานมไข่มุก 45"\n• "ค่าเดินทาง 120"\n• "เงินเดือนเข้า 30000"\n\n📊 หรือพิมพ์ "สรุป" เพื่อดูรายงาน`,
        },
      ]);
    }
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'LINE OA Expense Tracker Webhook is running',
    timestamp: new Date().toISOString(),
  });
}
