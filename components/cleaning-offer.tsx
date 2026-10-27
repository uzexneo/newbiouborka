"use client";

import { Clock, MapPin, Tag, Users } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";

const offers = [
  { icon: Users, key: "hero.experience" },
  { icon: MapPin, key: "hero.freeVisit" },
  { icon: Clock, key: "hero.arrival" },
  { icon: Tag, key: "cleaning.firstOrderDiscount" },
] as const;

export function CleaningOffer() {
  const { t } = useLanguage();
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {offers.map(({ icon: Icon, key }) => (
        <li
          key={key}
          className="flex items-start gap-3 rounded-xl border bg-primary/5 p-4 text-sm font-medium leading-relaxed"
        >
          <Icon
            className="mt-0.5 h-5 w-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <span>{t(key)}</span>
        </li>
      ))}
    </ul>
  );
}
