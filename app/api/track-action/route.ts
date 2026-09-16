import { NextRequest, NextResponse } from "next/server";
import {
  buildCallClickNotification,
  buildOrderStartNotification,
  sendTelegramMessage,
} from "@/lib/telegram";
import { trackActionSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = trackActionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { type, phone, service, source } = parsed.data;

  const text =
    type === "call_click"
      ? buildCallClickNotification(phone ?? "", source)
      : buildOrderStartNotification(service);

  // Отправка уведомления не должна влиять на работу сайта.
  try {
    const sent = await sendTelegramMessage(text);
    console.log(
      `[telegram] Действие "${type}": отправка уведомления: ${sent ? "успех" : "не удалась"}`
    );
    return NextResponse.json({ ok: true, sent });
  } catch (error) {
    console.error("Ошибка отправки уведомления о действии в Telegram:", error);
    return NextResponse.json({ ok: true, sent: false });
  }
}
