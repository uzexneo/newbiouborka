"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Phone, Mail, Camera, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  message: string;
}

function buildSchema(messages: ValidationMessages) {
  return z.object({
    name: z.string().min(1, messages.name).max(100),
    phone: z.string().min(1, messages.phone).max(30),
    message: z.string().min(1, messages.message).max(2000),
  });
}

type FeedbackFormData = z.infer<ReturnType<typeof buildSchema>>;

export function ContactsSection() {
  const { t } = useLanguage();
  const { contacts } = useSiteContent();
  const telHref = `tel:+${contacts.phone.replace(/[^\d]/g, "")}`;
  const [formData, setFormData] = useState<FeedbackFormData>({
    name: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FeedbackFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof FeedbackFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const schema = buildSchema({
      name: t("validate.name"),
      phone: t("validate.phone"),
      message: t("validate.message"),
    });

    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FeedbackFormData, string>> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof FeedbackFormData;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      toast.success(t("feedback.success"));
      setFormData({ name: "", phone: "", message: "" });
      setErrors({});
    } catch {
      toast.error(t("feedback.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contacts" className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("contacts.heading")}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t("contacts.subheading")}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">
                  {t("contacts.infoHeading")}
                </h3>
                <div className="space-y-4">
                  <a
                    href={telHref}
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {contacts.phone}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("contacts.callHours")}
                      </p>
                    </div>
                  </a>

                  <a
                    href={`mailto:${contacts.email}`}
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {contacts.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("contacts.emailHint")}
                      </p>
                    </div>
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {t("contacts.socialsHeading")}
                </h3>
                <div className="flex gap-4">
                  <a
                    href={contacts.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    Instagram
                  </a>
                  <a
                    href={contacts.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    Telegram
                  </a>
                </div>
              </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-xl border bg-card p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">
                    {t("contacts.feedbackHeading")}
                  </h3>
                </div>
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
                      <FieldLabel>{t("field.message")}</FieldLabel>
                      <Textarea
                        placeholder={t("field.messagePlaceholder")}
                        value={formData.message}
                        onChange={(e) =>
                          handleChange("message", e.target.value)
                        }
                        aria-invalid={!!errors.message}
                        rows={4}
                      />
                      {errors.message && (
                        <FieldError>{errors.message}</FieldError>
                      )}
                    </Field>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? t("field.submitting") : t("field.submit")}
                    </Button>
                  </FieldGroup>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
