import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSiteContent, putSiteContent } from "@/lib/models";
import { DEFAULT_BACKGROUND } from "@/lib/site-content";
import { imageFileToDataUrl } from "@/lib/media";
import { imageUploadSchema } from "@/lib/validation/admin-content";

function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
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
    const doc = await getSiteContent("background");
    const src =
      doc && typeof doc.payload?.src === "string" && doc.payload.src
        ? doc.payload.src
        : DEFAULT_BACKGROUND;
    return NextResponse.json(
      { src },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error(
      "Ошибка получения фонового изображения:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return NextResponse.json(
      { error: "Не удалось загрузить сохранённое изображение" },
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

    const parsed = imageUploadSchema.safeParse({ file });
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Некорректное изображение",
        },
        { status: 400 }
      );
    }

    const src = await imageFileToDataUrl(parsed.data.file, 1920);
    await putSiteContent("background", { src });

    return NextResponse.json({ src }, { status: 201 });
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
    console.error("Ошибка загрузки фонового изображения:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки фонового изображения" },
      { status: 500 }
    );
  }
}
