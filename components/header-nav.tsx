"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/translations";

const navItems: { href: string; key: TranslationKey }[] = [
  { href: "/", key: "nav.home" },
  { href: "#services", key: "nav.services" },
  { href: "#portfolio", key: "nav.portfolio" },
  { href: "#about", key: "nav.about" },
  { href: "#contacts", key: "nav.contacts" },
];

export function HeaderNav() {
  const { t } = useLanguage();

  return (
    <nav className="hidden sm:flex items-center gap-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
