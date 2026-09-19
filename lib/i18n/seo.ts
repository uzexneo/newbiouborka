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
    title: "Уборка квартир в Ташкенте от 25 000 сум | Биоуборка",
    description:
      "Клининг в Ташкенте: биоуборка квартир от 25 000 сум, химчистка мебели от 70 000 сум. Только безопасные средства, выезд по всему городу. +998 93 375 27 02.",
    url: siteUrl,
  },
  uzKrill: {
    htmlLang: "uz",
    hreflang: "uz-Cyrl",
    ogLocale: "uz_Cyrl",
    title: "Тошкентда квартира тозалаш 25 000 сўмдан | Био тозалаш",
    description:
      "Тошкентда клининг: квартира ва уйларни био тозалаш 25 000 сўмдан, мебел кимёвий тозалаш 70 000 сўмдан. Хавфсиз воситалар. Телефон: +998 93 375 27 02.",
    url: `${siteUrl}?lang=uzKrill`,
  },
  uzLatin: {
    htmlLang: "uz-latn",
    hreflang: "uz-Latn",
    ogLocale: "uz_Latn",
    title: "Toshkentda kvartira tozalash 25 000 so'mdan | Bio tozalash",
    description:
      "Toshkentda klinning: kvartira va uylarni bio tozalash 25 000 so'mdan, mebel kimyoviy tozalash 70 000 so'mdan. Xavfsiz vositalar. Telefon: +998 93 375 27 02.",
    url: `${siteUrl}?lang=uzLatin`,
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
