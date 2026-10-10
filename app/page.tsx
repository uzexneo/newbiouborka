import type { Metadata } from "next";
import { HomeContent } from "@/components/home-content";
import { getSchemaOrgJsonLd } from "@/lib/seo-jsonld";
import { buildHomeMetadata } from "@/lib/i18n/seo";

export const metadata: Metadata = buildHomeMetadata("ru");

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
