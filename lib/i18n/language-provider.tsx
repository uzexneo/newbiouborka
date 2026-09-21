"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  defaultLocale,
  isLocale,
  languages,
  localeFromPath,
  localeToPath,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "./config";
import { dictionaries, type TranslationKey } from "./translations";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

const emptySubscribe = () => () => {};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [storedLocale, setStoredLocale] = useState<Locale | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (!isLocale(stored)) {
      return;
    }
    const id = requestAnimationFrame(() => setStoredLocale(stored));
    return () => cancelAnimationFrame(id);
  }, []);

  // The language is taken from the URL first (priority), and only falls back
  // to the previously saved choice. getServerSnapshot keeps SSR output stable
  // (default locale) so hydration never mismatches, while the client snapshot
  // is applied synchronously right after hydration without a visible flash.
  const locale = useSyncExternalStore(
    emptySubscribe,
    () => localeFromPath(pathname) ?? storedLocale ?? defaultLocale,
    () => defaultLocale
  );

  useEffect(() => {
    const fromPath = localeFromPath(pathname);
    if (fromPath) {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, fromPath);
      } catch {
        // localStorage may be unavailable (e.g. private mode); ignore.
      }
    }
  }, [pathname]);

  const setLocale = useCallback(
    (next: Locale) => {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, next);
      } catch {
        // localStorage may be unavailable (e.g. private mode); ignore.
      }
      setStoredLocale(next);
      const target = localeToPath[next];
      const currentPath = window.location.pathname;
      const hash = window.location.hash;
      if (target !== currentPath) {
        router.push(target + hash);
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
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
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
