"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isPublicAnalyticsPath } from "@/lib/analytics-paths";
import { visitSchema } from "@/lib/validation";

const VISITOR_KEY = "biouborka.visitorId";

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function getOrCreateVisitorId(): { id: string; isNew: boolean } {
  if (typeof window === "undefined") return { id: "", isNew: false };
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return { id: existing, isNew: false };
    const id = createId();
    window.localStorage.setItem(VISITOR_KEY, id);
    return { id, isNew: true };
  } catch {
    return { id: createId(), isNew: true };
  }
}

export function VisitTracker() {
  const pathname = usePathname();
  const visitorIdRef = useRef<string>("");
  const isNewRef = useRef(false);
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isPublicAnalyticsPath(pathname)) {
      lastTrackedPathRef.current = null;
      return;
    }
    if (lastTrackedPathRef.current === pathname) return;

    if (visitorIdRef.current === "") {
      const result = getOrCreateVisitorId();
      visitorIdRef.current = result.id;
      isNewRef.current = result.isNew;
    }

    const send = async () => {
      const parsed = visitSchema.safeParse({
        visitorId: visitorIdRef.current,
        path: (window.location.pathname + window.location.search).slice(0, 500),
        referrer: document.referrer.slice(0, 1000) || undefined,
        isNewVisitor: isNewRef.current,
      });
      if (!parsed.success) return;

      try {
        const response = await fetch("/api/visits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
          keepalive: true,
          signal: AbortSignal.timeout(25_000),
        });
        if (!response.ok) {
          console.warn("[visits] Посещение не сохранено:", response.status);
        }
      } catch {
        console.warn("[visits] Посещение не сохранено: запрос не завершён");
      }
    };

    lastTrackedPathRef.current = pathname;
    void send();
    isNewRef.current = false;
  }, [pathname]);

  return null;
}
