import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  deleteSiteContent,
  getSiteContent,
  putSiteContent,
} from "@/lib/models";
import { imageFileToDataUrl, isImageFile, MAX_UPLOAD_BYTES } from "@/lib/media";

const logoSizeSchema = z.object({
  size: z.number().int().min(20).max(200).nullable(),
});

function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
}

async function readLogoPayload() {
  const doc = await getSiteContent("logo");
  const payload =
    doc && typeof doc.payload === "object" && doc.payload !== null
      ? (doc.payload as Record<string, unknown>)
      : {};
  const src =
    typeof payload.src === "string" && payload.src ? payload.src : null;
  const size = typeof payload.size === "number" ? payload.size : null;
  return { src, size, payload };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json({ src: null, size: null });
  }

  try {
    const { src, size } = await readLogoPayload();
    return NextResponse.json({ src, size });
  } catch (error) {
    console.error("Ошибка получения логотипа:", error);
    return NextResponse.json(
      { error: "Ошибка получения логотипа" },
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

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Файл изображения обязателен" },
        { status: 400 }
      );
    }

    if (!isImageFile(file)) {
      return NextResponse.json(
        { error: "Можно загружать только изображения" },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Файл слишком большой (максимум 10 МБ)" },
        { status: 400 }
      );
    }

    const src = await imageFileToDataUrl(file, 512);
    const { payload } = await readLogoPayload();
    const size = typeof payload.size === "number" ? payload.size : null;
    await putSiteContent("logo", { src, size });

    return NextResponse.json({ src, size }, { status: 201 });
  } catch (error) {
    console.error("Ошибка загрузки логотипа:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки логотипа" },
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

  let parsed: { size: number | null };
  try {
    const body = await request.json();
    const result = logoSizeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Некорректный размер", details: result.error.flatten() },
        { status: 400 }
      );
    }
    parsed = result.data;
  } catch (error) {
    console.error("Ошибка парсинга размера логотипа:", error);
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  try {
    const { payload } = await readLogoPayload();
    const src = typeof payload.src === "string" ? payload.src : null;
    await putSiteContent("logo", { src, size: parsed.size });
    return NextResponse.json({ src, size: parsed.size });
  } catch (error) {
    console.error("Ошибка сохранения размера логотипа:", error);
    return NextResponse.json(
      { error: "Ошибка сохранения размера логотипа" },
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

  try {
    await deleteSiteContent("logo");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления логотипа:", error);
    return NextResponse.json(
      { error: "Ошибка удаления логотипа" },
      { status: 500 }
    );
  }
}
