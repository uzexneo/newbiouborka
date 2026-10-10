"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { defaultLocale, languages, localeFromPath } from "@/lib/i18n/config";

export function LocaleDocument({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const locale = localeFromPath(usePathname()) ?? defaultLocale;
  const htmlLang =
    languages.find((language) => language.code === locale)?.htmlLang ?? "ru";

  return (
    <html lang={htmlLang} className={className}>
      {children}
    </html>
  );
}
