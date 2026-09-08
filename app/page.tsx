import type { Metadata } from "next";
import { HomeContent } from "@/components/home-content";
import { getSchemaOrgJsonLd } from "@/lib/seo-jsonld";

export const metadata: Metadata = {
  title: "Уборка квартир в Ташкенте — BIOUBORKA.UZ",
  description:
    "Профессиональная биоуборка квартир и домов в Ташкенте. Химчистка мебели и ковров безопасными средствами. Телефон +998 93 375 27 02.",
  openGraph: {
    title: "Уборка квартир в Ташкенте — BIOUBORKA.UZ",
    description:
      "Экологичная уборка квартир и домов в Ташкенте. Безопасные био-средства, химчистка мебели, уборка после ремонта. Телефон +998 93 375 27 02.",
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
