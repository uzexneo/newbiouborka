"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchJson } from "@/lib/api-client";

export function AdminMedia() {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJson<{ src: string }>("/api/admin/media");
        setSrc(data.src);
      } catch {
        toast.error("Не удалось загрузить фоновое изображение");
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

      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: form,
      });
      if (!response.ok) throw new Error("upload failed");

      const data = (await response.json()) as { src: string };
      setSrc(data.src);
      setFile(null);
      toast.success("Фоновое изображение обновлено");
    } catch {
      toast.error("Не удалось загрузить фоновое изображение");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Загрузка фона...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleUpload} className="max-w-md space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Фоновое изображение сайта</h3>
        </div>

        <div className="space-y-2">
          <Label>Новое фоновое изображение</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">
            Изображение применяется к фону герой-секции на главной странице.
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
              Обновить фон
            </>
          )}
        </Button>
      </form>

      <div>
        <p className="mb-3 text-sm text-muted-foreground">Текущий фон</p>
        <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-xl border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src ?? ""}
            alt="Текущее фоновое изображение"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
