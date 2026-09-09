"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Inbox,
  Loader2,
  Phone,
  MapPin,
  CalendarClock,
  Wrench,
  MessageSquare,
  Trash2,
  PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchJson } from "@/lib/api-client";

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
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function AdminApplications() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchJson<Order[]>("/api/admin/orders");
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sorted);
    } catch {
      toast.error("Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
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
            if (!response.ok) throw new Error("delete failed");
            toast.success("Заявка удалена");
            setOrders((prev) => prev.filter((o) => o.id !== order.id));
          } catch {
            toast.error("Не удалось удалить заявку");
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
      if (!response.ok) throw new Error("update failed");
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, orderStatus: next } : o))
      );
      toast.success(
        next === "order" ? "Заявка переведена в заказ" : "Статус снят"
      );
    } catch {
      toast.error("Не удалось изменить статус");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Загрузка заявок...</span>
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{orders.length} заявок</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {orders.map((order) => (
          <div
            key={order.id}
            className="group flex flex-col gap-3 rounded-xl border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{order.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(order.createdAt)}
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
                {order.service}
              </Badge>
              <Badge
                variant={order.orderStatus === "order" ? "default" : "outline"}
                className="inline-flex items-center gap-1"
              >
                <PackageCheck className="h-3 w-3" />
                {order.orderStatus === "order" ? "Заказ" : "Заявка"}
              </Badge>
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
                <a
                  href={`tel:${order.phone.replace(/[^\d+]/g, "")}`}
                  className="text-foreground hover:underline"
                >
                  {order.phone}
                </a>
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
