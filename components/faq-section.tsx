"use client";

import { HelpCircle, ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { FAQ_ITEMS } from "@/lib/i18n/content";

export function FaqSection() {
  const { t } = useLanguage();

  return (
    <section id="faq" className="container mx-auto px-4 py-16 sm:py-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center space-y-3 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("faq.heading")}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t("faq.subheading")}
          </p>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.questionKey}
              className="group rounded-xl border bg-card px-5 py-4 open:border-primary/40 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-sm sm:text-base">
                {t(item.questionKey)}
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {t(item.answerKey)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
