"use client";

import { useState } from "react";
import Image from "next/image";
import { Info, Zap, Phone, HelpCircle, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { useSiteContent } from "@/lib/site-content-provider";
import {
  SERVICE_PAGES,
  getServicePageBySlug,
  getServiceCategoryById,
} from "@/lib/i18n/content";
import { OrderFormModal } from "@/components/order-form-modal";
import { QuickOrderModal } from "@/components/quick-order-modal";
import { ServicesBreadcrumbs } from "@/components/services-breadcrumbs";
import { ServiceCategoryCard } from "@/components/service-category-card";
import {
  SERVICE_CATEGORY_ICONS,
  Sparkles,
} from "@/components/service-category-icon";

export function ServicesCategoryContent({ slug }: { slug: string }) {
  const { t } = useLanguage();
  const { procedurePhotos, contacts } = useSiteContent();
  const [orderOpen, setOrderOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | undefined>(
    undefined
  );
  const [quickOpen, setQuickOpen] = useState(false);

  const page = getServicePageBySlug(slug);
  const category = page ? getServiceCategoryById(page.categoryId) : undefined;

  if (!page || !category) {
    return null;
  }

  const Icon = SERVICE_CATEGORY_ICONS[category.icon] ?? Sparkles;
  const telHref = `tel:+${contacts.phone.replace(/[^\d]/g, "")}`;
  const otherCategories = SERVICE_PAGES.filter((p) => p.slug !== slug);

  const handleOrderClick = (serviceId: string) => {
    setSelectedService(serviceId);
    setOrderOpen(true);
  };

  return (
    <>
      <ServicesBreadcrumbs categoryName={t(category.titleKey)} />

      <section className="container mx-auto px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="max-w-3xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
              <Icon className="h-4 w-4" />
              {t(category.noteKey)}
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t(page.h1Key)}
            </h1>
            <p className="leading-relaxed text-muted-foreground">
              {t(page.introKey)}
            </p>
          </div>

          <section
            aria-labelledby="services-heading"
            className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <h2
              id="services-heading"
              className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("uslugi.servicesHeading")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.services.map((service, i) => (
                <article
                  key={service.id}
                  className="card-hover flex flex-col gap-3 rounded-xl border bg-card p-5 animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <h3 className="flex-1 font-medium leading-snug">
                    {t(service.titleKey)}
                  </h3>
                  <div className="text-base font-bold text-primary">
                    {t(service.priceKey)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOrderClick(service.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
                  >
                    {t("services.orderButton")}
                  </button>
                </article>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/40 px-4 py-4 text-center">
              <Info className="h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                {t("services.minOrder")}
              </p>
            </div>
          </section>

          <section
            aria-labelledby="procedure-heading"
            className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <h2
              id="procedure-heading"
              className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("services.procedureHeading")}
            </h2>
            <div className="grid overflow-hidden rounded-xl border bg-muted/40 sm:grid-cols-[1fr_auto]">
              <div className="flex flex-col justify-center gap-3 p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {t(category.titleKey)}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(category.procedureKey)}
                </p>
              </div>
              <div className="relative h-48 w-full sm:h-auto sm:w-60 lg:w-64">
                <Image
                  src={procedurePhotos[category.id] ?? category.photo}
                  alt={t(category.titleKey)}
                  fill
                  sizes="(max-width: 640px) 100vw, 240px"
                  className="object-cover"
                />
              </div>
            </div>
          </section>

          <section
            aria-labelledby="faq-heading"
            className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <h2
                id="faq-heading"
                className="text-2xl font-bold tracking-tight sm:text-3xl"
              >
                {t("uslugi.faqHeading")}
              </h2>
            </div>
            <div className="space-y-3">
              {page.faq.map((item) => (
                <details
                  key={item.qKey}
                  className="group rounded-xl border bg-card px-5 py-4 open:border-primary/40"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-sm sm:text-base">
                    {t(item.qKey)}
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t(item.aKey)}
                  </p>
                </details>
              ))}
            </div>
          </section>

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

          <section
            aria-labelledby="other-heading"
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <h2
              id="other-heading"
              className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("uslugi.otherHeading")}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {otherCategories.map((p) => (
                <ServiceCategoryCard key={p.slug} slug={p.slug} />
              ))}
            </div>
          </section>
        </div>
      </section>

      {orderOpen && (
        <OrderFormModal
          open={orderOpen}
          onOpenChange={setOrderOpen}
          preselectedService={selectedService}
        />
      )}
      <QuickOrderModal open={quickOpen} onOpenChange={setQuickOpen} />
    </>
  );
}
