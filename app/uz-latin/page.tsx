import type { Metadata } from "next";
import { HomeContent } from "@/components/home-content";
import { getSchemaOrgJsonLd } from "@/lib/seo-jsonld";
import { seoByLocale, siteUrl } from "@/lib/i18n/seo";

export const metadata: Metadata = {
  title: { absolute: seoByLocale.uzLatin.title },
  description: seoByLocale.uzLatin.description,
  alternates: {
    canonical: seoByLocale.uzLatin.url,
    languages: {
      ru: seoByLocale.ru.url,
      "uz-Cyrl": seoByLocale.uzKrill.url,
      "uz-Latn": seoByLocale.uzLatin.url,
      "x-default": siteUrl,
    },
  },
  openGraph: {
    locale: seoByLocale.uzLatin.ogLocale,
    title: seoByLocale.uzLatin.title,
    description: seoByLocale.uzLatin.description,
    url: seoByLocale.uzLatin.url,
  },
};

export default function UzLatinPage() {
  const jsonLd = getSchemaOrgJsonLd();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeContent />
    </>
  );
}
