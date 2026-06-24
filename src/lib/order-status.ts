export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Новый",
  confirmed: "Подтверждён",
  preparing: "Готовится",
  ready: "Готов",
  waiting_courier: "Ждёт курьера",
  in_delivery: "В доставке",
  delivering: "В доставке",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export function getStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] || status;
}
