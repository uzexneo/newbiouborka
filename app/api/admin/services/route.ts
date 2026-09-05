import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  createSiteService,
  deleteSiteService,
  getAllSiteServices,
  updateSiteService,
} from "@/lib/models";
import { getDefaultServices } from "@/lib/site-content";

const serviceSchema = z.object({
  categoryId: z.string().min(1).max(100),
  categoryTitle: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  price: z.string().min(1).max(200),
  sortOrder: z.number().int().min(0).optional(),
});

const updateServiceSchema = serviceSchema
  .extend({ id: z.string().min(1) })
  .partial();

function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
}

async function ensureServicesSeeded(): Promise<void> {
  const existing = await getAllSiteServices();
  if (existing.length > 0) return;
  const defaults = getDefaultServices();
  for (let i = 0; i < defaults.length; i++) {
    const s = defaults[i];
    await createSiteService({
      id: s.id,
      categoryId: s.categoryId,
      categoryTitle: s.categoryTitle,
      name: s.name,
      price: s.price,
      sortOrder: i,
    });
  }
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(getDefaultServices());
  }

  try {
    await ensureServicesSeeded();
    const services = await getAllSiteServices();
    return NextResponse.json(services);
  } catch (error) {
    console.error("Ошибка получения услуг:", error);
    return NextResponse.json(
      { error: "Ошибка получения услуг" },
      { status: 500 }
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

  const parsed = serviceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const existing = await getAllSiteServices();
    const service = await createSiteService({
      id: crypto.randomUUID(),
      ...parsed.data,
      sortOrder: parsed.data.sortOrder ?? existing.length,
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

  const parsed = updateServiceSchema.safeParse(await request.json());
  if (!parsed.success || !parsed.data.id) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error?.flatten() },
      { status: 400 }
    );
  }

  try {
    const { id, ...data } = parsed.data;
    const service = await updateSiteService(id, data);
    return NextResponse.json(service);
  } catch (error) {
    console.error("Ошибка обновления услуги:", error);
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
