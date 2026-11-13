export const ORDER_STATUS_VALUES = [
  "application",
  "order",
  "completed",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export const ORDER_STATUS_OPTIONS = [
  { value: "application", label: "Заявка" },
  { value: "order", label: "Заказ" },
  { value: "completed", label: "Выполнен" },
] satisfies { value: OrderStatus; label: string }[];

export function orderStatusLabel(status: OrderStatus | undefined): string {
  return (
    ORDER_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    "Заявка"
  );
}
