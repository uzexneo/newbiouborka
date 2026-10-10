import { z } from "zod";
import { MAX_UPLOAD_BYTES } from "@/lib/media-limits";

const optionalLink = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => !value || (/^https?:\/\//i.test(value) && URL.canParse(value)),
    "Введите ссылку, начинающуюся с https://"
  )
  .default("");

export const contactsFormSchema = z.object({
  phone: z.string().trim().min(1, "Введите телефон").max(40),
  instagram: optionalLink,
  telegram: optionalLink,
  email: z
    .string()
    .trim()
    .email("Введите корректный email")
    .max(200)
    .or(z.literal(""))
    .default(""),
  address: z.string().trim().max(300).default(""),
});

export const aboutFormSchema = z.object({
  p1: z.string().trim().min(1, "Заполните текст").max(5000),
  p2: z.string().max(5000).default(""),
  p3: z.string().max(5000).default(""),
});

export const benefitsFormSchema = z.object({
  items: z
    .array(
      z.object({
        title: z
          .string()
          .trim()
          .min(1, "Введите заголовок преимущества")
          .max(300),
        desc: z.string().max(3000),
      })
    )
    .max(20, "Можно добавить не более 20 преимуществ"),
});

export const testimonialsFormSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Введите имя автора отзыва").max(200),
        location: z.string().max(200).default(""),
        text: z.string().trim().min(1, "Введите текст отзыва").max(5000),
        rating: z.number().int().min(1).max(5).default(5),
      })
    )
    .max(30, "Можно добавить не более 30 отзывов"),
});

export const adminContentSaveSchema = z.discriminatedUnion("type", [
  contactsFormSchema.extend({ type: z.literal("contacts") }),
  aboutFormSchema.extend({ type: z.literal("about") }),
  benefitsFormSchema.extend({ type: z.literal("benefits") }),
  testimonialsFormSchema.extend({ type: z.literal("testimonials") }),
]);

export const serviceFormSchema = z.object({
  categoryId: z.string().trim().min(1, "Выберите категорию").max(100),
  categoryTitle: z
    .string()
    .trim()
    .min(1, "Введите название категории")
    .max(200),
  name: z.string().trim().min(1, "Введите название услуги").max(200),
  price: z.string().trim().min(1, "Введите цену").max(200),
});
export const siteServiceCreateSchema = serviceFormSchema.extend({
  sortOrder: z.number().int().min(0).optional(),
});
export const siteServiceUpdateSchema = siteServiceCreateSchema
  .partial()
  .extend({
    id: z.string().min(1).max(200),
  })
  .refine(
    (value) => Object.keys(value).some((key) => key !== "id"),
    "Укажите изменяемые поля"
  );

export const galleryFormSchema = z.object({
  title: z.string().trim().min(1, "Введите название фото").max(300),
  category: z.enum(["apartment", "furniture", "office", "after-renovation"]),
});

export const imageUploadSchema = z.object({
  file: z
    .custom<File>(
      (value) => typeof File !== "undefined" && value instanceof File,
      "Выберите файл изображения"
    )
    .superRefine((file, context) => {
      if (typeof File === "undefined" || !(file instanceof File)) return;
      if (file.size === 0)
        context.addIssue({
          code: "custom",
          message: "Файл изображения пустой",
        });
      if (file.size > MAX_UPLOAD_BYTES)
        context.addIssue({
          code: "custom",
          message: "Файл слишком большой (максимум 10 МБ)",
        });
      if (!file.type.startsWith("image/"))
        context.addIssue({
          code: "custom",
          message: "Можно загружать только изображения",
        });
    }),
});
export const galleryUploadSchema = galleryFormSchema.extend(
  imageUploadSchema.shape
);
export const logoSizeSchema = z.object({
  size: z.number().int().min(20).max(200).nullable(),
});
