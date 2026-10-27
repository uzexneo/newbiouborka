import { isPublicAnalyticsPath } from "@/lib/analytics-paths";
import { getBrowserVisit } from "@/lib/visit-context";
import {
  leadAttributionCacheSchema,
  type LeadAttribution,
  type LeadAttributionCache,
} from "@/lib/validation/lead";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface GenerateLeadParams {
  formName: "order" | "quick" | "feedback";
  service?: string;
}

const ATTRIBUTION_KEY = "biouborka.leadAttribution.v3";
const IDLE_MS = 30 * 60 * 1000;
const MAX_MS = 24 * 60 * 60 * 1000;
const CAMPAIGN_KEYS = [
  "gclid",
  "gbraid",
  "wbraid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;
let attributionInMemory: LeadAttributionCache | undefined;

// Store campaign metadata and anonymous linking IDs only. Customer form values,
// unrelated query parameters, fragments and credentials are never retained.
export function captureLeadAttribution(): LeadAttribution | undefined {
  try {
    const visit = getBrowserVisit();
    if (!visit) return undefined;
    const url = new URL(window.location.href);
    const now = Date.now();
    const campaign: LeadAttribution = {};
    for (const key of CAMPAIGN_KEYS) {
      const value = url.searchParams.get(key)?.trim();
      if (value && value.length <= 500) campaign[key] = value;
    }
    let stored = attributionInMemory;
    try {
      const parsed = leadAttributionCacheSchema.safeParse(
        JSON.parse(window.sessionStorage.getItem(ATTRIBUTION_KEY) ?? "null")
      );
      if (parsed.success) stored = parsed.data;
    } catch {
      // Browser storage can be unavailable; the tab's memory is sufficient.
    }
    if (
      stored &&
      (stored.attribution.sessionId !== visit.sessionId ||
        now < stored.lastSeenAt ||
        now - stored.lastSeenAt >= IDLE_MS ||
        now - stored.capturedAt >= MAX_MS)
    ) {
      stored = undefined;
    }
    const newCampaign =
      Object.keys(campaign).length > 0 &&
      CAMPAIGN_KEYS.some((key) => campaign[key] !== stored?.attribution[key]);
    if (!stored || newCampaign) {
      const landingUrl = url.origin + url.pathname;
      let referrer: string | undefined;
      try {
        const referringUrl = new URL(document.referrer);
        if (["http:", "https:"].includes(referringUrl.protocol)) {
          const clean = referringUrl.origin + referringUrl.pathname;
          if (clean.length <= 1000) referrer = clean;
        }
      } catch {
        // Direct visits have no referring URL.
      }
      stored = {
        attribution: {
          ...campaign,
          ...(landingUrl.length <= 2048 ? { landingUrl } : {}),
          ...(referrer ? { referrer } : {}),
        },
        capturedAt: now,
        lastSeenAt: now,
      };
    }
    stored = {
      ...stored,
      attribution: {
        ...stored.attribution,
        visitorId: visit.visitorId,
        sessionId: visit.sessionId,
        visitId: visit.visitId,
      },
      lastSeenAt: now,
    };
    attributionInMemory = stored;
    try {
      window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(stored));
    } catch {
      // Optional analytics must not stop a customer from submitting a lead.
    }
    return stored.attribution;
  } catch {
    return undefined;
  }
}

export function trackGenerateLead({
  formName,
  service,
}: GenerateLeadParams): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }
  if (!isPublicAnalyticsPath(window.location.pathname)) return;
  try {
    window.gtag("event", "generate_lead", {
      currency: "UZS",
      form_name: formName,
      ...(service ? { service } : {}),
    });
  } catch {
    // A tracking error must not turn an already saved lead into a failed form.
  }
}

const PHONE_CLICK_LOCATIONS = [
  "home_hero",
  "service_category",
  "floating_call",
  "contacts",
  "footer",
  "services_hub",
] as const;

const PHONE_SERVICE_CATEGORIES = new Set([
  "cleaning",
  "windows",
  "carpets",
  "furniture",
  "mattresses",
  "leather",
  "floors",
  "kitchen",
  "other",
]);

interface PhoneClickParams {
  location: (typeof PHONE_CLICK_LOCATIONS)[number];
  service?: string;
}

// This records an attempt to open the dialler, not a call or a saved lead.
export function trackPhoneClick({ location, service }: PhoneClickParams): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }
  if (
    !isPublicAnalyticsPath(window.location.pathname) ||
    !PHONE_CLICK_LOCATIONS.includes(location)
  ) {
    return;
  }
  try {
    window.gtag("event", "phone_click", {
      link_location: location,
      ...(service && PHONE_SERVICE_CATEGORIES.has(service) ? { service } : {}),
    });
  } catch {
    // Optional analytics must never stop the phone link from opening.
  }
}

export {};
