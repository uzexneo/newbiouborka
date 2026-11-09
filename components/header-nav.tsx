"use client";

import Link from "next/link";
import { useRef } from "react";
import { Menu } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { localizePathname, localeToPath } from "@/lib/i18n/config";
import type { TranslationKey } from "@/lib/i18n/translations";

interface NavItem {
  href: string;
  key: TranslationKey;
}

const navItems: NavItem[] = [
  { href: "/", key: "nav.home" },
  { href: "/uslugi", key: "nav.services" },
  { href: "#portfolio", key: "nav.portfolio" },
  { href: "#about", key: "nav.about" },
  { href: "#contacts", key: "nav.contacts" },
];

export function HeaderNav() {
  const { t, locale } = useLanguage();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const menuLabel = locale === "uzLatin" ? "Menyu" : "Меню";
  const hrefFor = (href: string) =>
    href.startsWith("#")
      ? `${localeToPath[locale]}${href}`
      : localizePathname(href, locale);

  return (
    <>
      <nav
        aria-label={t("nav.services")}
        className="hidden sm:flex items-center gap-6"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={hrefFor(item.href)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t(item.key)}
          </Link>
        ))}
      </nav>
      <details
        ref={menuRef}
        className="relative sm:hidden"
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuRef.current) {
            menuRef.current.open = false;
            menuRef.current.querySelector("summary")?.focus();
          }
        }}
      >
        <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-lg border bg-background [&::-webkit-details-marker]:hidden">
          <Menu className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">{menuLabel}</span>
        </summary>
        <nav
          aria-label={menuLabel}
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border bg-background p-2 shadow-lg"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={hrefFor(item.href)}
              onClick={() => {
                if (menuRef.current) menuRef.current.open = false;
              }}
              className="block rounded-lg px-4 py-3 text-sm hover:bg-muted focus-visible:bg-muted"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
      </details>
    </>
  );
}
