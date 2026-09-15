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

export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      "Telegram не настроен: отсутствуют TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID"
    );
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "MarkdownV2",
      }),
    });

    if (!response.ok) {
      console.error(
        `Telegram send failed: ${response.status} ${response.statusText}`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Ошибка отправки уведомления в Telegram:", error);
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
