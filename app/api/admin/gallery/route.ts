import { NextRequest, NextResponse } from "next/server";
import { galleryUploadSchema } from "@/lib/validation/admin-content";
import { isDatabaseAvailable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  createGalleryPhoto,
  deleteGalleryPhoto,
  getAllGalleryPhotos,
  isSiteCollectionInitialized,
  markSiteCollectionInitialized,
} from "@/lib/models";
import { galleryItems } from "@/lib/gallery-data";
import { imageFileToDataUrl } from "@/lib/media";

function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
}

async function ensureGallerySeeded(): Promise<void> {
  if (await isSiteCollectionInitialized("gallery")) return;
  const existing = await getAllGalleryPhotos();
  if (existing.length > 0) {
    await markSiteCollectionInitialized("gallery");
    return;
  }
  for (const item of galleryItems) {
    await createGalleryPhoto({ ...item, id: item.id }, true);
  }
  await markSiteCollectionInitialized("gallery");
}

export const runtime = "nodejs";
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
    await ensureGallerySeeded();
    const photos = await getAllGalleryPhotos();
    return NextResponse.json(photos, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error(
      "Ошибка получения галереи:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return NextResponse.json(
      { error: "Не удалось загрузить сохранённую галерею" },
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

  try {
    const form = await request.formData();
    const file = form.get("file");
    const titleRaw = String(form.get("title") ?? "");
    const categoryRaw = String(form.get("category") ?? "");

    const parsed = galleryUploadSchema.safeParse({
      file,
      title: titleRaw,
      category: categoryRaw,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const src = await imageFileToDataUrl(parsed.data.file);
    await ensureGallerySeeded();
    const photo = await createGalleryPhoto({
      id: crypto.randomUUID(),
      title: parsed.data.title,
      category: parsed.data.category,
      src,
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("IMAGE_")) {
      return NextResponse.json(
        {
          error:
            "Не удалось обработать изображение. Выберите JPEG, PNG или WebP меньшего размера.",
        },
        { status: 400 }
      );
    }
    console.error(
      "Ошибка загрузки фото:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return NextResponse.json(
      { error: "Ошибка загрузки фото" },
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
    await ensureGallerySeeded();
    await deleteGalleryPhoto(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления фото:", error);
    return NextResponse.json(
      { error: "Ошибка удаления фото" },
      { status: 500 }
    );
  }
}
