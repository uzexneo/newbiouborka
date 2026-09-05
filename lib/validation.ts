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
