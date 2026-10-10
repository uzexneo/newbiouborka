import { after, NextRequest, NextResponse } from "next/server";
import type { Order } from "@/lib/models";
import { createOrder } from "@/lib/models";
import { isDatabaseAvailable } from "@/lib/db";
import { sendTelegramNotification } from "@/lib/telegram";
import { orderSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!isDatabaseAvailable()) {
    return NextResponse.json(
      { error: "Не удалось сохранить заявку. Попробуйте ещё раз или позвоните нам.", saved: false },
      { status: 503, headers: { "Retry-After": "30" } }
    );
  }

  let order: Order;
  try {
    const result = await createOrder(parsed.data);
    order = result.order;
  } catch (error) {
    console.error("[orders] Ошибка сохранения заявки:", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { error: "Не удалось сохранить заявку. Попробуйте ещё раз или позвоните нам.", saved: false },
      { status: 503, headers: { "Retry-After": "30" } }
    );
  }

  // Заявка уже сохранена. Next.js поддерживает выполнение уведомления после
  // ответа и продлевает жизнь серверного запроса через waitUntil на Vercel.
  after(async () => {
    try {
      const sent = await sendTelegramNotification(order);
      console.info(`[telegram] Уведомление о сохранённой заявке: ${sent ? "успех" : "не удалась"}`);
    } catch (error) {
      console.error("[telegram] Ошибка уведомления:", error instanceof Error ? error.name : "UnknownError");
    }
  });

  return NextResponse.json(
    { ...order, saved: true, telegramStatus: "pending" },
    { status: 201 }
  );
}
