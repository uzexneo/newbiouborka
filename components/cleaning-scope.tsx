"use client";

import { Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";

const scopes = [
  {
    title: "cleaning.general.title",
    items: [
      "cleaning.general.surfaces",
      "cleaning.general.lights",
      "cleaning.general.high",
      "cleaning.general.deposits",
    ],
  },
  {
    title: "cleaning.wet.title",
    items: ["cleaning.wet.dust", "cleaning.wet.touch", "cleaning.wet.glass"],
  },
] as const;

export function CleaningScope() {
  const { t } = useLanguage();
  return (
    <section aria-labelledby="cleaning-scope-heading" className="space-y-6">
      <h2
        id="cleaning-scope-heading"
        className="text-2xl font-bold tracking-tight sm:text-3xl"
      >
        {t("cleaning.scopeHeading")}
      </h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {scopes.map(({ title, items }) => (
          <article key={title} className="rounded-xl border bg-card p-5 sm:p-6">
            <h3 className="mb-4 text-lg font-semibold">{t(title)}</h3>
            <ul className="space-y-3">
              {items.map((key) => (
                <li
                  key={key}
                  className="flex items-start gap-2 text-sm leading-relaxed"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
