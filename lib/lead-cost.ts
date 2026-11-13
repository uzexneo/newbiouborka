import { z } from "zod";
import { GOOGLE_ADS_SOURCE } from "@/lib/traffic-source";

export const manualAdSpendSchema = z
  .string()
  .trim()
  .max(40)
  .regex(/^\d+(?:[.,]\d{1,6})?$/, "Введите расходы числом, например 0,00")
  .transform((value) => Number(value.replace(",", ".")))
  .pipe(z.number().finite().min(0).max(1_000_000_000));

export function realGoogleAdsInquiries(
  realLeadSources: { label: string; count: number }[]
): number {
  return realLeadSources.reduce(
    (total, source) =>
      source.label === GOOGLE_ADS_SOURCE &&
      Number.isSafeInteger(source.count) &&
      source.count > 0
        ? total + source.count
        : total,
    0
  );
}

export function costPerRealInquiry(
  spend: number,
  realInquiries: number
): number | null {
  if (
    !Number.isFinite(spend) ||
    spend < 0 ||
    !Number.isSafeInteger(realInquiries) ||
    realInquiries <= 0
  )
    return null;
  const cost = spend / realInquiries;
  return Number.isFinite(cost) ? cost : null;
}
