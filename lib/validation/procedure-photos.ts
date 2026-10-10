import { z } from "zod";
import { PROCEDURE_CATEGORY_IDS } from "@/lib/i18n/content";
import { MAX_DATA_URL_CHARS, MAX_UPLOAD_BYTES } from "@/lib/media-limits";

function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

export const procedurePhotoCategorySchema = z.object({
  categoryId: z.enum(PROCEDURE_CATEGORY_IDS),
});

export const procedurePhotoUploadSchema = procedurePhotoCategorySchema.extend({
  file: z.custom<File>(isFile, { message: "Выберите файл изображения" })
    .superRefine((file, context) => {
      if (!isFile(file)) return;
      if (file.size === 0) {
        context.addIssue({ code: "custom", message: "Файл изображения пустой" });
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        context.addIssue({ code: "custom", message: "Файл слишком большой (максимум 10 МБ)" });
      }
      if (!file.type.startsWith("image/")) {
        context.addIssue({ code: "custom", message: "Можно загружать только изображения" });
      }
    }),
});

export const procedurePhotoUploadResultSchema = procedurePhotoCategorySchema.extend({
  src: z.string().max(MAX_DATA_URL_CHARS).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/),
});

export const procedurePhotosResultSchema = z.object({
  photos: z.record(
    z.string().refine((id) => (PROCEDURE_CATEGORY_IDS as readonly string[]).includes(id)),
    z.string().min(1)
  ),
});

export const procedurePhotoResetResultSchema = procedurePhotoCategorySchema.extend({
  success: z.literal(true),
});
