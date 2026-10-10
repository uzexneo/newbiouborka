"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Eye,
  Filter,
  MousePointerClick,
  RefreshCw,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnalyticsResponse } from "@/app/api/admin/analytics/route";
import { fetchJson } from "@/lib/api-client";

const PERIOD_OPTIONS = [
  { value: 7, label: "7 дней" },
  { value: 14, label: "14 дней" },
  { value: 30, label: "30 дней" },
  { value: 90, label: "90 дней" },
  { value: 365, label: "365 дней" },
];

function formatShortDate(date: string): string {
  const [, m, d] = date.split("-");
  return `${Number(d)}.${Number(m)}`;
}

function formatPeriodDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${Number(day)}.${Number(month)}.${year}`;
}

function percent(part: number, total: number): string {
  if (!total) return "—";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function ConversionFunnel({ data }: { data: AnalyticsResponse["funnel"] }) {
  const steps = [
    {
      label: "Просмотры страниц",
      hint: "Загрузки страниц и переходы по сайту",
      value: data.visits,
    },
    {
      label: "Заявки",
      hint: "Созданы в выбранном периоде",
      value: data.applications,
    },
    { label: "Заказы", hint: "Из заявок этого периода", value: data.orders },
  ];
  const max = Math.max(1, ...steps.map((step) => step.value));

  return (
    <div className="space-y-4">
      {steps.map((step, i) => {
        const conversion =
          i === 2 ? percent(data.orders, data.applications) : null;
        const width = Math.max(
          step.value > 0 ? 6 : 0,
          (step.value / max) * 100
        );
        return (
          <div key={step.label} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">{step.label}</span>
              <span className="text-muted-foreground">
                {step.hint} ·{" "}
                <span className="font-semibold text-foreground">
                  {step.value}
                </span>
              </span>
            </div>
            <div className="h-6 w-full overflow-hidden rounded-md bg-muted">
              <div
                className="h-full rounded-md bg-primary transition-all duration-500"
                style={{ width: `${width}%` }}
              />
            </div>
            {conversion !== null && (
              <p className="text-xs text-muted-foreground">
                Заявок отмечено как заказы:{" "}
                <span className="font-semibold text-foreground">
                  {conversion}
                </span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BreakdownCard({
  title,
  icon: Icon,
  items,
  emptyText,
}: {
  title: string;
  icon: typeof Filter;
  items: AnalyticsResponse["byService"];
  emptyText: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate">{item.label}</span>
                  <span className="shrink-0 font-semibold">{item.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded bg-muted">
                  <div
                    className="h-full rounded bg-primary"
                    style={{
                      width: `${Math.max(2, (item.count / max) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticsBarChart({ days }: { days: AnalyticsResponse["days"] }) {
  const max = useMemo(() => Math.max(1, ...days.map((d) => d.visits)), [days]);

  if (days.length === 0) return null;

  const width = 640;
  const height = 220;
  const paddingX = 8;
  const paddingTop = 16;
  const chartHeight = height - paddingTop;
  const barGap = 3;

  const slotWidth = (width - paddingX * 2) / days.length;
  const barWidth = Math.max(2, slotWidth - barGap);

  const labelStep = Math.max(1, Math.ceil(days.length / 10));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full min-w-[480px]"
        role="img"
        aria-label="График просмотров страниц по дням"
      >
        {[0.25, 0.5, 0.75].map((ratio) => {
          const y = paddingTop + chartHeight * ratio;
          return (
            <line
              key={ratio}
              x1={paddingX}
              x2={width - paddingX}
              y1={y}
              y2={y}
              className="stroke-border"
              strokeWidth={1}
            />
          );
        })}
        {days.map((day, i) => {
          const barHeight = (day.visits / max) * (chartHeight - 12);
          const x = paddingX + i * slotWidth + barGap / 2;
          const y = paddingTop + chartHeight - barHeight;
          const showLabel = i % labelStep === 0;
          return (
            <g key={day.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(day.visits > 0 ? 2 : 0, barHeight)}
                rx={2}
                className="fill-primary"
              />
              {showLabel && (
                <text
                  x={x + barWidth / 2}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px]"
                >
                  {formatShortDate(day.date)}
                </text>
              )}
              <title>{`${day.date}: ${day.visits} просмотров страниц, ${day.visitors} посетителей`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const result = await fetchJson<AnalyticsResponse>(
          `/api/admin/analytics?days=${days}`,
          { cache: "no-store" }
        );
        if (active) setData(result);
      } catch {
        if (active) {
          setData(null);
          setError("Не удалось загрузить статистику. Повторите попытку.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [days, reload]);

  const handlePeriodChange = (value: string | null) => {
    if (value !== null && Number(value) !== days) {
      setData(null);
      setError(null);
      setLoading(true);
      setDays(Number(value));
    }
  };

  const refresh = () => {
    setData(null);
    setError(null);
    setLoading(true);
    setReload((value) => value + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Собственная статистика сайта · время Ташкента
          </p>
          <p className="text-xs">
            Это отдельный отчёт: данные Google Analytics сюда не загружаются.
          </p>
          {data && (
            <p className="text-xs">
              {formatPeriodDate(data.period.from)}–{formatPeriodDate(data.period.to)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={handlePeriodChange}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Обновить
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4" role="status" aria-label="Загрузка статистики">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : error ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center"
          role="alert"
        >
          <div className="rounded-full bg-muted p-3">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={refresh}>
            Повторить загрузку
          </Button>
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.totalVisits}</p>
                  <p className="text-sm text-muted-foreground">
                    Просмотров страниц
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.uniqueVisitors}</p>
                  <p className="text-sm text-muted-foreground">
                    Уникальных посетителей
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Посетитель определяется по браузеру
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {data.days.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-4 text-sm font-semibold">
                  Просмотры страниц по дням
                </h3>
                <AnalyticsBarChart days={data.days} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <MousePointerClick className="h-4 w-4 text-primary" />
                Просмотры, заявки и заказы за период
              </h3>
              <ConversionFunnel data={data.funnel} />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownCard
              title="Заявки по услугам"
              icon={Wrench}
              items={data.byService}
              emptyText="За выбранный период заявок нет."
            />
            <BreakdownCard
              title="Источники просмотров"
              icon={Filter}
              items={data.bySource}
              emptyText="За выбранный период просмотров нет."
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            За выбранный период нет данных.
          </p>
        </div>
      )}
    </div>
  );
}
