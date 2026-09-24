"use client";

import { useState } from "react";
import { Sparkles, Zap, Phone } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { useSiteContent } from "@/lib/site-content-provider";
import { SERVICE_PAGES } from "@/lib/i18n/content";
import { ServicesBreadcrumbs } from "@/components/services-breadcrumbs";
import { ServiceCategoryCard } from "@/components/service-category-card";
import { QuickOrderModal } from "@/components/quick-order-modal";

export function ServicesHubContent() {
  const { t } = useLanguage();
  const { contacts } = useSiteContent();
  const [quickOpen, setQuickOpen] = useState(false);
  const telHref = `tel:+${contacts.phone.replace(/[^\d]/g, "")}`;

  return (
    <>
      <ServicesBreadcrumbs />
      <section className="container mx-auto px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="max-w-3xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              BIOUBORKA.UZ
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("uslugi.h1")}
            </h1>
            <p className="leading-relaxed text-muted-foreground">
              {t("uslugi.subheading")}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_PAGES.map((page, i) => (
              <div
                key={page.slug}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <ServiceCategoryCard slug={page.slug} />
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-4 rounded-xl border bg-primary/[0.04] p-6 sm:flex-row sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-semibold">{t("uslugi.quickCta")}</h2>
              <a
                href={telHref}
                className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                {contacts.phone}
              </a>
            </div>
            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
            >
              <Zap className="h-4 w-4" />
              {t("quick.title")}
            </button>
          </div>
        </div>
      </section>
      <QuickOrderModal open={quickOpen} onOpenChange={setQuickOpen} />
    </>
  );
}
