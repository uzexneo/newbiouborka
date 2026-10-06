// Утилиты для загрузки изображений в панели управления.
// Изображения сжимаются через sharp и сохраняются как base64 data-URL
// в DynamoDB (галерея / фон), что соответствует ключ-значение модели.

import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 МБ

// Предельный размер одной записи DynamoDB — 400 КБ, поэтому base64 data-URL
// должен оставаться заметно меньше этого значения (в запись также входят ключ
// и служебные поля). Константа применяется там, где фото хранится отдельной
// записью (site_content procedurePhoto:<id>).
export const MAX_DATA_URL_CHARS = 340_000; // ≈ 255 КБ бинарных данных

export function isImageFile(file: File | Blob): boolean {
  return typeof file.type === "string" && file.type.startsWith("image/");
}

interface ImageToDataUrlOptions {
  quality?: number;
  // Если задан и итоговый data-URL длиннее лимита — бросаем Error("IMAGE_TOO_LARGE"),
  // чтобы не сохранить в DynamoDB запись, превышающую лимит 400 КБ.
  maxDataUrlChars?: number;
}

export async function imageFileToDataUrl(
  file: File | Blob,
  maxSize = 1280,
  options?: ImageToDataUrlOptions
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const resized = await sharp(buffer)
    .rotate()
    .resize({
      width: maxSize,
      height: maxSize,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: options?.quality ?? 80, mozjpeg: true })
    .toBuffer();
  const src = `data:image/jpeg;base64,${resized.toString("base64")}`;

  if (
    typeof options?.maxDataUrlChars === "number" &&
    src.length > options.maxDataUrlChars
  ) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  return src;
}
