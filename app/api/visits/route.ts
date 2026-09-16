import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable, ensureSiteVisitsTable } from "@/lib/db";
import { createVisit } from "@/lib/models";
import { visitSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "Аналитика недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  const parsed = visitSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await ensureSiteVisitsTable();
    const visit = await createVisit({
      ...parsed.data,
      date: new Date().toISOString().split("T")[0],
    });
    return NextResponse.json(visit, { status: 201 });
  } catch (error) {
    // Отсутствие таблицы site_visits или временная недоступность базы не должны
    // ронять сайт и аналитику — логируем ошибку и возвращаем корректный ответ.
    console.error("[visits] Ошибка сохранения посещения:", error);
    return NextResponse.json({ ok: true, saved: false }, { status: 202 });
  }
}
