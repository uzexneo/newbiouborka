"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/language-provider";
import { localeToPath } from "@/lib/i18n/config";
import type { TranslationKey } from "@/lib/i18n/translations";

interface NavItem {
  href: string;
  key: TranslationKey;
  localized?: boolean;
}

const navItems: NavItem[] = [
  { href: "/", key: "nav.home" },
  { href: "/uslugi", key: "nav.services", localized: true },
  { href: "#portfolio", key: "nav.portfolio" },
  { href: "#about", key: "nav.about" },
  { href: "#contacts", key: "nav.contacts" },
];

export function HeaderNav() {
  const { t, locale } = useLanguage();
  const base = localeToPath[locale] === "/" ? "" : localeToPath[locale];

  return (
    <nav className="hidden sm:flex items-center gap-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.localized ? `${base}${item.href}` : item.href}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
