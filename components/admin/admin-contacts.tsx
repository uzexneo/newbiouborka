"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Phone, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { DEFAULT_CONTACTS, type SiteContacts } from "@/lib/site-content";

const contactsSchema = z.object({
  phone: z.string().min(1, "Введите телефон").max(40),
  instagram: z.string().min(1, "Введите ссылку на Instagram").max(500),
  telegram: z.string().min(1, "Введите ссылку на Telegram").max(500),
  email: z.string().email("Введите корректный email").max(200),
  address: z.string().min(1, "Введите адрес").max(300),
});

type ContactsFormData = z.infer<typeof contactsSchema>;

export function AdminContacts() {
  const [formData, setFormData] = useState<ContactsFormData>(DEFAULT_CONTACTS);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactsFormData, string>>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/admin/content");
        if (!response.ok) throw new Error("load failed");
        const data = (await response.json()) as {
          contacts?: Partial<SiteContacts>;
        };
        if (data.contacts) {
          setFormData({ ...DEFAULT_CONTACTS, ...data.contacts });
        }
      } catch {
        toast.error("Не удалось загрузить контакты");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (field: keyof ContactsFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = contactsSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof ContactsFormData, string>> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as keyof ContactsFormData;
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "contacts", ...parsed.data }),
      });
      if (!response.ok) throw new Error("save failed");
      toast.success("Контакты сохранены");
    } catch {
      toast.error("Не удалось сохранить контакты");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Загрузка контактов...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel>Телефон</FieldLabel>
          <Input
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+998 93 375 27 02"
            aria-invalid={!!errors.phone}
          />
          {errors.phone && <FieldError>{errors.phone}</FieldError>}
        </Field>

        <Field>
          <FieldLabel>Instagram (ссылка)</FieldLabel>
          <Input
            value={formData.instagram}
            onChange={(e) => handleChange("instagram", e.target.value)}
            placeholder="https://www.instagram.com/biouborka.uz"
            aria-invalid={!!errors.instagram}
          />
          {errors.instagram && <FieldError>{errors.instagram}</FieldError>}
        </Field>

        <Field>
          <FieldLabel>Telegram (ссылка)</FieldLabel>
          <Input
            value={formData.telegram}
            onChange={(e) => handleChange("telegram", e.target.value)}
            placeholder="https://t.me/biouborka_uz"
            aria-invalid={!!errors.telegram}
          />
          {errors.telegram && <FieldError>{errors.telegram}</FieldError>}
        </Field>

        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="info@biouborka.uz"
            aria-invalid={!!errors.email}
          />
          {errors.email && <FieldError>{errors.email}</FieldError>}
        </Field>

        <Field>
          <FieldLabel>Адрес (город)</FieldLabel>
          <Input
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Ташкент, Узбекистан"
            aria-invalid={!!errors.address}
          />
          {errors.address && <FieldError>{errors.address}</FieldError>}
        </Field>

        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Сохранить контакты
        </Button>
      </FieldGroup>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Phone className="h-3.5 w-3.5" />
        Изменения мгновенно отобразятся на сайте.
      </p>
    </form>
  );
}
