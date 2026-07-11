export const ALLOWED_PAYMENT_METHODS = ["cash", "card_on_delivery"] as const;

export type PaymentMethod = (typeof ALLOWED_PAYMENT_METHODS)[number];

export function isAllowedPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    (ALLOWED_PAYMENT_METHODS as readonly string[]).includes(value)
  );
}

export function normalizePaymentMethod(value: unknown, fallback: PaymentMethod = "cash"): PaymentMethod {
  if (isAllowedPaymentMethod(value)) return value;
  return fallback;
}
