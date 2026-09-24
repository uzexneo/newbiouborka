"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { localeToPath } from "@/lib/i18n/config";
import { servicesHubPath } from "@/lib/i18n/service-pages";

export function ServicesBreadcrumbs({
  categoryName,
}: {
  categoryName?: string;
}) {
  const { t, locale } = useLanguage();
  const home = localeToPath[locale];
  const hub = servicesHubPath(locale);

  return (
    <nav
      aria-label="breadcrumb"
      className="container mx-auto px-4 pt-6 sm:pt-8"
    >
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link href={home} className="transition-colors hover:text-foreground">
            {t("nav.home")}
          </Link>
        </li>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        <li>
          <Link href={hub} className="transition-colors hover:text-foreground">
            {t("nav.services")}
          </Link>
        </li>
        {categoryName && (
          <>
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            <li aria-current="page" className="font-medium text-foreground">
              {categoryName}
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
