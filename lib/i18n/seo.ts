import type { Locale } from "./config";

export interface SeoMeta {
  htmlLang: string;
  ogLocale: string;
  title: string;
  description: string;
}

export const seoByLocale: Record<Locale, SeoMeta> = {
  ru: {
    htmlLang: "ru",
    ogLocale: "ru_RU",
    title: "BIOUBORKA.UZ — Профессиональная биоуборка в Ташкенте",
    description:
      "Экологичная уборка квартир и домов в Ташкенте. Безопасные средства, гипоаллергенно, забота о вашем здоровье.",
  },
  uzKrill: {
    htmlLang: "uz",
    ogLocale: "uz_Cyrl",
    title: "BIOUBORKA.UZ — Тошкентда профессионал био тозалаш",
    description:
      "Тошкентда квартира ва уйларни экологик тозалаш. Хавфсиз воситалар, гипоаллерген, соғлиғингизга ғамхўрлик.",
  },
  uzLatin: {
    htmlLang: "uz-latn",
    ogLocale: "uz_Latn",
    title: "BIOUBORKA.UZ — Toshkentda professional bio tozalash",
    description:
      "Toshkentda kvartira va uylarni ekologik tozalash. Xavfsiz vositalar, gipoallergen, sog'lig'ingizga g'amxo'rlik.",
  },
};
