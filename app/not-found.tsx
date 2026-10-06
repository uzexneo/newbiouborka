import type { Metadata } from "next";
import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = {
  title: { absolute: "404 — Страница не найдена | BIOUBORKA.UZ" },
  description: "Страница не найдена. Перейдите на главную или выберите услугу.",
  robots: { index: false, follow: false },
  // An unknown URL must not inherit the homepage canonical or translations.
  alternates: null,
  openGraph: null,
  twitter: null,
  keywords: null,
};

export default function NotFound() {
  return (
    <section
      data-page-status="404"
      className="container mx-auto px-4 py-20 text-center"
    >
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="size-8 text-muted-foreground" aria-hidden />
      </div>
      <p className="mb-2 text-sm font-semibold text-muted-foreground">404</p>
      <h1 className="text-3xl font-bold tracking-tight">Страница не найдена</h1>
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">
        Возможно, ссылка устарела. Выберите нужную услугу или вернитесь на главную.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonVariants()}>
          На главную
        </Link>
        <Link href="/uslugi" className={buttonVariants({ variant: "outline" })}>
          Посмотреть услуги
        </Link>
      </div>
    </section>
  );
}
