// Утилиты для загрузки изображений в панели управления.
// Изображения сжимаются через sharp и сохраняются как base64 data-URL
// в DynamoDB (галерея / фон), что соответствует ключ-значение модели.

import sharp from "sharp";
export { MAX_UPLOAD_BYTES, MAX_DATA_URL_CHARS } from "./media-limits";

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
  let size = maxSize;
  let quality = options?.quality ?? 80;
  const attempts = options?.maxDataUrlChars ? 5 : 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let resized: Buffer;
    try {
      resized = await sharp(buffer, { limitInputPixels: 50_000_000 })
        .rotate()
        .resize({
          width: size,
          height: size,
          fit: "inside",
          withoutEnlargement: true,
        })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    } catch {
      throw new Error("IMAGE_INVALID");
    }
    const src = `data:image/jpeg;base64,${resized.toString("base64")}`;
    if (!options?.maxDataUrlChars || src.length <= options.maxDataUrlChars) {
      return src;
    }
    size = Math.max(256, Math.floor(size * 0.8));
    quality = Math.max(40, quality - 12);
  }
  throw new Error("IMAGE_TOO_LARGE");
}
