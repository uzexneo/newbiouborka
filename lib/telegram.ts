import type { Order } from "./models";

const TELEGRAM_API = "https://api.telegram.org";

// Таймаут на отправку в Telegram: зависший API мессенджера не должен
// блокировать подтверждение заявки пользователю на сайте.
const TELEGRAM_REQUEST_TIMEOUT_MS = 10_000;

// Уведомление о заявке должно доходить до владельца, поэтому при разовой
// ошибке сети/Telegram делается повторная попытка с небольшой паузой.
const TELEGRAM_MAX_ATTEMPTS = 2;
const TELEGRAM_RETRY_DELAY_MS = 1_000;

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
  json: { ok?: boolean; error_code?: number } | null;
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
    signal: AbortSignal.timeout(TELEGRAM_REQUEST_TIMEOUT_MS),
  });

  const json = (await response.json().catch(() => null)) as TelegramSendResult["json"];

  return { response, json };
}

function isOk(result: TelegramSendResult): boolean {
  return result.response.ok && result.json?.ok === true;
}

export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      "[telegram] Не настроен: отсутствуют TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID"
    );
    return false;
  }

  for (let attempt = 1; attempt <= TELEGRAM_MAX_ATTEMPTS; attempt++) {
    try {
      // Отправка обычным текстом без parse_mode (данные клиента могут содержать
      // спецсимволы, которые ломают MarkdownV2).
      const result = await postToTelegram(token, chatId, text);

      if (isOk(result)) {
        console.log(
          `[telegram] Уведомление отправлено успешно (попытка ${attempt}/${TELEGRAM_MAX_ATTEMPTS}): ` +
            `status=${result.response.status}`
        );
        return true;
      }

      console.error(
        `[telegram] Ошибка отправки уведомления (попытка ${attempt}/${TELEGRAM_MAX_ATTEMPTS}): ` +
          `status=${result.response.status}`
      );
    } catch (error) {
      console.error(
        `[telegram] Ошибка отправки уведомления (попытка ${attempt}/${TELEGRAM_MAX_ATTEMPTS}):`,
        error instanceof Error ? error.name : "UnknownError"
      );
    }

    if (attempt < TELEGRAM_MAX_ATTEMPTS) {
      await new Promise((resolve) =>
        setTimeout(resolve, TELEGRAM_RETRY_DELAY_MS)
      );
    }
  }

  return false;
}

export async function sendTelegramNotification(order: Order): Promise<boolean> {
  return sendTelegramMessage(buildOrderNotification(order));
}
