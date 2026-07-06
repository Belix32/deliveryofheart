export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "waiting_courier",
  "in_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["waiting_courier", "cancelled"],
  waiting_courier: ["in_delivery", "cancelled"],
  in_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

/** Statuses a customer may cancel from */
export const CUSTOMER_CANCELLABLE: OrderStatus[] = ["pending", "confirmed"];

export function isValidOrderStatus(status: string): status is OrderStatus {
  return ORDER_STATUSES.includes(status as OrderStatus);
}

export function canTransitionOrderStatus(
  from: string,
  to: string,
  role: "customer" | "restaurant" | "admin" | "courier" = "restaurant"
): boolean {
  if (!isValidOrderStatus(to)) return false;
  if (from === to) return true;

  if (role === "customer") {
    return CUSTOMER_CANCELLABLE.includes(from as OrderStatus) && to === "cancelled";
  }

  if (role === "courier") {
    if (from === "waiting_courier" && to === "in_delivery") return true;
    if (from === "in_delivery" && to === "delivered") return true;
    return false;
  }

  const allowed = ORDER_TRANSITIONS[from as OrderStatus];
  return allowed?.includes(to as OrderStatus) ?? false;
}

/** Map legacy DB/UI status to canonical status */
export function normalizeOrderStatus(status: string): OrderStatus {
  if (status === "delivering") return "in_delivery";
  return isValidOrderStatus(status) ? status : (status as OrderStatus);
}
