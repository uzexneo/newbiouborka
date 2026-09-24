import type { Metadata } from "next";
import { ServicesHubContent } from "@/components/services-hub-content";
import { buildServicesHubMetadata } from "@/lib/i18n/service-pages";
import { getServicesHubJsonLdDefault } from "@/lib/seo-jsonld";

export const metadata: Metadata = buildServicesHubMetadata("uzLatin");

export default function UzLatinServicesHubPage() {
  const jsonLd = getServicesHubJsonLdDefault();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ServicesHubContent />
    </>
  );
}
