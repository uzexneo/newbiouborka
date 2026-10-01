"use client";

import Image from "next/image";

interface ProcedurePhotoProps {
  src: string;
  alt: string;
  sizes?: string;
}

// Фото в блоке «Как проходит процедура». Загруженные через админ-панель фото
// хранятся как base64 data-URL (small item в DynamoDB) и не поддерживаются
// next/image, поэтому такие изображения рендерятся обычным <img>; статичные
// файлы из public/ отдаются через next/image с оптимизацией.
export function ProcedurePhoto({ src, alt, sizes }: ProcedurePhotoProps) {
  if (src.startsWith("data:")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  return (
    <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
  );
}
