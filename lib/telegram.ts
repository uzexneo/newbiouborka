import type { Order } from "./models";

const TELEGRAM_API = "https://api.telegram.org";

export function isTelegramConfigured(): boolean {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
  );
}

// Сообщения отправляются обычным текстом БЕЗ parse_mode: данные клиента могут
// содержать спецсимволы (., !, _, и т.п.), из-за которых MarkdownV2 падает с
// ошибкой "Character '.' is reserved and must be escaped". Plain text
// гарантированно доставляется без двойной попытки и потерь.
export function buildOrderNotification(order: Order): string {
  const lines = [
    "Новая заявка с сайта BIOUBORKA.UZ",
    "",
    `👤 Имя: ${order.name}`,
    `📞 Телефон: ${order.phone}`,
    `🧹 Услуга: ${order.service}`,
  ];

  if (order.date) {
    lines.push(`📅 Дата: ${order.date}`);
  }
  if (order.time) {
    lines.push(`🕐 Время: ${order.time}`);
  }
  if (order.address) {
    lines.push(`📍 Адрес: ${order.address}`);
  }
  if (order.comment) {
    lines.push(`💬 Комментарий: ${order.comment}`);
  }

  return lines.join("\n");
}

interface TelegramSendResult {
  response: Response;
  json: { ok?: boolean; description?: string } | null;
  raw: string;
}

async function postToTelegram(
  token: string,
  chatId: string,
  text: string
): Promise<TelegramSendResult> {
  const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  const raw = await response.text();
  let json: { ok?: boolean; description?: string } | null = null;
  try {
    json = JSON.parse(raw);
  } catch {
    json = null;
  }

  return { response, json, raw };
}

function isOk(result: TelegramSendResult): boolean {
  return result.response.ok && result.json?.ok !== false;
}

export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  console.log(
    `[telegram] sendTelegramMessage: isTelegramConfigured=${isTelegramConfigured()}, ` +
      `tokenSet=${Boolean(token)}, chatIdSet=${Boolean(chatId)}`
  );

  if (!token || !chatId) {
    console.warn(
      "[telegram] Не настроен: отсутствуют TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID"
    );
    return false;
  }

  try {
    // Одна попытка обычным текстом без parse_mode.
    const result = await postToTelegram(token, chatId, text);

    if (isOk(result)) {
      console.log(
        `[telegram] Уведомление отправлено успешно: status=${result.response.status}, ` +
          `response="${result.json?.description ?? result.raw}"`
      );
      return true;
    }

    console.error(
      `[telegram] Ошибка отправки уведомления: status=${result.response.status}, ` +
        `response="${result.json?.description ?? result.raw}"`
    );
    return false;
  } catch (error) {
    console.error("[telegram] Ошибка отправки уведомления в Telegram:", error);
    return false;
  }
}

export async function sendTelegramNotification(order: Order): Promise<boolean> {
  return sendTelegramMessage(buildOrderNotification(order));
}
