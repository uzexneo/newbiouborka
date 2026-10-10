import { z } from "zod";

export const orderSchema = z.object({
  name: z.string().trim().min(1, "Введите имя").max(100),
  phone: z.string().trim().min(1, "Введите телефон").max(30).refine(
    (value) => /^\+?[\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 7 && value.replace(/\D/g, "").length <= 15,
    "Введите корректный телефон"
  ),
  service: z.string().trim().min(1).max(200),
  date: z.string().max(20).optional(),
  time: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  comment: z.string().max(2000).optional(),
});

export const feedbackSchema = orderSchema.pick({ name: true, phone: true }).extend({
  message: z.string().trim().min(1, "Введите сообщение").max(2000),
});

export const visitSchema = z.object({
  visitorId: z.string().min(1).max(100),
  path: z.string().min(1).max(500).refine(
    (path) => path.startsWith("/") && !path.startsWith("//"),
    "Неверный путь страницы"
  ),
  referrer: z.string().max(1000).optional().transform((value) => value || undefined),
  isNewVisitor: z.boolean(),
});

export const orderStatusSchema = z.object({
  orderStatus: z.enum(["application", "order"]),
});
