import type { MetadataRoute } from "next";
import { SERVICE_CATEGORIES, ALL_SERVICES } from "@/lib/i18n/content";

const baseUrl = "https://biouborka.uz";

function localizedUrl(path: string): Record<string, string> {
  return {
    ru: `${baseUrl}${path}`,
    "uz-Cyrl": `${baseUrl}/uz-krill${path}`,
    "uz-Latn": `${baseUrl}/uz-latin${path}`,
    "x-default": `${baseUrl}${path}`,
  };
}

function entry(
  url: string,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
): MetadataRoute.Sitemap[number] {
  let path = url.replace(baseUrl, "");
  if (path === "/uz-krill" || path === "/uz-latin") {
    path = "";
  }
  return {
    url,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: { languages: localizedUrl(path) },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const items: MetadataRoute.Sitemap = [];

  items.push(entry(baseUrl, 1, "weekly"));
  items.push(entry(`${baseUrl}/uz-krill`, 1, "weekly"));
  items.push(entry(`${baseUrl}/uz-latin`, 1, "weekly"));

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
