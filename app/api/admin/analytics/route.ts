import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable, ensureSiteVisitsTable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { getAllOrders, getAllVisits } from "@/lib/models";
import { isPublicAnalyticsPath } from "@/lib/analytics-paths";
import {
  ANALYTICS_TIME_ZONE,
  analyticsDate,
  analyticsDateRange,
} from "@/lib/analytics-dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = { "Cache-Control": "private, no-store" };
const periodSchema = z.coerce.number().int().min(1).max(365);

function unauthorized() {
  return NextResponse.json(
    { error: "Не авторизован" },
    { status: 401, headers: responseHeaders }
  );
}

interface VisitLite {
  visitorId: string;
  path: string;
  date: string;
  createdAt?: string;
  referrer?: string;
}

interface OrderLite {
  service: string;
  orderStatus?: "application" | "order";
  createdAt: string;
}

export interface AnalyticsDay {
  date: string;
  visits: number;
  visitors: number;
}

export interface FunnelData {
  visits: number;
  applications: number;
  orders: number;
}

export interface BreakdownItem {
  label: string;
  count: number;
}

export interface AnalyticsResponse {
  totalVisits: number;
  uniqueVisitors: number;
  days: AnalyticsDay[];
  funnel: FunnelData;
  byService: BreakdownItem[];
  bySource: BreakdownItem[];
  period: {
    from: string;
    to: string;
    timeZone: typeof ANALYTICS_TIME_ZONE;
  };
}

function categorizeSource(visit: VisitLite): string {
  const params = new URL(visit.path, "https://biouborka.uz").searchParams;
  const source = params.get("utm_source")?.trim();
  if (source) {
    const medium = params.get("utm_medium")?.trim();
    return medium ? `${source} / ${medium}` : source;
  }
  if (["gclid", "gbraid", "wbraid"].some((key) => params.has(key))) {
    return "Google Реклама";
  }
  if (!visit.referrer) return "Прямые заходы / источник не определён";
  try {
    const host = new URL(visit.referrer).hostname.toLowerCase();
    const matchesHost = (domain: string) =>
      host === domain || host.endsWith(`.${domain}`);
    if (matchesHost("biouborka.uz")) return "Переходы внутри сайта";
    if (matchesHost("instagram.com")) return "Instagram";
    if (matchesHost("t.me") || matchesHost("telegram.org")) return "Telegram";
    if (/^(?:.+\.)?google\.[a-z.]+$/.test(host)) return "Google";
    if (/^(?:.+\.)?yandex\.[a-z.]+$/.test(host)) return "Яндекс";
    if (matchesHost("bing.com")) return "Bing";
    if (matchesHost("chatgpt.com")) return "ChatGPT";
    return host || "Другие сайты";
  } catch {
    return "Источник не определён";
  }
}

function aggregate(
  visits: VisitLite[],
  orders: OrderLite[],
  fromDate: string,
  toDate: string
): AnalyticsResponse {
  const inRangeVisits = visits.flatMap((visit) => {
    if (!isPublicAnalyticsPath(visit.path)) return [];
    // Older rows stored the UTC date. Their timestamp gives the correct
    // calendar day in Tashkent, including visits around midnight.
    const date = visit.createdAt ? analyticsDate(visit.createdAt) : visit.date;
    if (!date || date < fromDate || date > toDate) return [];
    return [{ ...visit, date }];
  });

  const uniqueVisitors = new Set(inRangeVisits.map((v) => v.visitorId)).size;

  const byDay = new Map<string, { visits: number; visitors: Set<string> }>();
  const dates = analyticsDateRange(fromDate, toDate);
  for (const date of dates) {
    byDay.set(date, { visits: 0, visitors: new Set() });
  }

  for (const v of inRangeVisits) {
    const entry = byDay.get(v.date);
    if (!entry) continue;
    entry.visits += 1;
    entry.visitors.add(v.visitorId);
  }

  const days: AnalyticsDay[] = dates.map((date) => {
    const entry = byDay.get(date)!;
    return {
      date,
      visits: entry.visits,
      visitors: entry.visitors.size,
    };
  });

  const inRangeOrders = orders.filter((o) => {
    const date = analyticsDate(o.createdAt);
    return date !== null && date >= fromDate && date <= toDate;
  });
  const applications = inRangeOrders.length;
  const ordersCount = inRangeOrders.filter(
    (o) => o.orderStatus === "order"
  ).length;

  const serviceMap = new Map<string, number>();
  for (const o of inRangeOrders) {
    serviceMap.set(o.service, (serviceMap.get(o.service) ?? 0) + 1);
  }
  const byService: BreakdownItem[] = [...serviceMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const sourceMap = new Map<string, number>();
  for (const v of inRangeVisits) {
    const source = categorizeSource(v);
    sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);
  }
  const bySource: BreakdownItem[] = [...sourceMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalVisits: inRangeVisits.length,
    uniqueVisitors,
    days,
    funnel: {
      visits: inRangeVisits.length,
      applications,
      orders: ordersCount,
    },
    byService,
    bySource,
    period: { from: fromDate, to: toDate, timeZone: ANALYTICS_TIME_ZONE },
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  const rawDays = new URL(request.url).searchParams.get("days") ?? "30";
  const parsed = periodSchema.safeParse(rawDays);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Выберите период от 1 до 365 дней" },
      { status: 400, headers: responseHeaders }
    );
  }
  if (!isDatabaseAvailable()) {
    return NextResponse.json(
      { error: "Статистика временно недоступна" },
      { status: 503, headers: responseHeaders }
    );
  }

  try {
    await ensureSiteVisitsTable();
    const [visits, orders] = await Promise.all([getAllVisits(), getAllOrders()]);
    const toDate = analyticsDate(new Date())!;
    const start = new Date(toDate + "T00:00:00Z");
    start.setUTCDate(start.getUTCDate() - (parsed.data - 1));
    const fromDate = start.toISOString().split("T")[0];

    return NextResponse.json(aggregate(visits, orders, fromDate, toDate), {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(
      "[analytics] Не удалось прочитать статистику:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return NextResponse.json(
      { error: "Статистика временно недоступна" },
      { status: 503, headers: responseHeaders }
    );
  }
}
