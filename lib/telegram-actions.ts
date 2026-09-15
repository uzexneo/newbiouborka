export interface TrackActionPayload {
  type: "call_click" | "order_start";
  phone?: string;
  service?: string;
  source?: string;
}

export function currentPath(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.pathname + window.location.search;
}

async function sendTrackAction(payload: TrackActionPayload): Promise<void> {
  try {
    await fetch("/api/track-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Тихо игнорируем ошибки, чтобы не нарушать работу сайта.
  }
}

export function trackCallClick(phone: string): void {
  void sendTrackAction({
    type: "call_click",
    phone,
    source: currentPath(),
  });
}

export function trackOrderStart(service?: string): void {
  void sendTrackAction({
    type: "order_start",
    service,
    source: currentPath(),
  });
}
