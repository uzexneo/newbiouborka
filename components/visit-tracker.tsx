"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureLeadAttribution } from "@/lib/analytics";
import { visitSchema } from "@/lib/validation";
import {
  confirmBrowserVisit,
  getBrowserVisit,
  isNewBrowserVisitor,
} from "@/lib/visit-context";
import { submitVisitWithRetry } from "@/lib/visit-tracking";

function PublicVisitTracker() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const pending = useRef(new Set<string>());
  const confirmed = useRef(new Set<string>());
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const visit = getBrowserVisit();
    if (
      !visit ||
      pending.current.has(visit.visitId) ||
      confirmed.current.has(visit.visitId)
    )
      return;
    captureLeadAttribution();
    pending.current.add(visit.visitId);
    // Serial saves prevent rapid navigation from counting one visitor as new
    // on several pages. A failed save leaves the identity unconfirmed.
    const send = async () => {
      try {
        const parsed = visitSchema.safeParse({
          ...visit,
          isNewVisitor: isNewBrowserVisitor(visit.visitorId),
        });
        if (!parsed.success) return;
        if (await submitVisitWithRetry(parsed.data)) {
          confirmBrowserVisit(visit);
          confirmed.current.add(visit.visitId);
          if (confirmed.current.size > 100) {
            const oldest = confirmed.current.values().next().value;
            if (oldest) confirmed.current.delete(oldest);
          }
        } else {
          console.warn("[visits] Посещение не сохранено");
        }
      } catch {
        console.warn("[visits] Посещение не сохранено: запрос не завершён");
      } finally {
        pending.current.delete(visit.visitId);
      }
    };
    queue.current = queue.current.then(send, send);
  }, [pathname, search]);

  return null;
}

export function VisitTracker() {
  return (
    <Suspense fallback={null}>
      <PublicVisitTracker />
    </Suspense>
  );
}
