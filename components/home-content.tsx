"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Leaf,
  ArrowRight,
  Star,
  Quote,
  Tag,
  Clock,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/translations";
import { VALUES, BENEFITS, TESTIMONIALS } from "@/lib/i18n/content";
import { useSiteContent } from "@/lib/site-content-provider";
import { ServiceCardsSection } from "@/components/service-cards-section";
import { PortfolioGallery } from "@/components/portfolio-gallery";
import { ContactsSection } from "@/components/contacts-section";
import { FaqSection } from "@/components/faq-section";
import { QuickOrderModal } from "@/components/quick-order-modal";

interface TrustCardMeta {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}

const TRUST_CARDS: TrustCardMeta[] = [
  { icon: Tag, titleKey: "trust.priceTitle", descKey: "trust.priceDesc" },
  {
    icon: Clock,
    titleKey: "trust.deadlineTitle",
    descKey: "trust.deadlineDesc",
  },
  {
    icon: ShieldCheck,
    titleKey: "trust.guaranteeTitle",
    descKey: "trust.guaranteeDesc",
  },
  { icon: Users, titleKey: "trust.teamTitle", descKey: "trust.teamDesc" },
];

export function HomeContent() {
  const { t } = useLanguage();
  const { gallery, background } = useSiteContent();
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${background}")` }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-black/60" />
        <div className="relative container mx-auto px-4 py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <Leaf className="h-8 w-8 text-green-300" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {t("hero.title1")}
                <br />
                <span className="text-green-300">{t("hero.title2")}</span>
              </h1>
              <p className="text-lg text-white/85 max-w-lg mx-auto">
                {t("hero.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setQuickOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
              >
                <Zap className="h-4 w-4" />
                {t("quick.title")}
              </button>
              <Link
                href="#services"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/20"
              >
                {t("hero.ctaServices")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#contacts"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-medium transition-all hover:bg-muted"
              >
                {t("hero.ctaContact")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("benefits.heading")}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t("benefits.subheading")}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {BENEFITS.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <article
                  key={benefit.titleKey}
                  className="card-hover rounded-xl border bg-card p-6 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{t(benefit.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(benefit.descKey)}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t bg-primary/[0.04]">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center space-y-3 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t("trust.heading")}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t("trust.subheading")}
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {TRUST_CARDS.map((card, i) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.titleKey}
                    className="card-hover rounded-xl border bg-card p-6 text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold">{t(card.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(card.descKey)}
                    </p>
                  </article>
                );
              })}
            </div>
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setQuickOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
              >
                <Zap className="h-5 w-5" />
                {t("quick.title")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <ServiceCardsSection />

      <section id="about" className="container mx-auto px-4 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t("about.heading")}
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>{t("about.p1")}</p>
                <p>{t("about.p2")}</p>
                <p>{t("about.p3")}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {VALUES.map((value, i) => {
                const Icon = value.icon;
                return (
                  <article
                    key={value.titleKey}
                    className="card-hover rounded-xl border bg-card p-5 space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm">
                      {t(value.titleKey)}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t(value.descKey)}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16 sm:py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center space-y-3 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t("testimonials.heading")}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t("testimonials.subheading")}
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TESTIMONIALS.map((review, i) => (
                <article
                  key={review.nameKey}
                  className="card-hover rounded-xl border bg-card p-6 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div
                    className="flex gap-0.5 mb-3"
                    aria-label={`${review.rating} / 5`}
                  >
                    {Array.from({ length: 5 }, (_, j) => (
                      <Star
                        key={j}
                        className={`h-4 w-4 ${
                          j < review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-muted text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="relative flex-1">
                    <Quote className="h-6 w-6 text-primary/20 absolute -top-1 -left-1" />
                    <p className="text-sm text-muted-foreground leading-relaxed pl-4 relative z-10">
                      {t(review.textKey)}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                        {t(review.nameKey).charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {t(review.nameKey)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(review.locationKey)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="portfolio" className="container mx-auto px-4 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("portfolio.heading")}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t("portfolio.subheading")}
            </p>
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PortfolioGallery items={gallery} />
          </div>
        </div>
      </section>

      <FaqSection />

      <ContactsSection />

      <QuickOrderModal open={quickOpen} onOpenChange={setQuickOpen} />
    </>
  );
}
