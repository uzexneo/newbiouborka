import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { getAllOrders, getAllVisits } from "@/lib/models";
import { mockOrders, mockVisits } from "@/lib/mock-data";

function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
}

interface VisitLite {
  visitorId: string;
  date: string;
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
}

function buildDateRange(days: number): string[] {
  const today = new Date().toISOString().split("T")[0];
  const start = new Date(today + "T00:00:00Z");
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start.toISOString());
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function categorizeSource(referrer?: string): string {
  if (!referrer) return "Прямые заходы";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("t.me") || host.includes("telegram.org"))
      return "Telegram";
    if (host.includes("google.")) return "Google";
    return "Другие сайты";
  } catch {
    return "Другие сайты";
  }
}

function aggregate(
  visits: VisitLite[],
  orders: OrderLite[],
  fromDate: string,
  toDate: string
): AnalyticsResponse {
  const inRangeVisits = visits.filter(
    (v) => v.date >= fromDate && v.date <= toDate
  );

  const uniqueVisitors = new Set(inRangeVisits.map((v) => v.visitorId)).size;

  const byDay = new Map<string, { visits: number; visitors: Set<string> }>();
  const dates = buildDateRange(
    Math.max(
      1,
      Math.floor(
        (new Date(toDate + "T00:00:00Z").getTime() -
          new Date(fromDate + "T00:00:00Z").getTime()) /
          86_400_000
      ) + 1
    )
  );
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
    const date = o.createdAt.slice(0, 10);
    return date >= fromDate && date <= toDate;
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
    const source = categorizeSource(v.referrer);
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
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  const rawDays = new URL(request.url).searchParams.get("days");
  const days = Math.min(
    365,
    Math.max(1, Number.parseInt(rawDays ?? "30", 10) || 30)
  );

  async function safeRead<T>(
    enabled: boolean,
    read: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    if (!enabled) return fallback;
    try {
      return await read();
    } catch (error) {
      console.warn(
        "Не удалось прочитать данные аналитики из базы, использую моки:",
        error
      );
      return fallback;
    }
  }

  try {
    const dbAvailable = await isDatabaseAvailable();
    const visits = await safeRead(dbAvailable, getAllVisits, mockVisits);
    const orders = await safeRead(dbAvailable, getAllOrders, mockOrders);

    const toDate = new Date().toISOString().split("T")[0];
    const start = new Date(toDate + "T00:00:00Z");
    start.setUTCDate(start.getUTCDate() - (days - 1));
    const fromDate = start.toISOString().split("T")[0];

    return NextResponse.json(aggregate(visits, orders, fromDate, toDate));
  } catch (error) {
    console.error("Ошибка получения аналитики:", error);
    return NextResponse.json(
      { error: "Ошибка получения аналитики" },
      { status: 500 }
    );
  }
}
