import { checkIsAdmin } from "@/lib/auth/check-role";

/**
 * Единственный UUID аккаунта с доступом к /admin.
 * Задаётся через ADMIN_USER_ID (серверная переменная, не NEXT_PUBLIC_*).
 */
export function getDesignatedAdminUserId(): string | null {
  const id = process.env.ADMIN_USER_ID?.trim();
  return id || null;
}

export function isDesignatedAdmin(userId: string): boolean {
  const designated = getDesignatedAdminUserId();
  if (!designated) return false;
  return userId === designated;
}

/**
 * Доступ к админ-панели: роль admin в БД + совпадение с ADMIN_USER_ID.
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  if (!isDesignatedAdmin(userId)) return false;
  return checkIsAdmin(userId);
}
