"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { localizeSiteServices } from "@/lib/i18n/site-content";
import { BENEFITS, SERVICE_CATEGORIES, TESTIMONIALS } from "@/lib/i18n/content";
import type { TranslationKey } from "@/lib/i18n/translations";
import { galleryItems } from "@/lib/gallery-data";
import type { GalleryItem } from "@/lib/gallery-data";
import {
  DEFAULT_BACKGROUND,
  DEFAULT_CONTACTS,
  DEFAULT_LOGO,
  DEFAULT_LOGO_SIZE,
  groupServicesByCategory,
} from "@/lib/site-content";
import type {
  PublicContent,
  SiteAbout,
  SiteBenefit,
  SiteCategory,
  SiteContacts,
  SiteService,
  SiteTestimonial,
} from "@/lib/site-content";

interface SiteContentValue {
  services: SiteCategory[];
  contacts: SiteContacts;
  about: SiteAbout;
  benefits: SiteBenefit[];
  testimonials: SiteTestimonial[];
  gallery: GalleryItem[];
  background: string;
  logo: string;
  logoSize: number;
  procedurePhotos: Record<string, string>;
  isDynamic: boolean;
}

type ContentResponse = PublicContent & {
  unavailableSections?: (keyof PublicContent)[];
};

const contentKeys: (keyof PublicContent)[] = [
  "services",
  "contacts",
  "about",
  "benefits",
  "testimonials",
  "gallery",
  "background",
  "logo",
  "logoSize",
  "procedurePhotos",
];

const SiteContentContext = createContext<SiteContentValue | null>(null);

export function useSiteContent(): SiteContentValue {
  const value = useContext(SiteContentContext);
  if (!value) {
    throw new Error("useSiteContent must be used within SiteContentProvider");
  }
  return value;
}

function buildStaticServices(
  t: (key: TranslationKey) => string
): SiteService[] {
  const services: SiteService[] = [];
  SERVICE_CATEGORIES.forEach((category, ci) => {
    category.services.forEach((service, si) => {
      services.push({
        id: service.id,
        categoryId: category.id,
        categoryTitle: t(category.titleKey),
        name: t(service.titleKey),
        price: t(service.priceKey),
        sortOrder: ci * 100 + si,
      });
    });
  });
  return services;
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const { t, locale } = useLanguage();

  const [dynamic, setDynamic] = useState<PublicContent | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let controller: AbortController | null = null;
    let requestId = 0;

    const load = async () => {
      controller?.abort();
      controller = new AbortController();
      const currentId = ++requestId;
      try {
        const response = await fetch("/api/content", {
          cache: "no-store",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(30_000),
          ]),
        });
        if (!response.ok) throw new Error("content unavailable");
        const data = (await response.json()) as ContentResponse;
        if (!cancelled && currentId === requestId) {
          setDynamic((previous) => {
            if (!previous || !Array.isArray(data.unavailableSections))
              return data;
            const preserved = Object.fromEntries(
              data.unavailableSections
                .filter((key) => contentKeys.includes(key))
                .map((key) => [key, previous[key]])
            ) as Partial<PublicContent>;
            return { ...data, ...preserved };
          });
        }
      } catch {
        // Keep the most recent content when a refresh fails.
      } finally {
        if (!cancelled && currentId === requestId) setLoaded(true);
      }
    };

    const refresh = () => {
      void load();
    };
    const refreshVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    refresh();
    window.addEventListener("biouborka:content-updated", refresh);
    window.addEventListener("focus", refreshVisible);
    window.addEventListener("pageshow", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      cancelled = true;
      controller?.abort();
      window.removeEventListener("biouborka:content-updated", refresh);
      window.removeEventListener("focus", refreshVisible);
      window.removeEventListener("pageshow", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, []);

  const staticServices = buildStaticServices(t);
  const staticCategories = groupServicesByCategory(staticServices);

  const services: SiteCategory[] =
    dynamic?.services != null
      ? groupServicesByCategory(localizeSiteServices(dynamic.services, locale))
      : staticCategories;

  const contacts: SiteContacts = dynamic?.contacts
    ? { ...DEFAULT_CONTACTS, ...dynamic.contacts }
    : DEFAULT_CONTACTS;

  const staticAbout: SiteAbout = {
    p1: t("about.p1"),
    p2: t("about.p2"),
    p3: t("about.p3"),
  };
  const about: SiteAbout =
    locale === "ru" ? (dynamic?.about ?? staticAbout) : staticAbout;

  const staticBenefits: SiteBenefit[] = BENEFITS.map((b) => ({
    title: t(b.titleKey),
    desc: t(b.descKey),
  }));
  const benefits: SiteBenefit[] =
    dynamic?.benefits != null &&
    (locale === "ru" || dynamic.benefits.length === 0)
      ? dynamic.benefits
      : staticBenefits;

  const staticTestimonials: SiteTestimonial[] = TESTIMONIALS.map((r) => ({
    name: t(r.nameKey),
    location: t(r.locationKey),
    text: t(r.textKey),
    rating: r.rating,
  }));
  const testimonials: SiteTestimonial[] =
    dynamic?.testimonials != null &&
    (locale === "ru" || dynamic.testimonials.length === 0)
      ? dynamic.testimonials
      : staticTestimonials;

  const gallery: GalleryItem[] =
    dynamic?.gallery != null ? dynamic.gallery : galleryItems;

  const background: string = dynamic?.background ?? DEFAULT_BACKGROUND;

  const logo: string = dynamic?.logo ?? DEFAULT_LOGO;

  const logoSize: number =
    dynamic?.logoSize && dynamic.logoSize > 0
      ? dynamic.logoSize
      : DEFAULT_LOGO_SIZE;

  const procedurePhotos: Record<string, string> =
    dynamic?.procedurePhotos ?? {};

  const hasDynamicData =
    loaded &&
    (!!dynamic?.services?.length ||
      !!dynamic?.contacts ||
      !!dynamic?.about ||
      !!dynamic?.benefits?.length ||
      !!dynamic?.testimonials?.length ||
      !!dynamic?.gallery?.length ||
      !!dynamic?.background ||
      !!dynamic?.logo ||
      Object.keys(procedurePhotos).length > 0);

  return (
    <SiteContentContext.Provider
      value={{
        services,
        contacts,
        about,
        benefits,
        testimonials,
        gallery,
        background,
        logo,
        logoSize,
        procedurePhotos,
        isDynamic: hasDynamicData,
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
}
