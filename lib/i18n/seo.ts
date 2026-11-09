import type { Metadata } from "next";
import type { Locale } from "./config";
import { locales } from "./config";

export const siteUrl = "https://biouborka.uz";
export const siteSocialImage = `${siteUrl}/assets/hero-cleaning.png`;

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
    ogLocale: "ru_UZ",
    title: "Клининг в Ташкенте — уборка квартир и домов | Биоуборка",
    description:
      "Генеральная уборка квартир и уборка после ремонта в Ташкенте. Работаем 10 лет. Бесплатный выезд. Посмотрите состав работ и цены, закажите расчёт.",
    url: siteUrl,
  },
  uzKrill: {
    htmlLang: "uz-Cyrl",
    hreflang: "uz-Cyrl",
    ogLocale: "uz_UZ",
    title: "Тошкентда клининг — квартира ва уйларни тозалаш | Биоуборка",
    description:
      "Тошкентда квартираларни умумий ва таъмирдан кейин тозалаш. 10 йиллик тажриба. Чиқиш бепул. Ишлар таркиби ва нархларни кўринг, ҳисоб-китоб буюртма қилинг.",
    url: `${siteUrl}/uz-krill`,
  },
  uzLatin: {
    htmlLang: "uz-Latn",
    hreflang: "uz-Latn",
    ogLocale: "uz_UZ",
    title: "Toshkentda klining — kvartira va uylarni tozalash | Biouborka",
    description:
      "Toshkentda kvartiralarni umumiy va ta'mirdan keyin tozalash. 10 yillik tajriba. Chiqish bepul. Ishlar tarkibi va narxlarni ko'ring, hisob-kitob buyurtma qiling.",
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

export function buildSocialMetadata(
  title: string,
  description: string,
  url: string,
  locale: Locale
): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      siteName: "BIOUBORKA.UZ",
      locale: seoByLocale[locale].ogLocale,
      title,
      description,
      url,
      images: [{ url: siteSocialImage, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [siteSocialImage],
    },
  };
}

export function buildHomeMetadata(locale: Locale): Metadata {
  const seo = seoByLocale[locale];
  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: {
      canonical: seo.url,
      languages: {
        ru: seoByLocale.ru.url,
        "uz-Cyrl": seoByLocale.uzKrill.url,
        "uz-Latn": seoByLocale.uzLatin.url,
        "x-default": siteUrl,
      },
    },
    ...buildSocialMetadata(seo.title, seo.description, seo.url, locale),
  };
}
