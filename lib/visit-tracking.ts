import { z } from "zod";

const MARKETING_QUERY_KEYS = [
  "gclid",
  "gbraid",
  "wbraid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

function marketingSearch(url: URL, available: number): string {
  const params = new URLSearchParams();
  for (const key of MARKETING_QUERY_KEYS) {
    const value = url.searchParams.get(key)?.trim();
    if (!value || value.length > 500) continue;
    params.set(key, value);
    if (params.toString().length + 1 > available) params.delete(key);
  }
  const search = params.toString();
  return search ? `?${search}` : "";
}

export function sanitizeVisitPath(value: string): string {
  try {
    const url = new URL(value, "https://visit.invalid");
    const pathname = url.pathname.slice(0, 500);
    return pathname + marketingSearch(url, 500 - pathname.length);
  } catch {
    return "";
  }
}

export function sanitizeVisitReferrer(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return undefined;
    const base = url.origin + url.pathname;
    if (base.length > 1000) return undefined;
    return base + marketingSearch(url, 1000 - base.length);
  } catch {
    return undefined;
  }
}

const savedVisitConfirmationSchema = z.object({
  ok: z.literal(true),
  saved: z.literal(true),
  id: z.string().uuid(),
});

interface VisitSubmission {
  visitId?: string;
  visitorId: string;
  sessionId?: string;
  path: string;
  referrer?: string;
  isNewVisitor: boolean;
}

export function createTrackingId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index++)
      bytes[index] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

interface VisitSubmissionOptions {
  fetcher?: typeof fetch;
  wait?: (milliseconds: number) => Promise<void>;
  timeoutMs?: number;
}

function isTimeout(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "TimeoutError"
  );
}

// At most two requests: only a 503 or a request timeout permits the retry.
// A 2xx response alone is not proof that the API saved the visit.
export async function submitVisitWithRetry(
  payload: VisitSubmission,
  options: VisitSubmissionOptions = {}
): Promise<boolean> {
  const fetcher = options.fetcher ?? fetch;
  const wait =
    options.wait ??
    ((milliseconds) =>
      new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  const visitId = payload.visitId ?? createTrackingId();
  const body = JSON.stringify({ ...payload, visitId });
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? 25_000
    );
    let retry = false;
    try {
      const response = await fetcher("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
        signal: controller.signal,
      });
      if (response.status === 503) {
        retry = true;
      } else if (response.ok) {
        const confirmation = savedVisitConfirmationSchema.safeParse(
          await response.json()
        );
        return confirmation.success && confirmation.data.id === visitId;
      }
    } catch (error) {
      retry = controller.signal.aborted || isTimeout(error);
    } finally {
      clearTimeout(timeout);
    }
    if (!retry || attempt === 1) return false;
    await wait(2_000);
  }
  return false;
}
