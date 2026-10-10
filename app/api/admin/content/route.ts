import { NextRequest, NextResponse } from "next/server";
import { adminContentSaveSchema } from "@/lib/validation/admin-content";
import { isDatabaseAvailable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  getSiteContent,
  putSiteContent,
  type SiteContentId,
} from "@/lib/models";
import {
  DEFAULT_ABOUT,
  DEFAULT_BENEFITS,
  DEFAULT_CONTACTS,
  DEFAULT_TESTIMONIALS,
} from "@/lib/site-content";

function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "Подключение к базе данных не настроено" },
      { status: 503 }
    );
  }

  try {
    const [contacts, about, benefits, testimonials] = await Promise.all([
      getSiteContent("contacts"),
      getSiteContent("about"),
      getSiteContent("benefits"),
      getSiteContent("testimonials"),
    ]);

    return NextResponse.json(
      {
        contacts: contacts?.payload ?? DEFAULT_CONTACTS,
        about: about?.payload ?? DEFAULT_ABOUT,
        benefits: benefits?.payload.items ?? DEFAULT_BENEFITS,
        testimonials: testimonials?.payload.items ?? DEFAULT_TESTIMONIALS,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error(
      "Ошибка получения контента:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return NextResponse.json(
      { error: "Не удалось загрузить сохранённый контент" },
      { status: 503 }
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  const parsed = adminContentSaveSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { type, ...payload } = parsed.data;

  try {
    const doc = await putSiteContent(type as SiteContentId, payload);
    return NextResponse.json(doc);
  } catch (error) {
    console.error("Ошибка сохранения контента:", error);
    return NextResponse.json(
      { error: "Ошибка сохранения контента" },
      { status: 500 }
    );
  }
}
