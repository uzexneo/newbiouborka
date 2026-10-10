"use client";

import { Phone } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { useSiteContent } from "@/lib/site-content-provider";

export function FloatingCallButton() {
  const { t } = useLanguage();
  const { contacts } = useSiteContent();
  const telHref = `tel:+${contacts.phone.replace(/\D/g, "")}`;

  return (
    <a
      href={telHref}
      aria-label={`${t("call.title")}: ${contacts.phone}`}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
    >
      <Phone className="h-5 w-5" />
      <span className="hidden sm:inline">{contacts.phone}</span>
      <span className="sm:hidden">{t("call.title")}</span>
    </a>
  );
}
