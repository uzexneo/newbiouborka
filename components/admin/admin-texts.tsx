"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Star,
  Building2,
  Sparkles,
  MessageSquareQuote,
} from "lucide-react";
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
import {
  DEFAULT_ABOUT,
  DEFAULT_BENEFITS,
  DEFAULT_TESTIMONIALS,
  type SiteAbout,
  type SiteBenefit,
  type SiteTestimonial,
} from "@/lib/site-content";
import { fetchJson } from "@/lib/api-client";

type Tab = "about" | "benefits" | "testimonials";

const aboutSchema = z.object({
  p1: z.string().min(1, "Заполните текст").max(5000),
  p2: z.string().max(5000),
  p3: z.string().max(5000),
});

const tabs: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: "about", label: "О компании", icon: Building2 },
  { id: "benefits", label: "Преимущества", icon: Sparkles },
  { id: "testimonials", label: "Отзывы", icon: MessageSquareQuote },
];

interface AdminContentResponse {
  about?: Partial<SiteAbout>;
  benefits?: SiteBenefit[];
  testimonials?: SiteTestimonial[];
}

export function AdminTexts() {
  const [tab, setTab] = useState<Tab>("about");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [about, setAbout] = useState<SiteAbout>({ ...DEFAULT_ABOUT });
  const [benefits, setBenefits] = useState<SiteBenefit[]>(
    DEFAULT_BENEFITS.map((b) => ({ ...b }))
  );
  const [testimonials, setTestimonials] = useState<SiteTestimonial[]>(
    DEFAULT_TESTIMONIALS.map((r) => ({ ...r }))
  );
  const [aboutErrors, setAboutErrors] = useState<
    Partial<Record<keyof SiteAbout, string>>
  >({});

  useEffect(() => {
    (async () => {
      try {
        const data =
          await fetchJson<AdminContentResponse>("/api/admin/content");
        if (data.about) setAbout({ ...DEFAULT_ABOUT, ...data.about });
        if (Array.isArray(data.benefits))
          setBenefits(data.benefits.map((b) => ({ ...b })));
        if (Array.isArray(data.testimonials))
          setTestimonials(data.testimonials.map((r) => ({ ...r })));
      } catch {
        toast.error("Не удалось загрузить тексты");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveAbout = async () => {
    const parsed = aboutSchema.safeParse(about);
    if (!parsed.success) {
      const errors: Partial<Record<keyof SiteAbout, string>> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as keyof SiteAbout;
        if (!errors[path]) errors[path] = issue.message;
      }
      setAboutErrors(errors);
      return;
    }
    await save({ type: "about", ...parsed.data });
  };

  const save = async (body: unknown) => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("save failed");
      toast.success("Текст сохранён");
    } catch {
      toast.error("Не удалось сохранить текст");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Загрузка текстов...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={tab === item.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setTab(item.id)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </div>

      {tab === "about" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveAbout();
          }}
          className="max-w-2xl space-y-6"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>Абзац 1</FieldLabel>
              <Textarea
                rows={3}
                value={about.p1}
                onChange={(e) =>
                  setAbout((prev) => ({ ...prev, p1: e.target.value }))
                }
                aria-invalid={!!aboutErrors.p1}
              />
              {aboutErrors.p1 && <FieldError>{aboutErrors.p1}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>Абзац 2</FieldLabel>
              <Textarea
                rows={3}
                value={about.p2}
                onChange={(e) =>
                  setAbout((prev) => ({ ...prev, p2: e.target.value }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>Абзац 3</FieldLabel>
              <Textarea
                rows={3}
                value={about.p3}
                onChange={(e) =>
                  setAbout((prev) => ({ ...prev, p3: e.target.value }))
                }
              />
            </Field>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Сохранить «О компании»
            </Button>
          </FieldGroup>
        </form>
      )}

      {tab === "benefits" && (
        <div className="space-y-4">
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="rounded-xl border bg-card p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Преимущество {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setBenefits((prev) => prev.filter((_, i) => i !== index))
                    }
                    aria-label="Удалить преимущество"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={benefit.title}
                  onChange={(e) =>
                    setBenefits((prev) =>
                      prev.map((b, i) =>
                        i === index ? { ...b, title: e.target.value } : b
                      )
                    )
                  }
                  placeholder="Заголовок"
                />
                <Textarea
                  rows={2}
                  value={benefit.desc}
                  onChange={(e) =>
                    setBenefits((prev) =>
                      prev.map((b, i) =>
                        i === index ? { ...b, desc: e.target.value } : b
                      )
                    )
                  }
                  placeholder="Описание"
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setBenefits((prev) => [...prev, { title: "", desc: "" }])
            }
          >
            <Plus className="h-4 w-4" />
            Добавить преимущество
          </Button>
          <div>
            <Button
              onClick={() => save({ type: "benefits", items: benefits })}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Сохранить преимущества
            </Button>
          </div>
        </div>
      )}

      {tab === "testimonials" && (
        <div className="space-y-4">
          <div className="space-y-3">
            {testimonials.map((review, index) => (
              <div
                key={index}
                className="rounded-xl border bg-card p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Отзыв {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setTestimonials((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                    aria-label="Удалить отзыв"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    value={review.name}
                    onChange={(e) =>
                      setTestimonials((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, name: e.target.value } : r
                        )
                      )
                    }
                    placeholder="Имя"
                  />
                  <Input
                    value={review.location}
                    onChange={(e) =>
                      setTestimonials((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, location: e.target.value } : r
                        )
                      )
                    }
                    placeholder="Район"
                  />
                </div>
                <Textarea
                  rows={3}
                  value={review.text}
                  onChange={(e) =>
                    setTestimonials((prev) =>
                      prev.map((r, i) =>
                        i === index ? { ...r, text: e.target.value } : r
                      )
                    )
                  }
                  placeholder="Текст отзыва"
                />
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-400" />
                  <Select
                    value={String(review.rating)}
                    onValueChange={(value) =>
                      setTestimonials((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, rating: Number(value) } : r
                        )
                      )
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Рейтинг" />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <SelectItem key={rating} value={String(rating)}>
                          {rating} / 5
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setTestimonials((prev) => [
                ...prev,
                { name: "", location: "", text: "", rating: 5 },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            Добавить отзыв
          </Button>
          <div>
            <Button
              onClick={() =>
                save({ type: "testimonials", items: testimonials })
              }
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Сохранить отзывы
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
