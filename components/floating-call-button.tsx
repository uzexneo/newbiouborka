"use client";

import { Phone } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";

const CALL_PHONE_DISPLAY = "+998 93 375 27 02";
const CALL_TEL_HREF = "tel:+998933752702";

export function FloatingCallButton() {
  const { t } = useLanguage();

  return (
    <a
      href={CALL_TEL_HREF}
      aria-label={`${t("call.title")}: ${CALL_PHONE_DISPLAY}`}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
    >
      <Phone className="h-5 w-5" />
      <span className="hidden sm:inline">{CALL_PHONE_DISPLAY}</span>
      <span className="sm:hidden">{t("call.title")}</span>
    </a>
  );
}
