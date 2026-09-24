import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicesCategoryContent } from "@/components/services-category-content";
import { buildServiceCategoryMetadata } from "@/lib/i18n/service-pages";
import { getServiceCategoryJsonLdBySlug } from "@/lib/seo-jsonld";
import { SERVICE_PAGES } from "@/lib/i18n/content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return SERVICE_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildServiceCategoryMetadata(slug, "uzLatin");
}

export default async function UzLatinServiceCategoryPage({
  params,
}: PageProps) {
  const { slug } = await params;
  const page = SERVICE_PAGES.find((p) => p.slug === slug);
  if (!page) {
    notFound();
  }
  const jsonLd = getServiceCategoryJsonLdBySlug(slug);
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ServicesCategoryContent slug={slug} />
    </>
  );
}
