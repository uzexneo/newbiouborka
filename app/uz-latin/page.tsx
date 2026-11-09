import type { Metadata } from "next";
import { HomeContent } from "@/components/home-content";
import { getSchemaOrgJsonLd, serializeJsonLd } from "@/lib/seo-jsonld";
import { getServerPublicContent } from "@/lib/server-public-content";
import { buildHomeMetadata } from "@/lib/i18n/seo";

export const metadata: Metadata = buildHomeMetadata("uzLatin");

export default async function UzLatinPage() {
  const content = await getServerPublicContent();
  const jsonLd = getSchemaOrgJsonLd("uzLatin", content);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <HomeContent />
    </>
  );
}
