import type { LeadAttribution } from "@/lib/validation/lead";
import { isPublicAnalyticsPath } from "@/lib/analytics-paths";

export const LEAD_QUALITY_OPTIONS = [
  { value: "unreviewed", label: "Не проверена" },
  { value: "real", label: "Реальный клиент" },
  { value: "test", label: "Тестовая" },
  { value: "spam", label: "Спам" },
] as const;

export type LeadQuality = (typeof LEAD_QUALITY_OPTIONS)[number]["value"];

export interface ReportableLead {
  attribution?: LeadAttribution;
  leadQuality?: LeadQuality;
  createdAt: string;
}

export interface ReportableVisit {
  id: string;
  visitorId: string;
  sessionId?: string;
  path: string;
  createdAt: string;
}

export type LeadVisitMatch =
  | { status: "matched"; path: string; createdAt: string }
  | { status: "unlinked" | "unavailable" };

export function leadQuality(lead: ReportableLead): LeadQuality {
  return LEAD_QUALITY_OPTIONS.some(
    (option) => option.value === lead.leadQuality
  )
    ? lead.leadQuality!
    : "unreviewed";
}

// Tags indicate a recorded traffic source, not an Ads-confirmed conversion.
export function leadSource(lead: Pick<ReportableLead, "attribution">): string {
  const attribution = lead.attribution;
  if (!attribution) return "Источник не записан";
  if (attribution.gclid || attribution.gbraid || attribution.wbraid)
    return "Google Реклама";
  if (attribution.utm_source) {
    return attribution.utm_medium
      ? `${attribution.utm_source} / ${attribution.utm_medium}`
      : attribution.utm_source;
  }
  if (!attribution.referrer) return "Прямой / источник не определён";
  try {
    const hostname = new URL(attribution.referrer).hostname.toLowerCase();
    if (hostname === "biouborka.uz" || hostname.endsWith(".biouborka.uz"))
      return "Источник не определён";
    if (/^(?:.+\.)?google\.[a-z.]+$/.test(hostname)) return "Google";
    if (/^(?:.+\.)?yandex\.[a-z.]+$/.test(hostname)) return "Яндекс";
    return hostname || "Источник не определён";
  } catch {
    return "Источник не определён";
  }
}

export function matchLeadVisit(
  lead: ReportableLead,
  visit: ReportableVisit | null | undefined
): LeadVisitMatch {
  const attribution = lead.attribution;
  if (
    !visit ||
    !isPublicAnalyticsPath(visit.path) ||
    !attribution?.visitId ||
    !attribution.visitorId ||
    !attribution.sessionId ||
    visit.id !== attribution.visitId ||
    visit.visitorId !== attribution.visitorId ||
    visit.sessionId !== attribution.sessionId
  )
    return { status: "unlinked" };

  const leadTime = Date.parse(lead.createdAt);
  const visitTime = Date.parse(visit.createdAt);
  // A page write may finish shortly after the form write. Old or future records
  // must not establish a link just because untrusted IDs were reused.
  if (
    !Number.isFinite(leadTime) ||
    !Number.isFinite(visitTime) ||
    visitTime > leadTime + 5 * 60_000 ||
    visitTime < leadTime - 24 * 60 * 60_000
  )
    return { status: "unlinked" };

  try {
    const url = new URL(visit.path, "https://biouborka.uz");
    if (url.origin !== "https://biouborka.uz") return { status: "unlinked" };
    return {
      status: "matched",
      path: url.pathname,
      createdAt: visit.createdAt,
    };
  } catch {
    return { status: "unlinked" };
  }
}

export function summarizeLeadQuality(leads: ReportableLead[]) {
  const summary: Record<LeadQuality, number> = {
    unreviewed: 0,
    real: 0,
    test: 0,
    spam: 0,
  };
  for (const lead of leads) summary[leadQuality(lead)] += 1;
  return summary;
}
