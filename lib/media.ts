// Утилиты для загрузки изображений в панели управления.
// Изображения сжимаются через sharp и сохраняются как base64 data-URL
// в DynamoDB (галерея / фон), что соответствует ключ-значение модели.

import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 МБ

export function isImageFile(file: File | Blob): boolean {
  return typeof file.type === "string" && file.type.startsWith("image/");
}

export async function imageFileToDataUrl(
  file: File | Blob,
  maxSize = 1280
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
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  return `data:image/jpeg;base64,${resized.toString("base64")}`;
}
