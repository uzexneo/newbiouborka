export const locales = ["ru", "uzKrill", "uzLatin"] as const;
export type Locale = (typeof locales)[number];

export interface Language {
  code: Locale;
  label: string;
  nativeName: string;
  htmlLang: string;
}

export const languages: Language[] = [
  { code: "ru", label: "RU", nativeName: "Русский", htmlLang: "ru" },
  { code: "uzKrill", label: "ЎЗ", nativeName: "Ўзбекча", htmlLang: "uz" },
  {
    code: "uzLatin",
    label: "UZ",
    nativeName: "O'zbekcha",
    htmlLang: "uz-latn",
  },
];

export const defaultLocale: Locale = "ru";
export const LOCALE_STORAGE_KEY = "biouborka.locale";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (locales as readonly string[]).includes(value)
  );
}
