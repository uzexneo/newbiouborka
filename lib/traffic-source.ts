import type { LeadAttribution } from "@/lib/validation/lead";

type RecordedSource = Pick<
  LeadAttribution,
  "gclid" | "gbraid" | "wbraid" | "utm_source" | "utm_medium" | "referrer"
>;

export const GOOGLE_ADS_SOURCE = "Google Реклама";

// Use the same channel for page views and leads, retaining the raw tags on
// their original records. A recorded tag is not a verified Ads conversion.
export function trafficSource(attribution: RecordedSource): string {
  const source = attribution.utm_source?.trim();
  const medium = attribution.utm_medium?.trim();
  if (
    [attribution.gclid, attribution.gbraid, attribution.wbraid].some((value) =>
      Boolean(value?.trim())
    ) ||
    (source?.toLowerCase() === "google" &&
      ["cpc", "ppc", "paidsearch", "paid_search"].includes(
        medium?.toLowerCase() ?? ""
      ))
  )
    return GOOGLE_ADS_SOURCE;
  if (source) return medium ? `${source} / ${medium}` : source;
  if (!attribution.referrer) return "Прямые заходы / источник не определён";

  try {
    const url = new URL(attribution.referrer);
    if (!["http:", "https:"].includes(url.protocol))
      return "Источник не определён";
    const host = url.hostname.toLowerCase();
    const matchesHost = (domain: string) =>
      host === domain || host.endsWith(`.${domain}`);
    if (matchesHost("biouborka.uz")) return "Переходы внутри сайта";
    if (matchesHost("instagram.com")) return "Instagram";
    if (matchesHost("t.me") || matchesHost("telegram.org")) return "Telegram";
    if (/^(?:.+\.)?google\.[a-z.]+$/.test(host)) return "Google";
    if (/^(?:.+\.)?yandex\.[a-z.]+$/.test(host)) return "Яндекс";
    if (matchesHost("bing.com")) return "Bing";
    if (matchesHost("chatgpt.com")) return "ChatGPT";
    return host || "Источник не определён";
  } catch {
    return "Источник не определён";
  }
}
