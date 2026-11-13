"use client";

import { useId, useState, type FormEvent } from "react";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { costPerRealInquiry, manualAdSpendSchema } from "@/lib/lead-cost";

export function AdminLeadCost({
  periodLabel,
  realInquiries,
}: {
  periodLabel: string;
  realInquiries: number;
}) {
  const inputId = useId();
  const [amount, setAmount] = useState("");
  const [spend, setSpend] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cost = spend === null ? null : costPerRealInquiry(spend, realInquiries);

  const calculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = manualAdSpendSchema.safeParse(amount);
    if (!parsed.success) {
      setSpend(null);
      setError("Введите сумму расходов в USD от 0 до 1 000 000 000.");
      return;
    }
    setError(null);
    setSpend(parsed.data);
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Calculator className="h-4 w-4 text-primary" />
          Расходы на реальное обращение
        </h3>
        <p className="text-sm text-muted-foreground">
          Период: {periodLabel}. Реальных обращений из Google Рекламы:{" "}
          <span className="font-semibold text-foreground">{realInquiries}</span>
          . Тестовые, спам, непроверенные и другие источники в расчёт не входят.
        </p>
        <form onSubmit={calculate} className="space-y-2">
          <Label htmlFor={inputId}>
            Расходы Google Ads за выбранный период, USD
          </Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id={inputId}
              inputMode="decimal"
              value={amount}
              placeholder="0,00"
              maxLength={40}
              className="max-w-xs"
              aria-invalid={Boolean(error)}
              aria-describedby={`${inputId}-help${error ? ` ${inputId}-error` : ""}`}
              onChange={(event) => {
                setAmount(event.target.value);
                setSpend(null);
                setError(null);
              }}
            />
            <Button type="submit">Рассчитать</Button>
          </div>
          {error && (
            <p
              id={`${inputId}-error`}
              role="alert"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </form>
        <div aria-live="polite">
          <p className="text-2xl font-bold">
            {cost === null
              ? "—"
              : new Intl.NumberFormat("ru-RU", {
                  style: "currency",
                  currency: "USD",
                }).format(cost)}
          </p>
          <p className="text-sm text-muted-foreground">
            Ориентировочные расходы на одно реальное обращение
          </p>
          {realInquiries === 0 && (
            <p className="text-xs text-muted-foreground">
              Нет обращений, отмеченных реальными и отнесённых к Google Рекламе;
              стоимость пока не рассчитывается.
            </p>
          )}
        </div>
        <p id={`${inputId}-help`} className="text-xs text-muted-foreground">
          Укажите фактические расходы всех ваших кампаний Google Ads за эти
          даты. Сумма вводится вручную, не сохраняется и сбрасывается при смене
          периода. Это сравнение расходов и обращений за период: обращение после
          клика может прийти позже. Расчёт не подтверждает конверсию Google Ads,
          уникального клиента, выполнение или оплату заказа.
        </p>
      </CardContent>
    </Card>
  );
}
