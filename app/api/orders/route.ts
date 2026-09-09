import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { createOrder } from "@/lib/models";
import { sendTelegramNotification } from "@/lib/telegram";
import { orderSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "Заявки недоступны в статическом режиме" },
      { status: 503 }
    );
  }

  const parsed = orderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const order = await createOrder(parsed.data);

    // Отправка уведомления в Telegram не должна ломать сохранение заявки.
    try {
      await sendTelegramNotification(order);
    } catch (notifyError) {
      console.error("Ошибка отправки уведомления в Telegram:", notifyError);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Ошибка сохранения заявки:", error);
    return NextResponse.json(
      { error: "Не удалось сохранить заявку" },
      { status: 500 }
    );
  }
}
