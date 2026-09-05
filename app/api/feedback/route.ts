import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const feedbackSchema = z.object({
  name: z.string().min(1, "Введите имя").max(100),
  phone: z.string().min(1, "Введите телефон").max(30),
  message: z.string().min(1, "Введите сообщение").max(2000),
});

export async function POST(request: NextRequest) {
  const parsed = feedbackSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
