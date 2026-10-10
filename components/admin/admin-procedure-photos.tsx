"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n/language-provider";
import { SERVICE_CATEGORIES } from "@/lib/i18n/content";
import type { ServiceCategoryMeta } from "@/lib/i18n/content";
import { prepareProcedurePhoto } from "@/lib/procedure-photo-upload";
import {
  procedurePhotoResetResultSchema,
  procedurePhotoUploadResultSchema,
  procedurePhotoUploadSchema,
  procedurePhotosResultSchema,
} from "@/lib/validation/procedure-photos";

async function photoRequest(url: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: init?.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(30_000)])
        : AbortSignal.timeout(30_000),
    });
  } catch (error) {
    if (init?.signal?.aborted) throw error;
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("Сервер не ответил вовремя. Обновите страницу, чтобы проверить сохранение.");
    }
    throw new Error("Не удалось связаться с сервером. Попробуйте ещё раз.");
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Сервер не подтвердил результат. Обновите страницу и попробуйте ещё раз.");
  }
  if (!response.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : "Не удалось выполнить запрос");
  }
  return data;
}

function refreshPublicContent() {
  window.dispatchEvent(new Event("biouborka:content-updated"));
}

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
  const [fileInputKey, setFileInputKey] = useState(0);

  const current = src ?? category.photo;
  const hasCustom = src !== undefined;
  const busy = uploading || resetting;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const parsed = procedurePhotoUploadSchema.safeParse({ categoryId: category.id, file });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Выберите файл изображения");
      return;
    }

    setUploading(true);
    try {
      const prepared = await prepareProcedurePhoto(parsed.data.file);
      const form = new FormData();
      form.append("categoryId", category.id);
      form.append("file", prepared);

      const response = await photoRequest("/api/admin/procedure-photos", {
        method: "POST",
        body: form,
      });
      const result = procedurePhotoUploadResultSchema.safeParse(response);
      if (!result.success) {
        throw new Error("Сервер не подтвердил сохранение. Обновите страницу, чтобы проверить фото.");
      }
      onUploaded(result.data.src);
      refreshPublicContent();
      setFile(null);
      setFileInputKey((key) => key + 1);
      toast.success("Фото обновлено");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не удалось загрузить фото"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    if (busy) return;
    setResetting(true);
    try {
      const response = await photoRequest(
        `/api/admin/procedure-photos?categoryId=${encodeURIComponent(
          category.id
        )}`,
        { method: "DELETE" }
      );
      if (!procedurePhotoResetResultSchema.safeParse(response).success) {
        throw new Error("Сервер не подтвердил сброс. Обновите страницу, чтобы проверить фото.");
      }
      onReset();
      refreshPublicContent();
      setFile(null);
      setFileInputKey((key) => key + 1);
      toast.success("Фото сброшено к фото по умолчанию");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сбросить фото");
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
          key={fileInputKey}
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => {
            const selected = e.target.files?.[0] ?? null;
            if (selected) {
              const result = procedurePhotoUploadSchema.safeParse({ categoryId: category.id, file: selected });
              if (!result.success) {
                setFile(null);
                setFileInputKey((key) => key + 1);
                toast.error(result.error.issues[0]?.message ?? "Некорректное изображение");
                return;
              }
            }
            setFile(selected);
          }}
        />
        <p className="text-xs text-muted-foreground">Изображение до 10 МБ. После выбора нажмите «Сохранить фото».</p>
        <Button type="submit" disabled={busy || !file} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Загружаем...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Сохранить фото
            </>
          )}
        </Button>
      </form>

      {hasCustom && (
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={busy}
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
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await photoRequest("/api/admin/procedure-photos", { signal });
      const result = procedurePhotosResultSchema.safeParse(response);
      if (!result.success) {
        throw new Error("Не удалось прочитать фото процедур. Попробуйте ещё раз.");
      }
      if (signal?.aborted) return;
      setPhotos(result.data.photos);
    } catch (error) {
      if (signal?.aborted) return;
      setLoadError(error instanceof Error ? error.message : "Не удалось загрузить фото процедур");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Загрузка фото процедур" aria-busy="true">
        {SERVICE_CATEGORIES.map((category) => (
          <div key={category.id} className="space-y-3 rounded-xl border p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="aspect-[16/10] w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-3 rounded-xl border p-6">
        <p role="alert" className="text-sm text-destructive">{loadError}</p>
        <Button type="button" variant="outline" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" /> Попробовать ещё раз
        </Button>
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
