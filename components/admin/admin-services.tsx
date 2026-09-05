"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { groupServicesByCategory, type SiteService } from "@/lib/site-content";

const serviceFormSchema = z.object({
  name: z.string().min(1, "Введите название услуги").max(200),
  price: z.string().min(1, "Введите цену").max(200),
  categoryId: z.string().min(1, "Выберите категорию").max(100),
  categoryTitle: z.string().min(1, "Введите название категории").max(200),
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;

interface Editing {
  id?: string;
  data: ServiceFormData;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function AdminServices() {
  const [services, setServices] = useState<SiteService[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ServiceFormData, string>>
  >({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/services");
      if (!response.ok) throw new Error("load failed");
      const data = (await response.json()) as SiteService[];
      setServices(data);
    } catch {
      toast.error("Не удалось загрузить услуги");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = groupServicesByCategory(services);

  const openAdd = (category?: { id: string; title: string }) => {
    setIsNewCategory(!category);
    setEditing({
      data: {
        name: "",
        price: "",
        categoryId: category?.id ?? "",
        categoryTitle: category?.title ?? "",
      },
    });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (service: SiteService) => {
    setIsNewCategory(false);
    setEditing({
      id: service.id,
      data: {
        name: service.name,
        price: service.price,
        categoryId: service.categoryId,
        categoryTitle: service.categoryTitle,
      },
    });
    setErrors({});
    setDialogOpen(true);
  };

  const updateField = (field: keyof ServiceFormData, value: string) => {
    setEditing((prev) =>
      prev ? { ...prev, data: { ...prev.data, [field]: value } } : prev
    );
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    const parsed = serviceFormSchema.safeParse(editing.data);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof ServiceFormData, string>> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as keyof ServiceFormData;
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    const data = parsed.data;
    const payload =
      editing.id === undefined
        ? {
            ...data,
            categoryId: isNewCategory
              ? slugify(data.categoryTitle) || data.categoryId
              : data.categoryId,
          }
        : { id: editing.id, ...data };

    setSaving(true);
    try {
      const response = await fetch("/api/admin/services", {
        method: editing.id === undefined ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("save failed");
      toast.success(
        editing.id === undefined ? "Услуга добавлена" : "Услуга обновлена"
      );
      setDialogOpen(false);
      setServices([]);
      setLoading(true);
      await load();
    } catch {
      toast.error("Не удалось сохранить услугу");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service: SiteService) => {
    toast("Удалить услугу?", {
      action: {
        label: "Удалить",
        onClick: async () => {
          try {
            const response = await fetch(
              `/api/admin/services?id=${encodeURIComponent(service.id)}`,
              { method: "DELETE" }
            );
            if (!response.ok) throw new Error("delete failed");
            toast.success("Услуга удалена");
            setServices((prev) => prev.filter((s) => s.id !== service.id));
          } catch {
            toast.error("Не удалось удалить услугу");
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
        <span className="text-sm">Загрузка услуг...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {services.length} услуг в {categories.length} категориях
        </p>
        <Button onClick={() => openAdd()}>
          <Plus className="h-4 w-4" />
          Добавить услугу
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Услуг пока нет. Добавьте первую услугу.
          </p>
        </div>
      ) : (
        categories.map((category) => (
          <div key={category.id} className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{category.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  openAdd({ id: category.id, title: category.title })
                }
              >
                <Plus className="h-4 w-4" />
                Добавить
              </Button>
            </div>
            <ul className="divide-y">
              {category.services.map((service) => (
                <li
                  key={service.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {service.name}
                    </p>
                    <p className="text-sm text-primary">{service.price}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(service)}
                      aria-label="Редактировать"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(service)}
                      aria-label="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Изменить услугу" : "Добавить услугу"}
            </DialogTitle>
            <DialogDescription>
              Заполните поля, чтобы обновить каталог услуг и цен.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <FieldGroup>
              <Field>
                <FieldLabel>Название услуги</FieldLabel>
                <Input
                  value={editing?.data.name ?? ""}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Например, Генеральная уборка"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <FieldError>{errors.name}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Цена</FieldLabel>
                <Input
                  value={editing?.data.price ?? ""}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder="Например, 25 000 сум/м²"
                  aria-invalid={!!errors.price}
                />
                {errors.price && <FieldError>{errors.price}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Категория</FieldLabel>
                {!isNewCategory ? (
                  <Select
                    value={editing?.data.categoryId ?? ""}
                    onValueChange={(value) => {
                      updateField("categoryId", value ?? "");
                      const cat = categories.find((c) => c.id === value);
                      if (cat) updateField("categoryTitle", cat.title);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={editing?.data.categoryTitle ?? ""}
                    onChange={(e) =>
                      updateField("categoryTitle", e.target.value)
                    }
                    placeholder="Название новой категории"
                    aria-invalid={!!errors.categoryTitle}
                  />
                )}
                {isNewCategory && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="mt-1 h-auto p-0"
                    onClick={() => setIsNewCategory(false)}
                  >
                    Выбрать существующую категорию
                  </Button>
                )}
                {!isNewCategory && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="mt-1 h-auto p-0"
                    onClick={() => setIsNewCategory(true)}
                  >
                    Создать новую категорию
                  </Button>
                )}
                {errors.categoryTitle && (
                  <FieldError>{errors.categoryTitle}</FieldError>
                )}
              </Field>

              <Button type="submit" disabled={saving}>
                {saving ? "Сохраняем..." : "Сохранить"}
              </Button>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
