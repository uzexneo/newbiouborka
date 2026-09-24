import type { Metadata } from "next";
import type { Locale } from "./config";
import { dictionaries } from "./translations";
import { getServicePageBySlug } from "./content";
import { siteUrl } from "./seo";

export function localePathPrefix(locale: Locale): string {
  if (locale === "uzKrill") return "/uz-krill";
  if (locale === "uzLatin") return "/uz-latin";
  return "";
}

export function servicesHubPath(locale: Locale): string {
  return `${localePathPrefix(locale)}/uslugi`;
}

export function serviceCategoryPath(slug: string, locale: Locale): string {
  return `${localePathPrefix(locale)}/uslugi/${slug}`;
}

function alternateLanguages(path: string) {
  return {
    ru: `${siteUrl}${path}`,
    "uz-Cyrl": `${siteUrl}/uz-krill${path}`,
    "uz-Latn": `${siteUrl}/uz-latin${path}`,
    "x-default": `${siteUrl}${path}`,
  };
}

function ogLocale(locale: Locale): string {
  if (locale === "uzKrill") return "uz_Cyrl";
  if (locale === "uzLatin") return "uz_Latn";
  return "ru_RU";
}

export function buildServicesHubMetadata(locale: Locale): Metadata {
  const dict = dictionaries[locale];
  const path = servicesHubPath(locale);
  const url = `${siteUrl}${path}`;
  return {
    title: { absolute: dict["uslugi.seoTitle"] },
    description: dict["uslugi.seoDesc"],
    alternates: {
      canonical: url,
      languages: alternateLanguages("/uslugi"),
    },
    openGraph: {
      type: "website",
      locale: ogLocale(locale),
      title: dict["uslugi.seoTitle"],
      description: dict["uslugi.seoDesc"],
      url,
    },
  };
}

export function buildServiceCategoryMetadata(
  slug: string,
  locale: Locale
): Metadata {
  const page = getServicePageBySlug(slug);
  if (!page) {
    return {};
  }
  const dict = dictionaries[locale];
  const path = serviceCategoryPath(slug, locale);
  const url = `${siteUrl}${path}`;
  const title = dict[page.seoTitleKey];
  const description = dict[page.seoDescKey];
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url,
      languages: alternateLanguages(`/uslugi/${page.slug}`),
    },
    openGraph: {
      type: "website",
      locale: ogLocale(locale),
      title,
      description,
      url,
    },
  };
}
