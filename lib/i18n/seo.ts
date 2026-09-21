import type { Locale } from "./config";
import { locales } from "./config";

export const siteUrl = "https://biouborka.uz";

export interface SeoMeta {
  htmlLang: string;
  hreflang: string;
  ogLocale: string;
  title: string;
  description: string;
  url: string;
}

export const seoByLocale: Record<Locale, SeoMeta> = {
  ru: {
    htmlLang: "ru",
    hreflang: "ru",
    ogLocale: "ru_RU",
    title: "Клининг Ташкент, уборка квартир от 25 000 сум | Биоуборка",
    description:
      "Уборка квартир Ташкент: клининг от 25 000 сум/м², биоуборка, химчистка мебели и ковров безопасными средствами. Выезд по всему городу. +998 93 375 27 02.",
    url: siteUrl,
  },
  uzKrill: {
    htmlLang: "uz",
    hreflang: "uz-Cyrl",
    ogLocale: "uz_Cyrl",
    title: "Клининг Тошкент — квартираларни тозалаш 25 000 сўмдан",
    description:
      "Тошкентда квартира тозалаш ва клининг: био тозалаш 25 000 сўм/м²дан, мебел ва гиламларни кимёвий тозалаш. Хавфсиз воситалар. Қўнғироқ қилинг: +998 93 375 27 02.",
    url: `${siteUrl}/uz-krill`,
  },
  uzLatin: {
    htmlLang: "uz-latn",
    hreflang: "uz-Latn",
    ogLocale: "uz_Latn",
    title: "Klining Toshkent — kvartiralarni tozalash 25 000 so'mdan",
    description:
      "Toshkentda kvartira tozalash va klining: bio tozalash 25 000 so'm/m²dan, mebel va gilamlarni kimyoviy tozalash. Xavfsiz vositalar. Tel: +998 93 375 27 02.",
    url: `${siteUrl}/uz-latin`,
  },
};

export interface HreflangEntry {
  hreflang: string;
  href: string;
}

export function getHreflangAlternates(): HreflangEntry[] {
  return locales.map((locale) => ({
    hreflang: seoByLocale[locale].hreflang,
    href: seoByLocale[locale].url,
  }));
}
