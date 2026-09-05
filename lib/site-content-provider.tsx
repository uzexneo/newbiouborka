"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useLanguage } from "@/lib/i18n/language-provider";
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
  isDynamic: boolean;
}

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
  const { t } = useLanguage();

  const [dynamic, setDynamic] = useState<PublicContent | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/content")
      .then((res) => {
        if (!res.ok) throw new Error("content unavailable");
        return res.json() as Promise<PublicContent>;
      })
      .then((data) => {
        if (!cancelled) {
          setDynamic(data);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const staticServices = buildStaticServices(t);
  const staticCategories = groupServicesByCategory(staticServices);

  const services: SiteCategory[] =
    dynamic?.services && dynamic.services.length > 0
      ? groupServicesByCategory(dynamic.services)
      : staticCategories;

  const contacts: SiteContacts = dynamic?.contacts ?? DEFAULT_CONTACTS;

  const staticAbout: SiteAbout = {
    p1: t("about.p1"),
    p2: t("about.p2"),
    p3: t("about.p3"),
  };
  const about: SiteAbout = dynamic?.about ?? staticAbout;

  const staticBenefits: SiteBenefit[] = BENEFITS.map((b) => ({
    title: t(b.titleKey),
    desc: t(b.descKey),
  }));
  const benefits: SiteBenefit[] =
    dynamic?.benefits && dynamic.benefits.length > 0
      ? dynamic.benefits
      : staticBenefits;

  const staticTestimonials: SiteTestimonial[] = TESTIMONIALS.map((r) => ({
    name: t(r.nameKey),
    location: t(r.locationKey),
    text: t(r.textKey),
    rating: r.rating,
  }));
  const testimonials: SiteTestimonial[] =
    dynamic?.testimonials && dynamic.testimonials.length > 0
      ? dynamic.testimonials
      : staticTestimonials;

  const gallery: GalleryItem[] =
    dynamic?.gallery && dynamic.gallery.length > 0
      ? dynamic.gallery
      : galleryItems;

  const background: string = dynamic?.background ?? DEFAULT_BACKGROUND;

  const logo: string = dynamic?.logo ?? DEFAULT_LOGO;

  const logoSize: number =
    dynamic?.logoSize && dynamic.logoSize > 0
      ? dynamic.logoSize
      : DEFAULT_LOGO_SIZE;

  const hasDynamicData =
    loaded &&
    (!!dynamic?.services?.length ||
      !!dynamic?.contacts ||
      !!dynamic?.about ||
      !!dynamic?.benefits?.length ||
      !!dynamic?.testimonials?.length ||
      !!dynamic?.gallery?.length ||
      !!dynamic?.background ||
      !!dynamic?.logo);

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
        isDynamic: hasDynamicData,
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
}
