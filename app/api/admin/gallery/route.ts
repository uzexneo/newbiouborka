import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  createGalleryPhoto,
  deleteGalleryPhoto,
  getAllGalleryPhotos,
} from "@/lib/models";
import { galleryItems } from "@/lib/gallery-data";
import { imageFileToDataUrl, isImageFile, MAX_UPLOAD_BYTES } from "@/lib/media";

const uploadSchema = z.object({
  title: z.string().min(1, "Введите название фото").max(300),
  category: z.string().min(1, "Выберите категорию").max(100),
});

function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
}

async function ensureGallerySeeded(): Promise<void> {
  const existing = await getAllGalleryPhotos();
  if (existing.length > 0) return;
  for (const item of galleryItems) {
    await createGalleryPhoto({ ...item, id: item.id });
  }
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(galleryItems);
  }

  try {
    await ensureGallerySeeded();
    const photos = await getAllGalleryPhotos();
    return NextResponse.json(photos);
  } catch (error) {
    console.error("Ошибка получения галереи:", error);
    return NextResponse.json(
      { error: "Ошибка получения галереи" },
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
    const titleRaw = String(form.get("title") ?? "");
    const categoryRaw = String(form.get("category") ?? "");

    const parsed = uploadSchema.safeParse({
      title: titleRaw,
      category: categoryRaw,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
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

    const src = await imageFileToDataUrl(file);
    const photo = await createGalleryPhoto({
      id: crypto.randomUUID(),
      title: parsed.data.title,
      category: parsed.data.category,
      src,
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Ошибка загрузки фото:", error);
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
