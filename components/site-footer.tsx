"use client";

import Link from "next/link";
import { Leaf, Phone, Mail, Camera, Send, MapPin } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { localeToPath, localizePathname } from "@/lib/i18n/config";
import {
  CLEANING_SERVICE_SLUGS,
  getCleaningServicePage,
  cleaningServicePath,
} from "@/lib/cleaning-service-pages";
import { useSiteContent } from "@/lib/site-content-provider";
import { trackPhoneClick } from "@/lib/analytics";

export function SiteFooter() {
  const { t, locale } = useLanguage();
  const { contacts } = useSiteContent();
  const appName = "BIOUBORKA.UZ";
  const telHref = `tel:+${contacts.phone.replace(/[^\d]/g, "")}`;
  const homeHref = localeToPath[locale];

  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-8 grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Link
            href={homeHref}
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <Leaf className="h-4 w-4 text-primary" />
            {appName}
          </Link>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("footer.tagline")}
            <br />
            {t("footer.subtagline")}
          </p>
          <nav
            aria-label={t("nav.services")}
            className="flex flex-col items-start gap-2 pt-3 text-sm"
          >
            <Link
              href={localizePathname("/uslugi", locale)}
              className="text-muted-foreground hover:text-primary hover:underline"
            >
              {t("nav.services")}
            </Link>
            {CLEANING_SERVICE_SLUGS.map((slug) => (
              <Link
                key={slug}
                href={cleaningServicePath(slug, locale)}
                className="text-muted-foreground hover:text-primary hover:underline"
              >
                {getCleaningServicePage(slug, locale)?.heading}
              </Link>
            ))}
          </nav>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t("footer.contacts")}</h3>
          <div className="space-y-1.5">
            <a
              href={telHref}
              onClick={() => trackPhoneClick({ location: "footer" })}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              {contacts.phone}
            </a>
            <a
              href={`mailto:${contacts.email}`}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              {contacts.email}
            </a>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {contacts.address}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t("footer.social")}</h3>
          <div className="flex gap-3">
            <a
              href={contacts.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Camera className="h-3.5 w-3.5" />
              Instagram
            </a>
            <a
              href={contacts.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              Telegram
            </a>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {appName}. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
