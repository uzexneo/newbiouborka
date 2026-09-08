import { z } from "zod";

export const orderSchema = z.object({
  name: z.string().min(1, "Введите имя").max(100),
  phone: z.string().min(1, "Введите телефон").max(30),
  service: z.string().min(1).max(200),
  date: z.string().min(1, "Укажите дату").max(20),
  time: z.string().min(1, "Укажите время").max(20),
  address: z.string().min(1, "Укажите адрес").max(500),
  comment: z.string().max(2000).optional(),
});

export const visitSchema = z.object({
  visitorId: z.string().min(1).max(100),
  path: z.string().min(1).max(500),
  referrer: z.string().max(1000).optional(),
  isNewVisitor: z.boolean(),
});

export const orderStatusSchema = z.object({
  orderStatus: z.enum(["application", "order"]),
});
