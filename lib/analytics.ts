declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface GenerateLeadParams {
  formName: "order" | "quick";
  service?: string;
}

export function trackGenerateLead({
  formName,
  service,
}: GenerateLeadParams): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", "generate_lead", {
    currency: "UZS",
    form_name: formName,
    ...(service ? { service } : {}),
  });
}

export {};
