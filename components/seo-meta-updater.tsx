"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { seoByLocale } from "@/lib/i18n/seo";

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

export function SeoMetaUpdater() {
  const { locale } = useLanguage();

  useEffect(() => {
    const seo = seoByLocale[locale];

    document.title = seo.title;
    document.documentElement.lang = seo.htmlLang;

    setMeta("name", "description", seo.description);
    setMeta("property", "og:title", seo.title);
    setMeta("property", "og:description", seo.description);
    setMeta("property", "og:locale", seo.ogLocale);
  }, [locale]);

  return null;
}
