"use client";

import Link from "next/link";
import { localeToPath } from "@/lib/i18n/config";
import { useLanguage } from "@/lib/i18n/language-provider";

export function LocalizedHomeLink({ children }: { children: React.ReactNode }) {
  const { locale } = useLanguage();
  return (
    <Link href={localeToPath[locale]} className="flex items-center">
      {children}
    </Link>
  );
}
