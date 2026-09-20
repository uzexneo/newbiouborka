import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  deleteSiteContent,
  getSiteContent,
  putSiteContent,
} from "@/lib/models";
import { PROCEDURE_CATEGORY_IDS } from "@/lib/i18n/content";
import { imageFileToDataUrl, isImageFile, MAX_UPLOAD_BYTES } from "@/lib/media";

const contentId = "procedurePhotos";

const categoryIdSchema = z.object({
  categoryId: z.enum(PROCEDURE_CATEGORY_IDS),
});

function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
}

async function readPhotos(): Promise<Record<string, string>> {
  const doc = await getSiteContent(contentId);
  const payload =
    doc && typeof doc.payload === "object" && doc.payload !== null
      ? (doc.payload as Record<string, unknown>)
      : {};
  const photos = payload.photos;
  if (!photos || typeof photos !== "object" || photos === null) return {};
  return photos as Record<string, string>;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json({ photos: {} });
  }

  try {
    const photos = await readPhotos();
    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Ошибка получения фото процедур:", error);
    return NextResponse.json(
      { error: "Ошибка получения фото процедур" },
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
    const categoryRaw = String(form.get("categoryId") ?? "");

    const parsed = categoryIdSchema.safeParse({ categoryId: categoryRaw });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректная категория", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

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

    const src = await imageFileToDataUrl(file, 1024);
    const photos = { ...(await readPhotos()), [parsed.data.categoryId]: src };
    await putSiteContent(contentId, { photos });

    return NextResponse.json(
      { photos, categoryId: parsed.data.categoryId, src },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ошибка загрузки фото процедуры:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки фото процедуры" },
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

  const categoryRaw = new URL(request.url).searchParams.get("categoryId");
  const parsed = categoryIdSchema.safeParse({ categoryId: categoryRaw ?? "" });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректная категория", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const photos = await readPhotos();
    delete photos[parsed.data.categoryId];
    if (Object.keys(photos).length === 0) {
      await deleteSiteContent(contentId);
    } else {
      await putSiteContent(contentId, { photos });
    }
    return NextResponse.json({ success: true, photos });
  } catch (error) {
    console.error("Ошибка сброса фото процедуры:", error);
    return NextResponse.json(
      { error: "Ошибка сброса фото процедуры" },
      { status: 500 }
    );
  }
}
