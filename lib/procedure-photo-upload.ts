"use client";

// Match the server's 640px procedure photo. Send a small JPEG so phone photos
// do not hit the hosting request-body limit before server compression runs.
export async function prepareImageUpload(file: File, maxDimension = 640): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      const timeout = window.setTimeout(() => {
        image.onload = null;
        image.onerror = null;
        reject(new Error("Не удалось прочитать изображение. Попробуйте JPEG, PNG или WebP."));
      }, 15_000);
      image.onload = () => {
        window.clearTimeout(timeout);
        resolve(image);
      };
      image.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error("Не удалось прочитать изображение. Попробуйте JPEG, PNG или WebP."));
      };
      image.src = url;
    });

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error("Не удалось прочитать размеры изображения.");
    }
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Не удалось обработать изображение в браузере.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.9, 0.78, 0.66, 0.54]) {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", quality);
      });
      if (!blob) throw new Error("Не удалось обработать изображение. Выберите другое фото.");
      if (blob.size <= 250_000) {
        return new File([blob], "upload.jpg", { type: "image/jpeg" });
      }
    }
    throw new Error("Не удалось уменьшить изображение. Выберите фото меньшего размера.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function prepareProcedurePhoto(file: File): Promise<File> {
  return prepareImageUpload(file, 640);
}
