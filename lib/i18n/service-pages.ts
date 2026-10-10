import type { Metadata } from "next";
import type { Locale } from "./config";
import { dictionaries } from "./translations";
import { getServicePageBySlug } from "./content";
import { buildSocialMetadata, siteUrl } from "./seo";

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
    ...buildSocialMetadata(
      dict["uslugi.seoTitle"],
      dict["uslugi.seoDesc"],
      url,
      locale
    ),
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
    ...buildSocialMetadata(title, description, url, locale),
  };
}
