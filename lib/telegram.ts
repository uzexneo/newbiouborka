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
    `👤 *Имя:* ${order.name}`,
    `📞 *Телефон:* ${order.phone}`,
    `🧹 *Услуга:* ${order.service}`,
  ];

  if (order.date) {
    lines.push(`📅 *Дата:* ${order.date}`);
  }
  if (order.time) {
    lines.push(`🕐 *Время:* ${order.time}`);
  }
  if (order.address) {
    lines.push(`📍 *Адрес:* ${order.address}`);
  }
  if (order.comment) {
    lines.push(`💬 *Комментарий:* ${order.comment}`);
  }

  return lines.map(escapeMarkdown).join("\n");
}

export async function sendTelegramNotification(order: Order): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildOrderNotification(order),
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
