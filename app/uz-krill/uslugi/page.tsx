import type { Metadata } from "next";
import { ServicesHubContent } from "@/components/services-hub-content";
import { buildServicesHubMetadata } from "@/lib/i18n/service-pages";
import { getServicesHubJsonLdDefault, serializeJsonLd } from "@/lib/seo-jsonld";
import { getServerPublicContent } from "@/lib/server-public-content";

export const metadata: Metadata = buildServicesHubMetadata("uzKrill");

export default async function UzKrillServicesHubPage() {
  const content = await getServerPublicContent();
  const jsonLd = getServicesHubJsonLdDefault("uzKrill", content);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ServicesHubContent />
    </>
  );
}
