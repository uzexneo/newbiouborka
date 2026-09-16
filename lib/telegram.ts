import type { Order } from "./models";

const TELEGRAM_API = "https://api.telegram.org";

export function isTelegramConfigured(): boolean {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
  );
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

export function buildOrderNotification(order: Order): string {
  const lines = [
    "*Новая заявка с сайта BIOUBORKA.UZ*",
    "",
    `👤 *Имя:* ${escapeMarkdown(order.name)}`,
    `📞 *Телефон:* ${escapeMarkdown(order.phone)}`,
    `🧹 *Услуга:* ${escapeMarkdown(order.service)}`,
  ];

  if (order.date) {
    lines.push(`📅 *Дата:* ${escapeMarkdown(order.date)}`);
  }
  if (order.time) {
    lines.push(`🕐 *Время:* ${escapeMarkdown(order.time)}`);
  }
  if (order.address) {
    lines.push(`📍 *Адрес:* ${escapeMarkdown(order.address)}`);
  }
  if (order.comment) {
    lines.push(`💬 *Комментарий:* ${escapeMarkdown(order.comment)}`);
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
  text: string,
  parseMode?: string
): Promise<TelegramSendResult> {
  const payload: Record<string, string> = { chat_id: chatId, text };
  if (parseMode) {
    payload.parse_mode = parseMode;
  }

  const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
    // Первая попытка — с MarkdownV2 для красивого форматирования.
    const first = await postToTelegram(token, chatId, text, "MarkdownV2");

    if (isOk(first)) {
      console.log("[telegram] Уведомление отправлено успешно (MarkdownV2)");
      return true;
    }

    const firstDetail = first.json?.description ?? first.raw;
    console.error(
      `[telegram] Первая попытка (MarkdownV2) не удалась: status=${first.response.status}, ` +
        `detail="${firstDetail}". Повторяю без parse_mode (как в ручной проверке)...`
    );

    // Фолбэк — обычный текст без parse_mode, совпадает с рабочей ручной проверкой.
    const second = await postToTelegram(token, chatId, text);

    if (isOk(second)) {
      console.log("[telegram] Уведомление отправлено успешно (plain text)");
      return true;
    }

    console.error(
      `[telegram] Обе попытки отправки не удались: status=${second.response.status}, ` +
        `body="${second.json?.description ?? second.raw}"`
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

export function buildCallClickNotification(
  phone: string,
  source?: string
): string {
  const lines = [
    "*Клик по кнопке звонка — BIOUBORKA.UZ*",
    "",
    `📞 *Телефон:* ${escapeMarkdown(phone)}`,
  ];

  if (source) {
    lines.push(`🌐 *Страница/источник:* ${escapeMarkdown(source)}`);
  }

  return lines.join("\n");
}

export function buildOrderStartNotification(service?: string): string {
  const lines = [
    "*Начало оформления заявки — BIOUBORKA.UZ*",
    "",
    service
      ? `🧹 *Услуга:* ${escapeMarkdown(service)}`
      : "Пользователь начал оформление заявки",
  ];

  return lines.join("\n");
}
