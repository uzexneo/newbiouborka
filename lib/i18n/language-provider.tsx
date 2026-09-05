"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  defaultLocale,
  isLocale,
  languages,
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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (!isLocale(stored)) {
      return;
    }
    const id = requestAnimationFrame(() => setLocaleState(stored));
    return () => cancelAnimationFrame(id);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // localStorage may be unavailable (e.g. private mode); ignore.
    }
  }, []);

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
