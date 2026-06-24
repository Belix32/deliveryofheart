import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/auth/check-role";

export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  const roles = await getUserRoles(user.id);

  if (!roles.includes("admin")) {
    redirect("/");
  }

  return user;
}

export async function requireCourier() {
  const user = await requireAuth();
  const roles = await getUserRoles(user.id);

  if (!roles.includes("courier")) {
    redirect("/");
  }

  return user;
}
