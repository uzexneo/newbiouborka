"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Lock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";

const loginSchema = z.object({
  password: z.string().min(1, "Введите пароль").max(200),
});

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const parsed = loginSchema.safeParse({ password });
    if (!parsed.success) {
      setError("Введите пароль");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.status === 401) {
        setError("Неверный пароль");
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setError(undefined);
      toast.success("Вы вошли в панель управления");
      router.refresh();
    } catch {
      toast.error("Не удалось войти. Попробуйте ещё раз.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg">Панель управления</CardTitle>
          <CardDescription>
            Введите пароль администратора для входа
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel>Пароль</FieldLabel>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(undefined);
                  }}
                  aria-invalid={!!error}
                />
                {error && <FieldError>{error}</FieldError>}
              </Field>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Входим..."
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Войти
                  </>
                )}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
