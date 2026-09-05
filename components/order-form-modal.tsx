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
import { Textarea } from "@/components/ui/textarea";
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
  date: string;
  time: string;
  address: string;
}

function buildSchema(messages: ValidationMessages) {
  return z.object({
    name: z.string().min(1, messages.name),
    phone: z.string().min(1, messages.phone),
    service: z.string().min(1, messages.service),
    date: z.string().min(1, messages.date),
    time: z.string().min(1, messages.time),
    address: z.string().min(1, messages.address),
    comment: z.string().optional(),
  });
}

type OrderFormData = z.infer<ReturnType<typeof buildSchema>>;

interface OrderFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedService?: string;
}

export function OrderFormModal({
  open,
  onOpenChange,
  preselectedService,
}: OrderFormModalProps) {
  const { t } = useLanguage();
  const { services } = useSiteContent();
  const allServices = services.flatMap((category) => category.services);
  const [formData, setFormData] = useState<OrderFormData>({
    name: "",
    phone: "",
    service: preselectedService ?? "",
    date: "",
    time: "",
    address: "",
    comment: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof OrderFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (field: keyof OrderFormData, value: string) => {
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
      date: t("order.validate.date"),
      time: t("order.validate.time"),
      address: t("order.validate.address"),
    });

    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof OrderFormData, string>> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof OrderFormData;
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

      setFormData({
        name: "",
        phone: "",
        service: "",
        date: "",
        time: "",
        address: "",
        comment: "",
      });
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
          <DialogTitle>{t("order.title")}</DialogTitle>
          <DialogDescription>{t("order.description")}</DialogDescription>
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

            <div className="flex gap-3">
              <Field className="flex-1">
                <FieldLabel>{t("order.fieldDate")}</FieldLabel>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  aria-invalid={!!errors.date}
                />
                {errors.date && <FieldError>{errors.date}</FieldError>}
              </Field>

              <Field className="flex-1">
                <FieldLabel>{t("order.fieldTime")}</FieldLabel>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleChange("time", e.target.value)}
                  aria-invalid={!!errors.time}
                />
                {errors.time && <FieldError>{errors.time}</FieldError>}
              </Field>
            </div>

            <Field>
              <FieldLabel>{t("order.fieldAddress")}</FieldLabel>
              <Input
                placeholder={t("order.fieldAddressPlaceholder")}
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                aria-invalid={!!errors.address}
              />
              {errors.address && <FieldError>{errors.address}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>{t("order.fieldComment")}</FieldLabel>
              <Textarea
                placeholder={t("order.fieldCommentPlaceholder")}
                value={formData.comment}
                onChange={(e) => handleChange("comment", e.target.value)}
              />
            </Field>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("order.submitting") : t("order.submit")}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
