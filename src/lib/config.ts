export const APP_CITY = process.env.NEXT_PUBLIC_CITY || "Сураж";

export function formatPhoneE164(digits: string): string {
  let normalized = digits.replace(/\D/g, "");
  if (normalized.startsWith("8") && normalized.length >= 11) {
    normalized = "7" + normalized.slice(1);
  }
  if (normalized.startsWith("9") && normalized.length === 10) {
    normalized = "7" + normalized;
  }
  if (!normalized.startsWith("7") && normalized.length === 10) {
    normalized = "7" + normalized;
  }
  return `+${normalized}`;
}
