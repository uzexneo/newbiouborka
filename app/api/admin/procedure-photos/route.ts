import { NextRequest, NextResponse } from "next/server";
import { ensureSiteContentTable, isDatabaseAvailable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  deleteProcedurePhoto,
  getAllProcedurePhotos,
  putProcedurePhoto,
} from "@/lib/models";
import { imageFileToDataUrl, MAX_DATA_URL_CHARS } from "@/lib/media";
import {
  procedurePhotoCategorySchema,
  procedurePhotoUploadSchema,
} from "@/lib/validation/procedure-photos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return json({ error: "Не авторизован" }, 401);
  if (!isDatabaseAvailable()) {
    return json({ error: "База данных недоступна. Фото не загружены." }, 503);
  }

  try {
    await ensureSiteContentTable();
    const photos = await getAllProcedurePhotos();
    return json({ photos });
  } catch {
    console.error("[procedure-photos] Не удалось прочитать фотографии");
    return json({ error: "Не удалось загрузить фото процедур. Попробуйте ещё раз." }, 503);
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return json({ error: "Не авторизован" }, 401);
  if (!isDatabaseAvailable()) {
    return json({ error: "База данных недоступна. Фото не сохранено." }, 503);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Не удалось прочитать файл. Выберите изображение ещё раз." }, 400);
  }

  const parsed = procedurePhotoUploadSchema.safeParse({
    categoryId: form.get("categoryId"),
    file: form.get("file"),
  });
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? "Некорректное изображение" }, 400);
  }

  let src: string;
  try {
    src = await imageFileToDataUrl(parsed.data.file, 640, {
      quality: 72,
      maxDataUrlChars: MAX_DATA_URL_CHARS,
    });
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === "IMAGE_TOO_LARGE";
    return json({
      error: tooLarge
        ? "Фото слишком большое даже после сжатия. Выберите изображение меньшего размера."
        : "Не удалось обработать изображение. Попробуйте фото в формате JPEG, PNG или WebP.",
    }, 400);
  }

  try {
    await ensureSiteContentTable();
    await putProcedurePhoto(parsed.data.categoryId, src);
    // Return the confirmed write without a second read that could fail after
    // the image was saved, or return an older value.
    return json({ categoryId: parsed.data.categoryId, src }, 201);
  } catch {
    console.error("[procedure-photos] Не удалось сохранить фотографию");
    return json({ error: "Не удалось сохранить фото. Попробуйте ещё раз." }, 503);
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return json({ error: "Не авторизован" }, 401);
  if (!isDatabaseAvailable()) {
    return json({ error: "База данных недоступна. Фото не сброшено." }, 503);
  }

  const parsed = procedurePhotoCategorySchema.safeParse({
    categoryId: request.nextUrl.searchParams.get("categoryId"),
  });
  if (!parsed.success) return json({ error: "Некорректная категория" }, 400);

  try {
    await ensureSiteContentTable();
    await deleteProcedurePhoto(parsed.data.categoryId);
    return json({ success: true, categoryId: parsed.data.categoryId });
  } catch {
    console.error("[procedure-photos] Не удалось сбросить фотографию");
    return json({ error: "Не удалось сбросить фото. Попробуйте ещё раз." }, 503);
  }
}
