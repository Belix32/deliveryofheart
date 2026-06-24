import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkIsAdmin, checkIsCourier } from "@/lib/auth/check-role";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError("Требуется авторизация", 401);
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireSessionUser();
  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) {
    throw new AuthError("Доступ запрещён", 403);
  }
  return user;
}

export async function requireCourier() {
  const user = await requireSessionUser();
  const isCourier = await checkIsCourier(user.id);
  if (!isCourier) {
    throw new AuthError("Доступ запрещён", 403);
  }
  return user;
}

export async function getUserProfile(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}
