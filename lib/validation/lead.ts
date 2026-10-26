import { z } from "zod";

const campaignValue = z.string().trim().min(1).max(500).optional();

export const leadAttributionSchema = z
  .object({
    visitorId: z.string().min(1).max(100).optional(),
    sessionId: z.string().uuid().optional(),
    visitId: z.string().uuid().optional(),
    gclid: campaignValue,
    gbraid: campaignValue,
    wbraid: campaignValue,
    utm_source: campaignValue,
    utm_medium: campaignValue,
    utm_campaign: campaignValue,
    utm_term: campaignValue,
    utm_content: campaignValue,
    landingUrl: z
      .string()
      .url()
      .max(2048)
      .refine((value) => {
        try {
          const url = new URL(value);
          return (
            ["http:", "https:"].includes(url.protocol) &&
            !url.search &&
            !url.hash &&
            !url.username &&
            !url.password
          );
        } catch {
          return false;
        }
      })
      .optional(),
    referrer: z
      .string()
      .url()
      .max(1000)
      .refine((value) => {
        try {
          const url = new URL(value);
          return (
            ["http:", "https:"].includes(url.protocol) &&
            !url.search &&
            !url.hash &&
            !url.username &&
            !url.password
          );
        } catch {
          return false;
        }
      })
      .optional(),
  })
  .strict();

export type LeadAttribution = z.infer<typeof leadAttributionSchema>;

export const leadAttributionCacheSchema = z
  .object({
    attribution: leadAttributionSchema,
    capturedAt: z.number().int().nonnegative(),
    lastSeenAt: z.number().int().nonnegative(),
  })
  .strict()
  .refine((cache) => cache.capturedAt <= cache.lastSeenAt);

export type LeadAttributionCache = z.infer<typeof leadAttributionCacheSchema>;

export const leadRequestFields = {
  attribution: leadAttributionSchema.optional(),
};
