"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Inbox,
  RefreshCw,
  Phone,
  MapPin,
  CalendarClock,
  Wrench,
  MessageSquare,
  Trash2,
  PackageCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n/language-provider";
import { SERVICE_CATEGORIES } from "@/lib/i18n/content";
import { useSiteContent } from "@/lib/site-content-provider";

type OrderStatus = "application" | "order";

interface Order {
  id: string;
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  address: string;
  comment?: string;
  orderStatus?: OrderStatus;
  createdAt: string;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function AdminApplications() {
  const { t } = useLanguage();
  const { services } = useSiteContent();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestInFlight = useRef(false);
  const ordersRevision = useRef(0);

  const serviceNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of SERVICE_CATEGORIES) {
      for (const service of category.services) {
        map.set(service.id, t(service.titleKey));
      }
    }
    for (const category of services) {
      for (const service of category.services) {
        map.set(service.id, service.name);
      }
    }
    return map;
  }, [services, t]);

  const displayServiceName = (value: string): string =>
    serviceNameById.get(value) ?? value;

  const load = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    const requestRevision = ordersRevision.current;
    setRefreshing(true);
    try {
      const response = await fetch("/api/admin/orders", {
        cache: "no-store",
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        throw new Error(problem?.error ?? "Не удалось загрузить заявки. Обновите список.");
      }
      const data = (await response.json()) as Order[];
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      // A mutation completed while this read was pending: its older snapshot
      // must not overwrite the confirmed deletion or status change.
      if (requestRevision === ordersRevision.current) {
        setOrders(sorted);
        setLoadError(null);
      }
    } catch (error) {
      setLoadError(
        error instanceof Error && error.name === "Error"
          ? error.message
          : "Загрузка заявок не завершилась. Проверьте соединение и обновите список."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      requestInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    load();
    const refreshVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    const interval = window.setInterval(refreshVisible, 30_000);
    window.addEventListener("focus", refreshVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshVisible);
    };
  }, [load]);

  const handleDelete = async (order: Order) => {
    toast("Удалить заявку?", {
      action: {
        label: "Удалить",
        onClick: async () => {
          try {
            const response = await fetch(
              `/api/admin/orders?id=${encodeURIComponent(order.id)}`,
              { method: "DELETE" }
            );
            if (!response.ok) {
              const problem = await response.json().catch(() => null);
              throw new Error(problem?.error ?? "Не удалось удалить заявку");
            }
            ordersRevision.current += 1;
            toast.success("Заявка удалена");
            setOrders((prev) => prev.filter((o) => o.id !== order.id));
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Не удалось удалить заявку");
          }
        },
      },
      cancel: { label: "Отмена", onClick: () => {} },
    });
  };

  const handleStatusToggle = async (order: Order) => {
    const next: OrderStatus =
      order.orderStatus === "order" ? "application" : "order";
    try {
      const response = await fetch(
        `/api/admin/orders?id=${encodeURIComponent(order.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderStatus: next }),
        }
      );
      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        throw new Error(problem?.error ?? "Не удалось изменить статус");
      }
      ordersRevision.current += 1;
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, orderStatus: next } : o))
      );
      toast.success(
        next === "order" ? "Заявка переведена в заказ" : "Статус снят"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось изменить статус");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Загрузка заявок">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (loadError && orders.length === 0) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm">{loadError}</p>
        <Button variant="outline" onClick={() => void load()} disabled={refreshing}>
          <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Повторить загрузку
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <Inbox className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Заявок пока нет. Когда клиент оставит заявку, она появится здесь.
        </p>
        <Button variant="outline" onClick={() => void load()} disabled={refreshing}>
          <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Обновить
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{orders.length} заявок</p>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={refreshing}>
          <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Обновить
        </Button>
      </div>
      {loadError && (
        <div role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm">
          {loadError} Ниже показаны заявки из последней успешной загрузки.
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {orders.map((order) => (
          <div
            key={order.id}
            className="group flex flex-col gap-3 rounded-xl border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{order.name || "Заявка без имени"}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(order.createdAt) || "Дата неизвестна"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(order)}
                aria-label="Удалить заявку"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="inline-flex items-center gap-1"
              >
                <Wrench className="h-3 w-3" />
                {order.service ? displayServiceName(order.service) : "Услуга не указана"}
              </Badge>
              <Badge
                variant={order.orderStatus === "order" ? "default" : "outline"}
                className="inline-flex items-center gap-1"
              >
                <PackageCheck className="h-3 w-3" />
                {order.orderStatus === "order" ? "Заказ" : "Заявка"}
              </Badge>
              {(!order.name || !order.phone || !order.service || !formatDate(order.createdAt)) && (
                <Badge variant="destructive" className="inline-flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Неполная запись
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => handleStatusToggle(order)}
              >
                {order.orderStatus === "order"
                  ? "Вернуть в заявки"
                  : "Отметить заказом"}
              </Button>
            </div>

            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                {order.phone ? (
                  <a
                    href={`tel:${order.phone.replace(/[^\d+]/g, "")}`}
                    className="text-foreground hover:underline"
                  >
                    {order.phone}
                  </a>
                ) : (
                  <span>Телефон не указан</span>
                )}
              </div>
              {(order.date || order.time) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarClock className="h-4 w-4 shrink-0" />
                  <span className="text-foreground">
                    {[order.date, order.time].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {order.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{order.address}</span>
                </div>
              )}
              {order.comment && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{order.comment}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
