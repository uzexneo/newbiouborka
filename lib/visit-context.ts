import { z } from "zod";
import { isPublicAnalyticsPath } from "@/lib/analytics-paths";
import {
  createTrackingId,
  sanitizeVisitPath,
  sanitizeVisitReferrer,
} from "@/lib/visit-tracking";

const VISITOR_KEY = "biouborka.visitorId";
const SESSION_KEY = "biouborka.visitSession.v1";
const IDLE_MS = 30 * 60 * 1000;
const MAX_SESSION_MS = 24 * 60 * 60 * 1000;
const sessionSchema = z
  .object({
    id: z.string().uuid(),
    createdAt: z.number().int().nonnegative(),
    lastSeenAt: z.number().int().nonnegative(),
  })
  .strict()
  .refine((value) => value.createdAt <= value.lastSeenAt);

let visitor: { id: string; confirmed: boolean } | undefined;
let session: z.infer<typeof sessionSchema> | undefined;
let currentVisit: BrowserVisit | undefined;
let currentKey: string | undefined;

export interface BrowserVisit {
  visitId: string;
  visitorId: string;
  sessionId: string;
  path: string;
  referrer?: string;
  isNewVisitor: boolean;
}

export function getBrowserVisit(): BrowserVisit | undefined {
  if (
    typeof window === "undefined" ||
    !isPublicAnalyticsPath(window.location.pathname)
  )
    return undefined;
  if (!visitor) {
    let existing: string | null = null;
    try {
      existing = window.localStorage.getItem(VISITOR_KEY);
    } catch {
      // Anonymous linking must also work with browser storage disabled.
    }
    visitor =
      existing && existing.length <= 100
        ? { id: existing, confirmed: true }
        : { id: createTrackingId(), confirmed: false };
  }

  const now = Date.now();
  if (!session) {
    try {
      const parsed = sessionSchema.safeParse(
        JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? "null")
      );
      if (parsed.success) session = parsed.data;
    } catch {
      // The in-memory context remains valid for this tab.
    }
  }
  if (
    !session ||
    now < session.lastSeenAt ||
    now - session.lastSeenAt >= IDLE_MS ||
    now - session.createdAt >= MAX_SESSION_MS
  ) {
    session = { id: createTrackingId(), createdAt: now, lastSeenAt: now };
  } else {
    session = { ...session, lastSeenAt: now };
  }
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Tracking metadata is optional and must never prevent a lead submission.
  }

  const path = sanitizeVisitPath(
    window.location.pathname + window.location.search
  );
  const key = `${session.id}:${path}`;
  if (currentKey !== key || !currentVisit) {
    currentKey = key;
    currentVisit = {
      visitId: createTrackingId(),
      visitorId: visitor.id,
      sessionId: session.id,
      path,
      referrer: sanitizeVisitReferrer(document.referrer),
      isNewVisitor: !visitor.confirmed,
    };
  }
  return { ...currentVisit, isNewVisitor: !visitor.confirmed };
}

export function confirmBrowserVisit(visit: BrowserVisit): void {
  if (!visitor || visitor.id !== visit.visitorId) return;
  visitor.confirmed = true;
  try {
    window.localStorage.setItem(VISITOR_KEY, visitor.id);
  } catch {
    // A confirmed identity still remains available in memory.
  }
}

export function isNewBrowserVisitor(visitorId: string): boolean {
  return visitor?.id === visitorId && !visitor.confirmed;
}
