import type { Metadata } from "next";
import { HomeContent } from "@/components/home-content";

export const metadata: Metadata = {
  title: "Профессиональная биоуборка в Ташкенте",
  description:
    "BIOUBORKA.UZ — экологичная уборка квартир и домов в Ташкенте. Безопасные био-средства, химчистка мебели, уборка после ремонта. Забота о вашем здоровье.",
  openGraph: {
    title: "BIOUBORKA.UZ — Профессиональная биоуборка в Ташкенте",
    description:
      "Экологичная уборка квартир и домов в Ташкенте. Безопасные био-средства, химчистка мебели, уборка после ремонта.",
  },
};

export default function HomePage() {
  return <HomeContent />;
}
