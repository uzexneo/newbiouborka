import type { Metadata } from "next";
import { HomeContent } from "@/components/home-content";
import { getSchemaOrgJsonLd } from "@/lib/seo-jsonld";
import { seoByLocale } from "@/lib/i18n/seo";

export const metadata: Metadata = {
  title: { absolute: seoByLocale.ru.title },
  description: seoByLocale.ru.description,
  openGraph: {
    title: seoByLocale.ru.title,
    description: seoByLocale.ru.description,
  },
};

export default function HomePage() {
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
