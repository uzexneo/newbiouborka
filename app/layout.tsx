import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
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
import { FloatingCallButton } from "@/components/floating-call-button";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const GA_ID = "G-7E7Y9R3R19";
const GA_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;

const appName = "BIOUBORKA.UZ";
const appTitle = "Уборка квартир в Ташкенте от 25 000 сум | Биоуборка";
const appDescription =
  "Клининг в Ташкенте: биоуборка квартир от 25 000 сум, химчистка мебели от 70 000 сум. Только безопасные средства, выезд по всему городу. +998 93 375 27 02.";
const appUrl = "https://biouborka.uz";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  applicationName: appName,
  title: {
    default: appTitle,
    template: `%s | ${appName}`,
  },
  description: appDescription,
  robots: { index: true, follow: true },
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
    title: appTitle,
    description: appDescription,
    url: appUrl,
    images: [
      {
        url: `${appUrl}/assets/hero-cleaning.png`,
        alt: appDescription,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: appTitle,
    description: appDescription,
    images: [`${appUrl}/assets/hero-cleaning.png`],
  },
  alternates: {
    canonical: appUrl,
    languages: {
      ru: appUrl,
      "uz-Cyrl": `${appUrl}?lang=uzKrill`,
      "uz-Latn": `${appUrl}?lang=uzLatin`,
      "x-default": appUrl,
    },
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
        <Script src={GA_SRC} strategy="afterInteractive" />
        <Script id="google-analytics-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
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
            <FloatingCallButton />
            <Toaster richColors position="top-right" />
          </SiteContentProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
