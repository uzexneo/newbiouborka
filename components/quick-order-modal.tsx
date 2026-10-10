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
import { trackGenerateLead } from "@/lib/analytics";

interface ValidationMessages {
  name: string;
  phone: string;
  service: string;
}

function buildSchema(messages: ValidationMessages) {
  return z.object({
    name: z.string().trim().min(1, messages.name).max(100, messages.name),
    phone: z.string().trim().max(30, messages.phone).refine(
      (value) => /^\+?[\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 7 && value.replace(/\D/g, "").length <= 15,
      messages.phone
    ),
    service: z.string().trim().min(1, messages.service).max(200, messages.service),
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
    if (isSubmitting) return;
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
        body: JSON.stringify({
          ...result.data,
          service: allServices.find((service) => service.id === result.data.service)?.name ?? result.data.service,
        }),
        signal: AbortSignal.timeout(45_000),
      });

      const confirmation = await response.json().catch(() => null);
      if (!response.ok || confirmation?.saved !== true) {
        throw new Error("save failed");
      }

      trackGenerateLead({ formName: "quick", service: result.data.service });

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
              <FieldLabel htmlFor="quick-name">{t("field.name")}</FieldLabel>
              <Input
                id="quick-name"
                autoComplete="name"
                placeholder={t("field.namePlaceholder")}
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="quick-phone">{t("field.phone")}</FieldLabel>
              <Input
                id="quick-phone"
                type="tel"
                autoComplete="tel"
                placeholder={t("field.phonePlaceholder")}
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && <FieldError>{errors.phone}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="quick-service">{t("order.fieldService")}</FieldLabel>
              <Select
                value={formData.service}
                onValueChange={(value) => handleChange("service", value ?? "")}
                items={allServices.map((service) => ({
                  value: service.id,
                  label: service.name,
                }))}
              >
                <SelectTrigger id="quick-service" className="w-full">
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
