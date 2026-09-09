"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useLanguage } from "@/lib/i18n/language-provider";
import { useSiteContent } from "@/lib/site-content-provider";

interface ValidationMessages {
  name: string;
  phone: string;
  service: string;
}

function buildSchema(messages: ValidationMessages) {
  return z.object({
    name: z.string().min(1, messages.name),
    phone: z.string().min(1, messages.phone),
    service: z.string().min(1, messages.service),
  });
}

type QuickOrderData = z.infer<ReturnType<typeof buildSchema>>;

interface QuickOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickOrderModal({ open, onOpenChange }: QuickOrderModalProps) {
  const { t } = useLanguage();
  const { services } = useSiteContent();
  const allServices = services.flatMap((category) => category.services);
  const [formData, setFormData] = useState<QuickOrderData>({
    name: "",
    phone: "",
    service: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof QuickOrderData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (field: keyof QuickOrderData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const schema = buildSchema({
      name: t("validate.name"),
      phone: t("validate.phone"),
      service: t("order.validate.service"),
    });

    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof QuickOrderData, string>> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof QuickOrderData;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!response.ok) {
        throw new Error("save failed");
      }

      setFormData({ name: "", phone: "", service: "" });
      setErrors({});
      onOpenChange(false);
      toast.success(t("order.success"));
    } catch {
      toast.error(t("order.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("quick.title")}</DialogTitle>
          <DialogDescription>{t("quick.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>{t("field.name")}</FieldLabel>
              <Input
                placeholder={t("field.namePlaceholder")}
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>{t("field.phone")}</FieldLabel>
              <Input
                type="tel"
                placeholder={t("field.phonePlaceholder")}
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && <FieldError>{errors.phone}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>{t("order.fieldService")}</FieldLabel>
              <Select
                value={formData.service}
                onValueChange={(value) => handleChange("service", value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("order.fieldServicePlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {allServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service && <FieldError>{errors.service}</FieldError>}
            </Field>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("order.submitting") : t("quick.submit")}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
