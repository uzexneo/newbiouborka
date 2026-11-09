"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Tag,
  Users,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { localizePathname, localeToPath } from "@/lib/i18n/config";
import { useSiteContent } from "@/lib/site-content-provider";
import {
  CLEANING_SERVICE_SLUGS,
  cleaningServicePath,
  formatCleaningServiceText,
  getCleaningPageLabels,
  getCleaningServicePage,
  type CleaningServiceSlug,
} from "@/lib/cleaning-service-pages";
import { trackPhoneClick } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

const QuickOrderModal = dynamic(() =>
  import("@/components/quick-order-modal").then(
    (module) => module.QuickOrderModal
  )
);
const OrderFormModal = dynamic(() =>
  import("@/components/order-form-modal").then(
    (module) => module.OrderFormModal
  )
);

export function CleaningServiceContent({
  slug,
}: {
  slug: CleaningServiceSlug;
}) {
  const { locale } = useLanguage();
  const { services, contacts } = useSiteContent();
  const [quickOpen, setQuickOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const page = getCleaningServicePage(slug, locale);
  const labels = getCleaningPageLabels(locale);
  const service = services
    .flatMap((category) => category.services)
    .find((item) => item.id === page.serviceId);
  const price = service?.price || labels.askPrice;
  const telHref = `tel:+${contacts.phone.replace(/\D/g, "")}`;
  const offers = [
    { icon: Users, text: labels.experience },
    { icon: MapPin, text: labels.freeVisit },
    { icon: Clock, text: labels.arrival },
  ];
  const onPhoneClick = () =>
    trackPhoneClick({ location: "service_category", service: page.serviceId });
  const breadcrumbs = [
    { label: labels.home, href: localeToPath[locale] },
    { label: labels.services, href: localizePathname("/uslugi", locale) },
    {
      label: labels.cleaning,
      href: localizePathname("/uslugi/uborka", locale),
    },
  ];

  return (
    <>
      <nav
        aria-label={labels.breadcrumb}
        className="container mx-auto px-4 pt-6 sm:pt-8"
      >
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {breadcrumbs.map((item) => (
            <li key={item.href} className="flex items-center gap-1.5">
              <Link
                href={item.href}
                className="hover:text-foreground hover:underline"
              >
                {item.label}
              </Link>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </li>
          ))}
          <li aria-current="page" className="font-medium text-foreground">
            {page.shortName}
          </li>
        </ol>
      </nav>

      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-5xl space-y-10 sm:space-y-12">
          <section
            aria-labelledby="cleaning-service-heading"
            className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start"
          >
            <div className="space-y-4">
              <h1
                id="cleaning-service-heading"
                className="text-3xl font-bold tracking-tight sm:text-4xl"
              >
                {page.heading}
              </h1>
              <p className="leading-relaxed text-muted-foreground">
                {page.summary}
              </p>
              <ul className="space-y-3 text-sm">
                {offers.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-2.5">
                    <Icon
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border bg-primary/[0.04] p-5 sm:p-6">
              <p className="text-sm font-medium text-muted-foreground">
                {labels.price}
              </p>
              <p className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
                {price}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {page.priceNote}
              </p>
              {page.discount && (
                <p className="mt-4 flex items-start gap-2 text-sm font-medium">
                  <Tag
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {page.discount}
                </p>
              )}
              <div className="mt-5 flex flex-col gap-3">
                {service && (
                  <Button
                    onClick={() => setQuickOpen(true)}
                    className="h-auto min-h-11 whitespace-normal px-5 py-3"
                  >
                    {labels.quickOrder}
                  </Button>
                )}
                <a
                  href={telHref}
                  onClick={onPhoneClick}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-primary/20 bg-background px-4 py-2 font-medium text-primary hover:bg-primary/5"
                  aria-label={`${labels.call}: ${contacts.phone}`}
                >
                  <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {contacts.phone}
                </a>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="cleaning-scope-heading"
            className="rounded-2xl border bg-card p-5 sm:p-8"
          >
            <h2
              id="cleaning-scope-heading"
              className="text-2xl font-bold tracking-tight"
            >
              {page.scopeHeading}
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {page.scope.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-relaxed sm:text-base"
                >
                  <Check
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 border-t pt-6">
              <h3 className="font-semibold">{labels.preparationHeading}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {page.preparation}
              </p>
              {service && (
                <Button
                  variant="outline"
                  onClick={() => setOrderOpen(true)}
                  className="mt-4 h-auto min-h-11 whitespace-normal py-2"
                >
                  {labels.detailedOrder}
                </Button>
              )}
            </div>
          </section>

          <section aria-labelledby="cleaning-process-heading">
            <h2
              id="cleaning-process-heading"
              className="text-2xl font-bold tracking-tight"
            >
              {labels.processHeading}
            </h2>
            <ol className="mt-6 grid gap-4 sm:grid-cols-3">
              {labels.process.map((item, index) => (
                <li key={item.title} className="rounded-xl border bg-card p-5">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <h3 className="mt-3 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.text}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="cleaning-faq-heading">
            <h2
              id="cleaning-faq-heading"
              className="text-2xl font-bold tracking-tight"
            >
              {labels.faqHeading}
            </h2>
            <div className="mt-6 space-y-3">
              {page.faq.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-xl border bg-card px-5 py-4 open:border-primary/40"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium sm:text-base">
                    {item.question}
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {formatCleaningServiceText(item.answer, price)}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="cleaning-contact-heading"
            className="rounded-2xl border bg-primary/[0.04] p-5 sm:p-8"
          >
            <h2
              id="cleaning-contact-heading"
              className="text-2xl font-bold tracking-tight"
            >
              {labels.contactHeading}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {labels.contactText}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {service && (
                <Button
                  onClick={() => setQuickOpen(true)}
                  className="h-auto min-h-11 whitespace-normal px-6 py-3"
                >
                  {labels.quickOrder}
                </Button>
              )}
              <a
                href={telHref}
                onClick={onPhoneClick}
                className="inline-flex min-h-11 items-center justify-center gap-2 px-3 font-medium text-primary hover:underline"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {contacts.phone}
              </a>
            </div>
          </section>

          <section aria-labelledby="cleaning-related-heading">
            <h2
              id="cleaning-related-heading"
              className="text-xl font-bold tracking-tight"
            >
              {labels.relatedHeading}
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6">
              {CLEANING_SERVICE_SLUGS.filter((item) => item !== slug).map(
                (item) => (
                  <li key={item}>
                    <Link
                      href={cleaningServicePath(item, locale)}
                      className="font-medium text-primary underline underline-offset-4"
                    >
                      {getCleaningServicePage(item, locale).shortName}
                    </Link>
                  </li>
                )
              )}
              <li>
                <Link
                  href={localizePathname("/uslugi/uborka", locale)}
                  className="font-medium text-primary underline underline-offset-4"
                >
                  {labels.allCleaning}
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>

      {service && quickOpen && (
        <QuickOrderModal
          open={quickOpen}
          onOpenChange={setQuickOpen}
          preselectedService={page.serviceId}
        />
      )}
      {service && orderOpen && (
        <OrderFormModal
          open={orderOpen}
          onOpenChange={setOrderOpen}
          preselectedService={page.serviceId}
        />
      )}
    </>
  );
}
