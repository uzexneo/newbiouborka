import type { MetadataRoute } from "next";
import { SERVICE_PAGES } from "@/lib/i18n/content";

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
  } else if (path.startsWith("/uz-krill/")) {
    path = path.slice("/uz-krill".length);
  } else if (path.startsWith("/uz-latin/")) {
    path = path.slice("/uz-latin".length);
  }
  return {
    url,
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

  items.push(entry(`${baseUrl}/uslugi`, 0.9, "weekly"));
  items.push(entry(`${baseUrl}/uz-krill/uslugi`, 0.9, "weekly"));
  items.push(entry(`${baseUrl}/uz-latin/uslugi`, 0.9, "weekly"));

  SERVICE_PAGES.forEach((page) => {
    items.push(entry(`${baseUrl}/uslugi/${page.slug}`, 0.8, "weekly"));
    items.push(entry(`${baseUrl}/uz-krill/uslugi/${page.slug}`, 0.8, "weekly"));
    items.push(entry(`${baseUrl}/uz-latin/uslugi/${page.slug}`, 0.8, "weekly"));
  });

  return items;
}
