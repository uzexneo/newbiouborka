import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { BridgeProvider } from "@/components/bridge-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { HeaderNav } from "@/components/header-nav";
import { LanguageProvider } from "@/lib/i18n/language-provider";
import { SiteContentProvider } from "@/lib/site-content-provider";
import { SeoMetaUpdater } from "@/components/seo-meta-updater";
import { VisitTracker } from "@/components/visit-tracker";
import { SiteFooter } from "@/components/site-footer";
import { SiteLogo } from "@/components/site-logo";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const appName = "BIOUBORKA.UZ";
const appDescription =
  "Экологичная уборка квартир и домов в Ташкенте. Безопасные средства, гипоаллергенно, забота о вашем здоровье.";
const appUrl = "https://biouborka.uz";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${appName} — Профессиональная биоуборка в Ташкенте`,
    template: `%s | ${appName}`,
  },
  description: appDescription,
  keywords: [
    "биоуборка",
    "экологичная уборка",
    "уборка квартир Ташкент",
    "клининг Ташкент",
    "химчистка мебели Ташкент",
    "уборка после ремонта",
    "безопасная уборка",
    "гипоаллергенная уборка",
    "BIOUBORKA",
    "biouborka.uz",
  ],
  openGraph: {
    type: "website",
    locale: "ru_UZ",
    siteName: appName,
    title: `${appName} — Профессиональная биоуборка в Ташкенте`,
    description: appDescription,
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${appName} — Профессиональная биоуборка в Ташкенте`,
    description: appDescription,
  },
  alternates: {
    canonical: appUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={cn("font-sans", geist.variable)}>
      <body className="antialiased min-h-screen bg-background flex flex-col">
        <BridgeProvider />
        <VisitTracker />
        <LanguageProvider>
          <SeoMetaUpdater />
          <SiteContentProvider>
            <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
              <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
                <Link href="/" className="flex items-center">
                  <SiteLogo showName={appName} />
                </Link>
                <div className="flex items-center gap-4">
                  <HeaderNav />
                  <LanguageSwitcher />
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <Toaster richColors position="top-right" />
          </SiteContentProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
