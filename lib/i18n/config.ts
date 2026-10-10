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
  { code: "uzKrill", label: "ЎЗ", nativeName: "Ўзбекча", htmlLang: "uz-Cyrl" },
  {
    code: "uzLatin",
    label: "UZ",
    nativeName: "O'zbekcha",
    htmlLang: "uz-Latn",
  },
];

export const defaultLocale: Locale = "ru";

export const localeToPath: Record<Locale, string> = {
  ru: "/",
  uzKrill: "/uz-krill",
  uzLatin: "/uz-latin",
};

export function localizePathname(pathname: string, locale: Locale): string {
  let rest = pathname;
  for (const prefix of ["/uz-krill", "/uz-latin"]) {
    if (rest === prefix || rest.startsWith(`${prefix}/`)) {
      rest = rest.slice(prefix.length);
      break;
    }
  }
  if (!rest) {
    rest = "/";
  }
  const target = localeToPath[locale];
  if (target === "/") {
    return rest;
  }
  return rest === "/" ? target : `${target}${rest}`;
}

export function canLocalizePathname(pathname: string): boolean {
  const path =
    localizePathname(pathname, defaultLocale).replace(/\/$/, "") || "/";
  return path === "/" || path === "/uslugi" || path.startsWith("/uslugi/");
}

export function localizeHref(
  pathname: string,
  locale: Locale,
  search = "",
  hash = ""
): string {
  const params = new URLSearchParams(search);
  // Legacy language query parameters must not redirect a new language choice.
  params.delete("lang");
  const query = params.toString();
  return `${localizePathname(pathname, locale)}${query ? `?${query}` : ""}${hash}`;
}

export function localeFromPath(pathname: string | null): Locale | null {
  if (!pathname) {
    return null;
  }
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/uz-krill" || path.startsWith("/uz-krill/")) {
    return "uzKrill";
  }
  if (path === "/uz-latin" || path.startsWith("/uz-latin/")) {
    return "uzLatin";
  }
  return defaultLocale;
}

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (locales as readonly string[]).includes(value)
  );
}
