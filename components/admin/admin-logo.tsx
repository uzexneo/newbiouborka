"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageIcon, Loader2, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchJson } from "@/lib/api-client";
import {
  imageUploadSchema,
  logoSizeSchema,
} from "@/lib/validation/admin-content";
import { prepareImageUpload } from "@/lib/procedure-photo-upload";
import { AdminLoadError } from "@/components/admin/admin-load-error";
import { refreshPublicContent } from "@/lib/site-content-events";

export function AdminLogo() {
  const [src, setSrc] = useState<string | null>(null);
  const [size, setSize] = useState<number>(44);
  const [sizeDraft, setSizeDraft] = useState<string>("44");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingSize, setSavingSize] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const busy = uploading || deleting || savingSize;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchJson<{
        src: string | null;
        size: number | null;
      }>("/api/admin/logo");
      setSrc(data.src);
      setSize(data.size ?? 44);
      setSizeDraft(String(data.size ?? 44));
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Не удалось загрузить логотип"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const image = imageUploadSchema.safeParse({ file });
    if (!image.success) {
      toast.error(
        image.error.issues[0]?.message ?? "Выберите файл изображения"
      );
      return;
    }

    setUploading(true);
    try {
      const prepared = await prepareImageUpload(image.data.file, 512);
      const form = new FormData();
      form.append("file", prepared);

      const data = await fetchJson<{ src: string; size: number | null }>(
        "/api/admin/logo",
        {
          method: "POST",
          body: form,
        }
      );
      setSrc(data.src);
      setSize(data.size ?? 44);
      setSizeDraft(String(data.size ?? 44));
      setFile(null);
      setFileInputKey((value) => value + 1);
      refreshPublicContent();
      toast.success("Логотип обновлён");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не удалось загрузить логотип"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSize = async () => {
    if (busy) return;
    const result = logoSizeSchema.safeParse({
      size: sizeDraft.trim() ? Number(sizeDraft) : null,
    });
    if (!result.success || result.data.size === null) {
      toast.error("Введите размер от 20 до 200 пикселей");
      return;
    }

    const parsed = result.data.size;
    setSavingSize(true);
    try {
      await fetchJson("/api/admin/logo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: parsed }),
      });

      setSize(parsed);
      setSizeDraft(String(parsed));
      refreshPublicContent();
      toast.success("Размер логотипа сохранён");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Не удалось сохранить размер логотипа"
      );
    } finally {
      setSavingSize(false);
    }
  };

  const handleReset = async () => {
    if (busy) return;
    setDeleting(true);
    try {
      await fetchJson("/api/admin/logo", { method: "DELETE" });
      setSrc(null);
      setSize(44);
      setSizeDraft("44");
      setFile(null);
      setFileInputKey((value) => value + 1);
      refreshPublicContent();
      toast.success("Логотип сброшен. Будет показана иконка по умолчанию.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не удалось сбросить логотип"
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Загрузка логотипа...</span>
      </div>
    );
  }

  if (loadError)
    return (
      <AdminLoadError
        message={loadError}
        onRetry={() => {
          void load();
        }}
      />
    );

  return (
    <div className="space-y-6">
      <form onSubmit={handleUpload} className="max-w-md space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Логотип сайта</h3>
        </div>

        <div className="space-y-2">
          <Label>Новое изображение логотипа</Label>
          <Input
            key={fileInputKey}
            type="file"
            disabled={busy}
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">
            Изображение отображается в шапке сайта вместо иконки. Если логотип
            не загружен — показывается стандартная иконка.
          </p>
        </div>

        <Button type="submit" disabled={busy || !file}>
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Загружаем...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Загрузить логотип
            </>
          )}
        </Button>
      </form>

      <div className="space-y-2">
        <Label>Размер логотипа (px)</Label>
        <div className="flex items-end gap-3">
          <div className="w-32">
            <Input
              type="number"
              min={20}
              max={200}
              value={sizeDraft}
              onChange={(e) => setSizeDraft(e.target.value)}
            />
          </div>
          <Button
            type="button"
            onClick={handleSaveSize}
            disabled={busy || sizeDraft === String(size)}
          >
            {savingSize && <Loader2 className="h-4 w-4 animate-spin" />}
            Сохранить размер
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Ширина и высота логотипа в шапке сайта (по умолчанию 44 px). Если
          размер не задан — используется значение по умолчанию.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Текущий логотип</p>
        {src ? (
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center overflow-hidden rounded-lg border bg-card ring-1 ring-border"
              style={{ width: size, height: size }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="Текущий логотип"
                className="h-full w-full object-contain"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={busy}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Сбросить на иконку по умолчанию
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Логотип не загружен — в шапке показывается стандартная иконка.
          </p>
        )}
      </div>
    </div>
  );
}
