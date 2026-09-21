import type { Metadata } from "next";
import { HomeContent } from "@/components/home-content";
import { getSchemaOrgJsonLd } from "@/lib/seo-jsonld";
import { seoByLocale, siteUrl } from "@/lib/i18n/seo";

export const metadata: Metadata = {
  title: { absolute: seoByLocale.uzKrill.title },
  description: seoByLocale.uzKrill.description,
  alternates: {
    canonical: seoByLocale.uzKrill.url,
    languages: {
      ru: seoByLocale.ru.url,
      "uz-Cyrl": seoByLocale.uzKrill.url,
      "uz-Latn": seoByLocale.uzLatin.url,
      "x-default": siteUrl,
    },
  },
  openGraph: {
    locale: seoByLocale.uzKrill.ogLocale,
    title: seoByLocale.uzKrill.title,
    description: seoByLocale.uzKrill.description,
    url: seoByLocale.uzKrill.url,
  },
};

export default function UzKrillPage() {
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
