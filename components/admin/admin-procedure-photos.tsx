"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/language-provider";
import { SERVICE_CATEGORIES } from "@/lib/i18n/content";
import type { ServiceCategoryMeta } from "@/lib/i18n/content";
import { fetchJson } from "@/lib/api-client";

interface ProcedurePhotoCardProps {
  category: ServiceCategoryMeta;
  src: string | undefined;
  onUploaded: (src: string) => void;
  onReset: () => void;
}

function ProcedurePhotoCard({
  category,
  src,
  onUploaded,
  onReset,
}: ProcedurePhotoCardProps) {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const current = src ?? category.photo;
  const hasCustom = src !== undefined;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Выберите файл изображения");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("categoryId", category.id);
      form.append("file", file);

      const response = await fetch("/api/admin/procedure-photos", {
        method: "POST",
        body: form,
      });
      if (!response.ok) throw new Error("upload failed");

      const data = (await response.json()) as { src: string };
      onUploaded(data.src);
      setFile(null);
      toast.success("Фото обновлено");
    } catch {
      toast.error("Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const response = await fetch(
        `/api/admin/procedure-photos?categoryId=${encodeURIComponent(
          category.id
        )}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("reset failed");
      onReset();
      setFile(null);
      toast.success("Фото сброшено к фото по умолчанию");
    } catch {
      toast.error("Не удалось сбросить фото");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <h3 className="font-semibold">{t(category.titleKey)}</h3>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={t(category.titleKey)}
          className="h-full w-full object-cover"
        />
      </div>

      <form onSubmit={handleUpload} className="space-y-2">
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button type="submit" disabled={uploading || !file} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Загружаем...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Загрузить фото
            </>
          )}
        </Button>
      </form>

      {hasCustom && (
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={resetting}
          className="w-full"
        >
          {resetting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Сбросить на фото по умолчанию
        </Button>
      )}
    </div>
  );
}

export function AdminProcedurePhotos() {
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchJson<{ photos: Record<string, string> }>(
        "/api/admin/procedure-photos"
      );
      setPhotos(data.photos ?? {});
    } catch {
      toast.error("Не удалось загрузить фото процедур");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Загрузка фото процедур...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Фото в блоке «Как проходит процедура»</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Для каждой категории услуг можно загрузить своё фото, которое будет
        показываться перед ценами на главной странице. Пока фото не загружено —
        используется фото по умолчанию. Тексты процедур не меняются.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_CATEGORIES.map((category) => (
          <ProcedurePhotoCard
            key={category.id}
            category={category}
            src={photos[category.id]}
            onUploaded={(src) =>
              setPhotos((prev) => ({ ...prev, [category.id]: src }))
            }
            onReset={() =>
              setPhotos((prev) => {
                const next = { ...prev };
                delete next[category.id];
                return next;
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
