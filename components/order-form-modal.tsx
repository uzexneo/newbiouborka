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
import { trackGenerateLead } from "@/lib/analytics";

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
    name: z.string().trim().min(1, messages.name).max(100, messages.name),
    phone: z.string().trim().max(30, messages.phone).refine(
      (value) => /^\+?[\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 7 && value.replace(/\D/g, "").length <= 15,
      messages.phone
    ),
    service: z.string().trim().min(1, messages.service).max(200, messages.service),
    date: z.string().min(1, messages.date).max(20, messages.date),
    time: z.string().min(1, messages.time).max(20, messages.time),
    address: z.string().trim().min(1, messages.address).max(500, messages.address),
    comment: z.string().max(2000).optional(),
  });
}

type OrderFormData = z.infer<ReturnType<typeof buildSchema>>;

interface OrderFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedService?: string;
}

export function OrderFormModal(props: OrderFormModalProps) {
  return <OrderFormContent key={props.preselectedService ?? "default"} {...props} />;
}

function OrderFormContent({
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
    if (isSubmitting) return;
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

      trackGenerateLead({ formName: "order", service: result.data.service });

      setFormData({
        name: "",
        phone: "",
        service: preselectedService ?? "",
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
              <FieldLabel htmlFor="order-name">{t("field.name")}</FieldLabel>
              <Input
                id="order-name"
                autoComplete="name"
                placeholder={t("field.namePlaceholder")}
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="order-phone">{t("field.phone")}</FieldLabel>
              <Input
                id="order-phone"
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
              <FieldLabel htmlFor="order-service">{t("order.fieldService")}</FieldLabel>
              <Select
                value={formData.service}
                onValueChange={(value) => handleChange("service", value ?? "")}
                items={allServices.map((service) => ({
                  value: service.id,
                  label: service.name,
                }))}
              >
                <SelectTrigger id="order-service" className="w-full">
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
                <FieldLabel htmlFor="order-date">{t("order.fieldDate")}</FieldLabel>
                <Input
                  id="order-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  aria-invalid={!!errors.date}
                />
                {errors.date && <FieldError>{errors.date}</FieldError>}
              </Field>

              <Field className="flex-1">
                <FieldLabel htmlFor="order-time">{t("order.fieldTime")}</FieldLabel>
                <Input
                  id="order-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleChange("time", e.target.value)}
                  aria-invalid={!!errors.time}
                />
                {errors.time && <FieldError>{errors.time}</FieldError>}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="order-address">{t("order.fieldAddress")}</FieldLabel>
              <Input
                id="order-address"
                autoComplete="street-address"
                placeholder={t("order.fieldAddressPlaceholder")}
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                aria-invalid={!!errors.address}
              />
              {errors.address && <FieldError>{errors.address}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="order-comment">{t("order.fieldComment")}</FieldLabel>
              <Textarea
                id="order-comment"
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
