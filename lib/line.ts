import crypto from 'crypto';

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '';
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

export interface LineReplyMessage {
  type: string;
  [key: string]: unknown;
}

/**
 * Validates the LINE webhook signature using HMAC-SHA256
 */
export function verifyLineSignature(bodyText: string, signature: string | null): boolean {
  if (!signature || !LINE_CHANNEL_SECRET) {
    // In dev mode without secret configured, log warning
    if (process.env.NODE_ENV === 'development' && !LINE_CHANNEL_SECRET) {
      console.warn('[LINE] LINE_CHANNEL_SECRET not set, signature check bypassed in dev.');
      return true;
    }
    return false;
  }

  const hash = crypto
    .createHmac('SHA256', LINE_CHANNEL_SECRET)
    .update(bodyText)
    .digest('base64');

  return hash === signature;
}

/**
 * Sends a reply message to LINE using LINE Messaging API
 */
export async function sendLineReply(
  replyToken: string,
  messages: LineReplyMessage[]
): Promise<boolean> {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn('[LINE] LINE_CHANNEL_ACCESS_TOKEN is missing. Skipping reply API call.');
    return false;
  }

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[LINE] Reply API failed (${res.status}):`, errBody);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[LINE] Error sending reply message:', error);
    return false;
  }
}

/**
 * Fetches user profile from LINE Messaging API
 */
export async function getLineUserProfile(
  userId: string
): Promise<{ displayName: string; pictureUrl?: string } | null> {
  if (!LINE_CHANNEL_ACCESS_TOKEN || !userId) {
    return null;
  }

  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        displayName: data.displayName,
        pictureUrl: data.pictureUrl,
      };
    }
    return null;
  } catch (error) {
    console.error('[LINE] Failed to get user profile:', error);
    return null;
  }
}

/**
 * Creates a beautiful Flex Message or formatted text response for saved transaction
 */
export function createTransactionConfirmationMessage(transaction: {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  note?: string;
  liffUrl?: string;
}): LineReplyMessage {
  const isIncome = transaction.type === 'INCOME';
  const typeText = isIncome ? 'รายรับ (Income)' : 'รายจ่าย (Expense)';
  const amountFormatted = transaction.amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const color = isIncome ? '#10B981' : '#EF4444';
  const iconEmoji = isIncome ? '🟢' : '🔴';

  // Construct structured text message with friendly emojis and formatting
  const textMessage = [
    `✅ บันทึกเรียบร้อย!`,
    `━━━━━━━━━━━━━━━━`,
    `${iconEmoji} ประเภท: ${typeText}`,
    `🏷️ หมวดหมู่: ${transaction.category}`,
    `💰 จำนวนเงิน: ฿${amountFormatted}`,
    transaction.note ? `📝 โน้ต: ${transaction.note}` : null,
    `━━━━━━━━━━━━━━━━`,
    transaction.liffUrl
      ? `📊 ดูสรุปยอดรายเดือน: ${transaction.liffUrl}`
      : `💡 พิมพ์บันทึกรายการถัดไปได้ทันที`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    type: 'text',
    text: textMessage,
  };
}
