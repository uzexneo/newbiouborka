import {
  DEFAULT_CONTACTS,
  groupServicesByCategory,
  type PublicContent,
} from "./site-content";
import { dictionaries } from "./i18n/translations";
import type { Locale } from "./i18n/config";
import { localeToPath } from "./i18n/config";
import { localizeSiteServices } from "./i18n/site-content";
import { serviceCategoryPath, servicesHubPath } from "./i18n/service-pages";
import {
  SERVICE_PAGES,
  FAQ_ITEMS,
  getServiceCategoryById,
  getServicePageBySlug,
} from "./i18n/content";

export const SCHEMA_APP_NAME = "BIOUBORKA.UZ";
export const SCHEMA_APP_URL = "https://biouborka.uz";
const SCHEMA_IMAGE = `${SCHEMA_APP_URL}/assets/hero-cleaning.webp`;

export interface SchemaOrgJsonLd {
  "@context": string;
  "@graph": unknown[];
}

// Editable text may contain HTML-looking content. Escaping '<' keeps it inside
// the JSON script element while preserving its value for structured-data readers.
export function serializeJsonLd(value: unknown): string {
  return (JSON.stringify(value) ?? "null").replace(/</g, "\\u003c");
}

function publicAssetUrl(src: string): string | undefined {
  try {
    const url = new URL(src, SCHEMA_APP_URL);
    return /^https?:$/.test(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function buildLocalBusiness(content?: PublicContent | null) {
  const contacts = content?.contacts ?? DEFAULT_CONTACTS;
  const phone = contacts.phone.replace(/\D/g, "");
  const address = contacts.address.trim();
  const logo = publicAssetUrl(content?.logo ?? "/assets/logo.webp");
  return {
    "@type": "LocalBusiness",
    "@id": `${SCHEMA_APP_URL}/#organization`,
    name: SCHEMA_APP_NAME,
    url: SCHEMA_APP_URL,
    image: SCHEMA_IMAGE,
    ...(logo ? { logo } : {}),
    ...(phone ? { telephone: `+${phone}` } : {}),
    ...(contacts.email.trim() ? { email: contacts.email.trim() } : {}),
    ...(address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: address,
            addressLocality: "Ташкент",
            addressCountry: "UZ",
          },
        }
      : {}),
    areaServed: { "@type": "City", name: "Ташкент" },
    openingHours: "Mo-Su 09:00-21:00",
    sameAs: [contacts.instagram, contacts.telegram].filter(Boolean),
  };
}

function buildFaq(locale: Locale) {
  const dict = dictionaries[locale];
  return FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: dict[item.questionKey],
    acceptedAnswer: { "@type": "Answer", text: dict[item.answerKey] },
  }));
}

export function getSchemaOrgJsonLd(
  locale: Locale = "ru",
  content?: PublicContent | null
): SchemaOrgJsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildLocalBusiness(content),
      { "@type": "FAQPage", mainEntity: buildFaq(locale) },
    ],
  };
}

export interface ServiceOfferInput {
  name: string;
  price: string;
}

function homeUrl(locale: Locale) {
  return localeToPath[locale] === "/"
    ? SCHEMA_APP_URL
    : `${SCHEMA_APP_URL}${localeToPath[locale]}`;
}

export function getServicesHubJsonLd(
  url: string,
  categories: { name: string; url: string }[],
  locale: Locale = "ru",
  content?: PublicContent | null
): SchemaOrgJsonLd {
  const dict = dictionaries[locale];
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildLocalBusiness(content),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: dict["nav.home"],
            item: homeUrl(locale),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: dict["nav.services"],
            item: url,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: dict["uslugi.h1"],
        url,
        itemListElement: categories.map((category, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: category.name,
          url: category.url,
        })),
      },
    ],
  };
}

export function getServiceCategoryJsonLd(
  categoryName: string,
  url: string,
  services: ServiceOfferInput[],
  faq: { question: string; answer: string }[],
  locale: Locale = "ru",
  content?: PublicContent | null
): SchemaOrgJsonLd {
  // Retain the API for existing callers. A formatted range or per-m² price
  // cannot safely be converted into one fixed Offer price.
  void services;
  const dict = dictionaries[locale];
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildLocalBusiness(content),
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: categoryName,
        url,
        provider: { "@id": `${SCHEMA_APP_URL}/#organization` },
        areaServed: { "@type": "City", name: "Ташкент" },
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: dict["nav.home"],
            item: homeUrl(locale),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: dict["nav.services"],
            item: `${SCHEMA_APP_URL}${servicesHubPath(locale)}`,
          },
          { "@type": "ListItem", position: 3, name: categoryName, item: url },
        ],
      },
    ],
  };
}

function currentCategories(
  content: PublicContent | null | undefined,
  locale: Locale
) {
  return content?.services
    ? groupServicesByCategory(localizeSiteServices(content.services, locale))
    : [];
}

export function getServicesHubJsonLdDefault(
  locale: Locale = "ru",
  content?: PublicContent | null
): SchemaOrgJsonLd {
  const dict = dictionaries[locale];
  const url = `${SCHEMA_APP_URL}${servicesHubPath(locale)}`;
  const categories = currentCategories(content, locale);
  return getServicesHubJsonLd(
    url,
    SERVICE_PAGES.map((page) => {
      const category = getServiceCategoryById(page.categoryId);
      const current = categories.find((item) => item.id === page.categoryId);
      return {
        name:
          current?.title ?? (category ? dict[category.titleKey] : page.slug),
        url: `${url}/${page.slug}`,
      };
    }),
    locale,
    content
  );
}

export function getServiceCategoryJsonLdBySlug(
  slug: string,
  locale: Locale = "ru",
  content?: PublicContent | null
): SchemaOrgJsonLd | null {
  const page = getServicePageBySlug(slug);
  const category = page ? getServiceCategoryById(page.categoryId) : undefined;
  if (!page || !category) return null;
  const dict = dictionaries[locale];
  const current = currentCategories(content, locale).find(
    (item) => item.id === category.id
  );
  return getServiceCategoryJsonLd(
    current?.title ?? dict[category.titleKey],
    `${SCHEMA_APP_URL}${serviceCategoryPath(page.slug, locale)}`,
    [],
    page.faq.map((item) => ({
      question: dict[item.qKey],
      answer: dict[item.aKey],
    })),
    locale,
    content
  );
}
