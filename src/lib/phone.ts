import { formatPhoneE164 } from "@/lib/config";

/** Нормализует телефон к формату +7XXXXXXXXXX или возвращает null. */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const digits = input.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return formatPhoneE164(digits);
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}
