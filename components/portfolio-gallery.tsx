"use client";

import { GalleryItem } from "@/lib/gallery-data";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-provider";
import { categoryKey, galleryTitleKey } from "@/lib/i18n/content";

export function PortfolioGallery({ items }: { items: GalleryItem[] }) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all" ? items : items.filter((item) => item.category === filter);

  return (
    <>
      <div
        className="flex flex-wrap gap-2 justify-center mb-10"
        role="group"
        aria-label={t("portfolio.filterAria")}
      >
        {["all", ...new Set(items.map((i) => i.category))].map((cat) => {
          const label = cat === "all" ? t("gallery.all") : t(categoryKey(cat));
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              aria-pressed={filter === cat}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                filter === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const title = t(galleryTitleKey(item.id)) || item.title;
          return (
            <article
              key={item.id}
              className="group relative overflow-hidden rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <button
                onClick={() => setSelected(item)}
                className="w-full text-left"
                aria-label={`${title}${t("portfolio.openSuffix")}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  {item.src.startsWith("data:") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.src}
                      alt={title}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <Image
                      src={item.src}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
              </button>
            </article>
          );
        })}
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        {selected && (
          <DialogContent
            className="max-w-3xl p-0 overflow-hidden"
            showCloseButton={false}
          >
            <div className="relative aspect-[3/4] sm:aspect-auto sm:max-h-[80vh] bg-black">
              {selected.src.startsWith("data:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.src}
                  alt={t(galleryTitleKey(selected.id)) || selected.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain sm:object-cover"
                />
              ) : (
                <Image
                  src={selected.src}
                  alt={t(galleryTitleKey(selected.id)) || selected.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-contain sm:object-cover"
                />
              )}
              <DialogTitle className="sr-only">
                {t(galleryTitleKey(selected.id)) || selected.title}
              </DialogTitle>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 rounded-full bg-background/80 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t("portfolio.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
