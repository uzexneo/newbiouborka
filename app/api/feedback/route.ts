import { NextRequest, NextResponse } from "next/server";
import { feedbackSchema } from "@/lib/validation";
import { isDatabaseAvailable } from "@/lib/db";
import { createOrder } from "@/lib/models";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!isDatabaseAvailable()) {
    return NextResponse.json({ error: "Не удалось сохранить обращение", saved: false }, { status: 503 });
  }
  try {
    const { order } = await createOrder({
      name: parsed.data.name,
      phone: parsed.data.phone,
      service: "Обратная связь",
      comment: parsed.data.message,
    });
    return NextResponse.json({ success: true, saved: true, id: order.id }, { status: 201 });
  } catch (error) {
    console.error("[feedback] Обращение не сохранено:", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Не удалось сохранить обращение", saved: false }, { status: 503 });
  }
}
