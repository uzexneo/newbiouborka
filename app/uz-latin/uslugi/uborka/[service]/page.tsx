import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CleaningServiceContent } from "@/components/cleaning-service-content";
import {
  CLEANING_SERVICE_SLUGS,
  buildCleaningServiceMetadata,
  getCleaningServiceJsonLd,
  isCleaningServiceSlug,
} from "@/lib/cleaning-service-pages";
import { serializeJsonLd } from "@/lib/seo-jsonld";

interface PageProps {
  params: Promise<{ service: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return CLEANING_SERVICE_SLUGS.map((service) => ({ service }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { service } = await params;
  if (!isCleaningServiceSlug(service)) notFound();
  return buildCleaningServiceMetadata(service, "uzLatin");
}

export default async function CleaningServicePage({ params }: PageProps) {
  const { service } = await params;
  if (!isCleaningServiceSlug(service)) notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(getCleaningServiceJsonLd(service, "uzLatin")),
        }}
      />
      <CleaningServiceContent slug={service} />
    </>
  );
}
