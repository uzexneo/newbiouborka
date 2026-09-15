import type { MetadataRoute } from "next";
import { SERVICE_CATEGORIES, ALL_SERVICES } from "@/lib/i18n/content";

const baseUrl = "https://biouborka.uz";

type LocaleCode = "ru" | "uzKrill" | "uzLatin";

const localeHreflang: Record<LocaleCode, string> = {
  ru: "ru",
  uzKrill: "uz-Cyrl",
  uzLatin: "uz-Latn",
};

function localizedUrl(base: string): Record<string, string> {
  const languages: Record<string, string> = {};
  (Object.keys(localeHreflang) as LocaleCode[]).forEach((code) => {
    const suffix = code === "ru" ? "" : `?lang=${code}`;
    languages[localeHreflang[code]] = `${baseUrl}${suffix}${base}`;
  });
  languages["x-default"] = `${baseUrl}${base}`;
  return languages;
}

function entry(
  url: string,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
): MetadataRoute.Sitemap[number] {
  return {
    url,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: { languages: localizedUrl(url.replace(baseUrl, "")) },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const items: MetadataRoute.Sitemap = [];

  items.push(entry(baseUrl, 1, "weekly"));

  const sections: Array<{ anchor: string; priority: number }> = [
    { anchor: "#services", priority: 0.9 },
    { anchor: "#about", priority: 0.8 },
    { anchor: "#portfolio", priority: 0.8 },
    { anchor: "#faq", priority: 0.7 },
    { anchor: "#contacts", priority: 0.8 },
  ];
  sections.forEach((section) => {
    items.push(
      entry(`${baseUrl}${section.anchor}`, section.priority, "monthly")
    );
  });

  SERVICE_CATEGORIES.forEach((category) => {
    items.push(entry(`${baseUrl}#${category.id}`, 0.7, "monthly"));
  });

  ALL_SERVICES.forEach((service) => {
    items.push(entry(`${baseUrl}#${service.id}`, 0.6, "monthly"));
  });

  return items;
}
