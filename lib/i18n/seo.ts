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
    title:
      "Уборка квартир в Ташкенте — BIOUBORKA.UZ | Биоуборка и химчистка мебели",
    description:
      "Профессиональная биоуборка квартир и домов в Ташкенте. Химчистка мебели и ковров безопасными средствами. Телефон +998 93 375 27 02. Работаем по всему Ташкенту.",
    url: siteUrl,
  },
  uzKrill: {
    htmlLang: "uz",
    hreflang: "uz-Cyrl",
    ogLocale: "uz_Cyrl",
    title:
      "Тошкентда квартира тозалаш — BIOUBORKA.UZ | Био тозалаш ва мебел кимёвий тозалаш",
    description:
      "Тошкентда квартира ва уйларни профессионал био тозалаш. Мебел ва гиламларни хавфсиз воситалар билан кимёвий тозалаш. Телефон +998 93 375 27 02. Бутун Тошкент бўйлаб ишлаймиз.",
    url: `${siteUrl}?lang=uzKrill`,
  },
  uzLatin: {
    htmlLang: "uz-latn",
    hreflang: "uz-Latn",
    ogLocale: "uz_Latn",
    title:
      "Toshkentda kvartira tozalash — BIOUBORKA.UZ | Bio tozalash va mebel kimyoviy tozalash",
    description:
      "Toshkentda kvartira va uylarni professional bio tozalash. Mebel va gilamlarni xavfsiz vositalar bilan kimyoviy tozalash. Telefon +998 93 375 27 02. Butun Toshkent bo'ylab ishlaymiz.",
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
