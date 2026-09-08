"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "biouborka.visitorId";

function getOrCreateVisitorId(): { id: string; isNew: boolean } {
  if (typeof window === "undefined") return { id: "", isNew: false };
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return { id: existing, isNew: false };
    const id = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_KEY, id);
    return { id, isNew: true };
  } catch {
    return { id: crypto.randomUUID(), isNew: true };
  }
}

export function VisitTracker() {
  const pathname = usePathname();
  const visitorIdRef = useRef<string>("");
  const isNewRef = useRef(false);

  useEffect(() => {
    if (visitorIdRef.current === "") {
      const result = getOrCreateVisitorId();
      visitorIdRef.current = result.id;
      isNewRef.current = result.isNew;
    }

    const send = () => {
      const payload = {
        visitorId: visitorIdRef.current,
        path: window.location.pathname + window.location.search,
        referrer: document.referrer || undefined,
        isNewVisitor: isNewRef.current,
      };

      fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    };

    send();
  }, [pathname]);

  return null;
}
