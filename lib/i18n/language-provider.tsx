"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useTransition,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  defaultLocale,
  canLocalizePathname,
  languages,
  localeFromPath,
  localizeHref,
  type Locale,
} from "./config";
import { dictionaries, type TranslationKey } from "./translations";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isChangingLocale: boolean;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isChangingLocale, startTransition] = useTransition();
  // The URL determines both server-rendered content and client navigation,
  // including browser Back/Forward. Saved choices must not override RU URLs.
  const locale = localeFromPath(pathname) ?? defaultLocale;

  const setLocale = useCallback(
    (next: Locale) => {
      const currentPath = window.location.pathname;
      if (!canLocalizePathname(currentPath)) {
        return;
      }
      const target = localizeHref(
        currentPath,
        next,
        window.location.search,
        window.location.hash
      );
      const currentHref =
        currentPath + window.location.search + window.location.hash;
      if (target !== currentHref) {
        startTransition(() => router.push(target, { scroll: false }));
      }
    },
    [router]
  );

  useEffect(() => {
    const htmlLang =
      languages.find((lang) => lang.code === locale)?.htmlLang ?? "ru";
    document.documentElement.lang = htmlLang;
  }, [locale]);

  const t = useCallback(
    (key: TranslationKey) => dictionaries[locale][key],
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, isChangingLocale, t }),
    [locale, setLocale, isChangingLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
