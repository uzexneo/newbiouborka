"use client";

import { useState } from "react";
import { OrderFormModal } from "@/components/order-form-modal";
import {
  Home,
  Droplets,
  Layers,
  Sofa,
  BedDouble,
  Armchair,
  Brush,
  CookingPot,
  Sparkles,
  Info,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { SERVICE_CATEGORIES } from "@/lib/i18n/content";

const iconMap: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  Home,
  Droplets,
  Layers,
  Sofa,
  BedDouble,
  Armchair,
  Brush,
  CookingPot,
  Sparkles,
};

const categoryMeta = new Map(SERVICE_CATEGORIES.map((c) => [c.id, c]));

export function ServiceCardsSection() {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | undefined>(
    undefined
  );

  const handleOrderClick = (serviceId: string) => {
    setSelectedService(serviceId);
    setModalOpen(true);
  };

  return (
    <>
      <section id="services" className="container mx-auto px-4 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("services.heading")}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t("services.subheading")}
            </p>
          </div>

          <div className="space-y-12">
            {SERVICE_CATEGORIES.map((category) => {
              const meta = categoryMeta.get(category.id);
              const Icon = iconMap[meta?.icon ?? ""] ?? Sparkles;
              const note = meta ? t(meta.noteKey) : undefined;
              return (
                <div
                  key={category.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        {t(category.titleKey)}
                      </h3>
                      {note && (
                        <span className="text-sm font-medium text-primary">
                          {note}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {category.services.map((service, i) => (
                      <article
                        key={service.id}
                        className="card-hover rounded-xl border bg-card p-5 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <h4 className="font-medium leading-snug flex-1">
                          {t(service.titleKey)}
                        </h4>
                        <div className="text-base font-bold text-primary">
                          {t(service.priceKey)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOrderClick(service.id)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
                        >
                          {t("services.orderButton")}
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/40 px-4 py-4 text-center">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">
              {t("services.minOrder")}
            </p>
          </div>
        </div>
      </section>

      {modalOpen && (
        <OrderFormModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          preselectedService={selectedService}
        />
      )}
    </>
  );
}
