import { NextRequest, NextResponse } from "next/server";
import type { Order } from "@/lib/models";
import { createOrder } from "@/lib/models";
import { sendTelegramNotification } from "@/lib/telegram";
import { orderSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = orderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let order: Order;
  let saved = false;
  try {
    const result = await createOrder(parsed.data);
    order = result.order;
    saved = result.saved;
  } catch (error) {
    // Недоступность БД не должна ломать подачу заявки: логируем ошибку и всё
    // равно подтверждаем пользователю, чтобы заявка не терялась на фронте
    // (уведомление в Telegram при этом отправляется отдельно).
    console.error("[orders] Ошибка сохранения заявки:", error);
    order = {
      ...parsed.data,
      date: parsed.data.date ?? "",
      time: parsed.data.time ?? "",
      address: parsed.data.address ?? "",
      comment: parsed.data.comment ?? "",
      orderStatus: "application",
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
  }

  // Отправка уведомления в Telegram не должна ломать сохранение заявки.
  let telegramSent = false;
  try {
    telegramSent = await sendTelegramNotification(order);
    console.log(
      `[telegram] Заявка ${order.id} (saved=${saved}); отправка уведомления: ${telegramSent ? "успех" : "не удалась"}`
    );
  } catch (notifyError) {
    console.error("Ошибка отправки уведомления в Telegram:", notifyError);
  }

  return NextResponse.json({ ...order, saved, telegramSent }, { status: 201 });
}
