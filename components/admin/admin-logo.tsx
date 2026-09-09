"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageIcon, Loader2, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchJson } from "@/lib/api-client";

export function AdminLogo() {
  const [src, setSrc] = useState<string | null>(null);
  const [size, setSize] = useState<number>(44);
  const [sizeDraft, setSizeDraft] = useState<string>("44");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingSize, setSavingSize] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJson<{
          src: string | null;
          size: number | null;
        }>("/api/admin/logo");
        setSrc(data.src);
        setSize(data.size ?? 44);
        setSizeDraft(String(data.size ?? 44));
      } catch {
        toast.error("Не удалось загрузить логотип");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Выберите файл изображения");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch("/api/admin/logo", {
        method: "POST",
        body: form,
      });
      if (!response.ok) throw new Error("upload failed");

      const data = (await response.json()) as { src: string };
      setSrc(data.src);
      setFile(null);
      toast.success("Логотип обновлён");
    } catch {
      toast.error("Не удалось загрузить логотип");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSize = async () => {
    const parsed = Number.parseInt(sizeDraft, 10);
    if (Number.isNaN(parsed) || parsed < 20 || parsed > 200) {
      toast.error("Введите размер от 20 до 200 пикселей");
      return;
    }

    setSavingSize(true);
    try {
      const response = await fetch("/api/admin/logo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: parsed }),
      });
      if (!response.ok) throw new Error("save failed");

      setSize(parsed);
      setSizeDraft(String(parsed));
      toast.success("Размер логотипа сохранён");
    } catch {
      toast.error("Не удалось сохранить размер логотипа");
    } finally {
      setSavingSize(false);
    }
  };

  const handleReset = async () => {
    setDeleting(true);
    try {
      const response = await fetch("/api/admin/logo", { method: "DELETE" });
      if (!response.ok) throw new Error("delete failed");
      setSrc(null);
      setFile(null);
      toast.success("Логотип сброшен. Будет показана иконка по умолчанию.");
    } catch {
      toast.error("Не удалось сбросить логотип");
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
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">
            Изображение отображается в шапке сайта вместо иконки. Если логотип
            не загружен — показывается стандартная иконка.
          </p>
        </div>

        <Button type="submit" disabled={uploading || !file}>
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
            disabled={savingSize || sizeDraft === String(size)}
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
              disabled={deleting}
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
