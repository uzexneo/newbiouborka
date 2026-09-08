"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { seoByLocale, getHreflangAlternates, siteUrl } from "@/lib/i18n/seo";

const OG_IMAGE = `${siteUrl}/assets/hero-cleaning.png`;

function setMeta(
  attr: "name" | "property",
  key: string,
  content: string
): void {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string): void {
  let el = document.head.querySelector(
    'link[rel="canonical"]'
  ) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setHreflangLinks(): void {
  const alternates = getHreflangAlternates();

  document.head
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .forEach((el) => el.remove());

  const all = [...alternates, { hreflang: "x-default", href: siteUrl }];

  for (const entry of all) {
    let el = document.head.querySelector(
      `link[rel="alternate"][hreflang="${entry.hreflang}"]`
    ) as HTMLLinkElement | null;
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", "alternate");
      el.setAttribute("hreflang", entry.hreflang);
      document.head.appendChild(el);
    }
    el.setAttribute("href", entry.href);
  }
}

export function SeoMetaUpdater() {
  const { locale } = useLanguage();

  useEffect(() => {
    const seo = seoByLocale[locale];

    document.title = seo.title;
    document.documentElement.lang = seo.htmlLang;

    setCanonical(seo.url);
    setHreflangLinks();

    setMeta("name", "description", seo.description);
    setMeta("property", "og:title", seo.title);
    setMeta("property", "og:description", seo.description);
    setMeta("property", "og:locale", seo.ogLocale);
    setMeta("property", "og:url", seo.url);
    setMeta("property", "og:image", OG_IMAGE);

    setMeta("name", "twitter:title", seo.title);
    setMeta("name", "twitter:description", seo.description);
    setMeta("name", "twitter:image", OG_IMAGE);
  }, [locale]);

  return null;
}
