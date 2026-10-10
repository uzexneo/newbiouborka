import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable, ensureSiteVisitsTable } from "@/lib/db";
import { createVisit } from "@/lib/models";
import { visitSchema } from "@/lib/validation";
import { isPublicAnalyticsPath } from "@/lib/analytics-paths";
import { analyticsDate } from "@/lib/analytics-dates";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = visitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!isPublicAnalyticsPath(parsed.data.path)) {
    return NextResponse.json({ ok: true, saved: false }, { status: 202 });
  }

  if (!isDatabaseAvailable()) {
    return NextResponse.json(
      { error: "Не удалось сохранить посещение" },
      { status: 503 }
    );
  }

  try {
    await ensureSiteVisitsTable();
    await createVisit({
      ...parsed.data,
      date: analyticsDate(new Date())!,
    });
    return NextResponse.json({ ok: true, saved: true }, { status: 201 });
  } catch (error) {
    console.error(
      "[visits] Ошибка сохранения посещения:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return NextResponse.json(
      { error: "Не удалось сохранить посещение", saved: false },
      { status: 503 }
    );
  }
}
