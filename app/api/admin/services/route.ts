import { NextRequest, NextResponse } from "next/server";
import {
  siteServiceCreateSchema,
  siteServiceUpdateSchema,
} from "@/lib/validation/admin-content";
import { isDatabaseAvailable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  createSiteService,
  deleteSiteService,
  getAllSiteServices,
  updateSiteService,
  isSiteCollectionInitialized,
  markSiteCollectionInitialized,
} from "@/lib/models";
import { getDefaultServices } from "@/lib/site-content";

function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
}

async function ensureServicesSeeded(): Promise<void> {
  if (await isSiteCollectionInitialized("services")) return;
  const existing = await getAllSiteServices();
  if (existing.length > 0) {
    await markSiteCollectionInitialized("services");
    return;
  }
  const defaults = getDefaultServices();
  for (let i = 0; i < defaults.length; i++) {
    const s = defaults[i];
    await createSiteService(
      {
        id: s.id,
        categoryId: s.categoryId,
        categoryTitle: s.categoryTitle,
        name: s.name,
        price: s.price,
        sortOrder: i,
      },
      true
    );
  }
  await markSiteCollectionInitialized("services");
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
    await ensureServicesSeeded();
    const services = await getAllSiteServices();
    return NextResponse.json(services, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error(
      "Ошибка получения услуг:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return NextResponse.json(
      { error: "Не удалось загрузить сохранённые услуги" },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  const parsed = siteServiceCreateSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await ensureServicesSeeded();
    const existing = await getAllSiteServices();
    const service = await createSiteService({
      id: crypto.randomUUID(),
      ...parsed.data,
      sortOrder:
        parsed.data.sortOrder ??
        Math.max(-1, ...existing.map((item) => item.sortOrder)) + 1,
    });
    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания услуги:", error);
    return NextResponse.json(
      { error: "Ошибка создания услуги" },
      { status: 500 }
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

  const parsed = siteServiceUpdateSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success || !parsed.data.id) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error?.flatten() },
      { status: 400 }
    );
  }

  try {
    await ensureServicesSeeded();
    const { id, ...data } = parsed.data;
    const service = await updateSiteService(id, data);
    return NextResponse.json(service);
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "ConditionalCheckFailedException"
    ) {
      return NextResponse.json(
        { error: "Услуга уже удалена. Обновите список." },
        { status: 404 }
      );
    }
    console.error(
      "Ошибка обновления услуги:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return NextResponse.json(
      { error: "Ошибка обновления услуги" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Параметр id обязателен" },
      { status: 400 }
    );
  }

  try {
    await ensureServicesSeeded();
    await deleteSiteService(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления услуги:", error);
    return NextResponse.json(
      { error: "Ошибка удаления услуги" },
      { status: 500 }
    );
  }
}
