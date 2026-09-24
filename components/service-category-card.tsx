"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import {
  getServicePageBySlug,
  getServiceCategoryById,
} from "@/lib/i18n/content";
import { serviceCategoryPath } from "@/lib/i18n/service-pages";
import {
  SERVICE_CATEGORY_ICONS,
  Sparkles,
} from "@/components/service-category-icon";

export function ServiceCategoryCard({ slug }: { slug: string }) {
  const { t, locale } = useLanguage();
  const page = getServicePageBySlug(slug);
  const category = page ? getServiceCategoryById(page.categoryId) : undefined;
  if (!page || !category) {
    return null;
  }
  const Icon = SERVICE_CATEGORY_ICONS[category.icon] ?? Sparkles;

  return (
    <Link
      href={serviceCategoryPath(slug, locale)}
      className="card-hover group flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div>
        <h3 className="font-semibold leading-snug">{t(category.titleKey)}</h3>
        <p className="mt-1 text-sm font-medium text-primary">
          {t(category.noteKey)}
        </p>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {category.services.slice(0, 3).map((service) => (
          <li
            key={service.id}
            className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
          >
            {t(service.titleKey)}
          </li>
        ))}
        {category.services.length > 3 && (
          <li className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            +{category.services.length - 3}
          </li>
        )}
      </ul>
    </Link>
  );
}
