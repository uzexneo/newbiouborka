import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  deleteProcedurePhoto,
  getAllProcedurePhotos,
  putProcedurePhoto,
} from "@/lib/models";
import { PROCEDURE_CATEGORY_IDS } from "@/lib/i18n/content";
import {
  imageFileToDataUrl,
  isImageFile,
  MAX_DATA_URL_CHARS,
  MAX_UPLOAD_BYTES,
} from "@/lib/media";

const categoryIdSchema = z.object({
  categoryId: z.enum(PROCEDURE_CATEGORY_IDS),
});

function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json({ photos: {} });
  }

  try {
    const photos = await getAllProcedurePhotos();
    return NextResponse.json({ photos });
  } catch (error) {
    console.error(
      "Ошибка получения фото процедур, использую пустой список:",
      error
    );
    return NextResponse.json({ photos: {} });
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

    // Сжимаем фото сильнее, чем галерею/фон: каждая запись procedurePhoto:<id>
    // хранится в DynamoDB отдельно, и base64 data-URL должен оставаться заметно
    // ниже лимита в 400 КБ, чтобы замена фото не падала на сохранении.
    const src = await imageFileToDataUrl(file, 640, {
      quality: 72,
      maxDataUrlChars: MAX_DATA_URL_CHARS,
    });
    await putProcedurePhoto(parsed.data.categoryId, src);
    const photos = await getAllProcedurePhotos();

    return NextResponse.json(
      { photos, categoryId: parsed.data.categoryId, src },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ошибка загрузки фото процедуры:", error);
    if (error instanceof Error && error.message === "IMAGE_TOO_LARGE") {
      return NextResponse.json(
        {
          error:
            "Фото слишком большое даже после сжатия. Загрузите изображение меньшего размера.",
        },
        { status: 400 }
      );
    }
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
    await deleteProcedurePhoto(parsed.data.categoryId);
    const photos = await getAllProcedurePhotos();
    return NextResponse.json({ success: true, photos });
  } catch (error) {
    console.error("Ошибка сброса фото процедуры:", error);
    return NextResponse.json(
      { error: "Не удалось сбросить фото. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
