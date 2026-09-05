"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Images, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const gallerySchema = z.object({
  title: z.string().min(1, "Введите название фото").max(300),
  category: z.string().min(1, "Выберите категорию"),
});

const CATEGORIES = [
  { value: "apartment", label: "Квартиры" },
  { value: "furniture", label: "Мебель" },
  { value: "office", label: "Офисы" },
  { value: "after-renovation", label: "После ремонта" },
];

interface Photo {
  id: string;
  title: string;
  category: string;
  src: string;
}

export function AdminGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<{ title?: string; category?: string }>(
    {}
  );

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/gallery");
      if (!response.ok) throw new Error("load failed");
      const data = (await response.json()) as Photo[];
      setPhotos(data);
    } catch {
      toast.error("Не удалось загрузить галерею");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = gallerySchema.safeParse({ title, category });
    if (!parsed.success) {
      const fieldErrors: { title?: string; category?: string } = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as "title" | "category";
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    if (!file) {
      toast.error("Выберите файл изображения");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", parsed.data.title);
      form.append("category", parsed.data.category);

      const response = await fetch("/api/admin/gallery", {
        method: "POST",
        body: form,
      });
      if (!response.ok) throw new Error("upload failed");

      toast.success("Фото добавлено в галерею");
      setFile(null);
      setTitle("");
      setCategory("");
      await load();
    } catch {
      toast.error("Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo: Photo) => {
    toast("Удалить фото из галереи?", {
      action: {
        label: "Удалить",
        onClick: async () => {
          try {
            const response = await fetch(
              `/api/admin/gallery?id=${encodeURIComponent(photo.id)}`,
              { method: "DELETE" }
            );
            if (!response.ok) throw new Error("delete failed");
            toast.success("Фото удалено");
            setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
          } catch {
            toast.error("Не удалось удалить фото");
          }
        },
      },
      cancel: { label: "Отмена", onClick: () => {} },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Загрузка галереи...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleUpload}
        className="rounded-xl border bg-card p-4 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Добавить фото в галерею</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Название фото</Label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="Например, Гостиная после уборки"
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Категория</Label>
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value ?? "");
                setErrors((prev) => ({ ...prev, category: undefined }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Файл изображения</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">
            JPG, PNG или WebP. Фото автоматически сжимается для отображения.
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
              <Plus className="h-4 w-4" />
              Загрузить фото
            </>
          )}
        </Button>
      </form>

      <div>
        <p className="mb-3 text-sm text-muted-foreground">
          {photos.length} фото в галерее
        </p>
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <Images className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Фотографий пока нет. Добавьте первую.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-xl border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.title}
                  className="aspect-[3/4] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                  <p className="truncate text-xs font-medium text-white">
                    {photo.title}
                  </p>
                  <p className="text-[11px] text-white/70">{photo.category}</p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => handleDelete(photo)}
                  aria-label="Удалить фото"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
