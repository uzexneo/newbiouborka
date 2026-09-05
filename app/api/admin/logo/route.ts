import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  deleteSiteContent,
  getSiteContent,
  putSiteContent,
} from "@/lib/models";
import { imageFileToDataUrl, isImageFile, MAX_UPLOAD_BYTES } from "@/lib/media";

function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json({ src: null });
  }

  try {
    const doc = await getSiteContent("logo");
    const src =
      doc && typeof doc.payload?.src === "string" && doc.payload.src
        ? doc.payload.src
        : null;
    return NextResponse.json({ src });
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
    await putSiteContent("logo", { src });

    return NextResponse.json({ src }, { status: 201 });
  } catch (error) {
    console.error("Ошибка загрузки логотипа:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки логотипа" },
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
