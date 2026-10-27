import { z } from "zod";

interface LeadFormMessages {
  name: string;
  phone: string;
  service: string;
}

interface OrderFormMessages extends LeadFormMessages {
  date: string;
  time: string;
  address: string;
}

export function buildQuickOrderSchema(messages: LeadFormMessages) {
  return z.object({
    name: z.string().trim().min(1, messages.name).max(100, messages.name),
    phone: z
      .string()
      .trim()
      .max(30, messages.phone)
      .refine(
        (value) =>
          /^\+?[\d\s().-]+$/.test(value) &&
          value.replace(/\D/g, "").length >= 7 &&
          value.replace(/\D/g, "").length <= 15,
        messages.phone
      ),
    service: z
      .string()
      .trim()
      .min(1, messages.service)
      .max(200, messages.service),
  });
}

// A first enquiry needs a contact and service only. Scheduling details can be
// supplied now or agreed with the customer after the enquiry is saved.
export function buildOrderFormSchema(messages: OrderFormMessages) {
  return buildQuickOrderSchema(messages).extend({
    date: z.string().trim().max(20, messages.date),
    time: z.string().trim().max(20, messages.time),
    address: z.string().trim().max(500, messages.address),
    comment: z.string().max(2000).optional(),
  });
}
