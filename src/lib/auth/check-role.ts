import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

/**
 * Проверить, является ли пользователь админом
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_roles")
      .select("*, roles(name)")
      .eq("user_id", userId)
      .eq("is_active", true);

    return data?.some((ur: { roles?: { name?: string } }) => ur.roles?.name === "admin") || false;
  } catch (error) {
    console.error("[auth] checkIsAdmin error:", error);
    return false;
  }
}

/**
 * Получить ID ресторана, которым владеет пользователь
 */
export async function getUserRestaurantId(userId: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const roleResult = await supabase
      .from("roles")
      .select("id")
      .eq("name", "restaurant_owner")
      .single();

    if (!roleResult.data) return null;

    const { data } = await supabase
      .from("user_roles")
      .select("restaurant_id")
      .eq("user_id", userId)
      .eq("role_id", roleResult.data.id)
      .eq("is_active", true)
      .not("restaurant_id", "is", null)
      .single();

    return data?.restaurant_id || null;
  } catch (error) {
    console.error("[auth] getUserRestaurantId error:", error);
    return null;
  }
}

/**
 * Проверить, является ли пользователь владельцем или админом ресторана
 */
export async function checkRestaurantAccess(
  userId: string,
  restaurantId: string
): Promise<{ isOwner: boolean; isAdmin: boolean; hasAccess: boolean }> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_roles")
      .select("*, roles(name)")
      .eq("user_id", userId)
      .eq("is_active", true)
      .eq("restaurant_id", restaurantId);

    const roles = data?.map((ur: { roles?: { name?: string } }) => ur.roles?.name) || [];
    const isOwner = roles.includes("restaurant_owner");
    const isAdmin = roles.includes("restaurant_admin");

    return {
      isOwner,
      isAdmin,
      hasAccess: isOwner || isAdmin,
    };
  } catch (error) {
    console.error("[auth] checkRestaurantAccess error:", error);
    return { isOwner: false, isAdmin: false, hasAccess: false };
  }
}

/**
 * Проверить, является ли пользователь курьером
 */
export async function checkIsCourier(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_roles")
      .select("*, roles(name)")
      .eq("user_id", userId)
      .eq("is_active", true);

    return data?.some((ur: { roles?: { name?: string } }) => ur.roles?.name === "courier") || false;
  } catch (error) {
    console.error("[auth] checkIsCourier error:", error);
    return false;
  }
}

/**
 * Получить все роли пользователя
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_roles")
      .select("*, roles(name)")
      .eq("user_id", userId)
      .eq("is_active", true);

    return data?.map((ur: { roles?: { name?: string } }) => ur.roles?.name).filter(Boolean) as string[] || [];
  } catch (error) {
    console.error("[auth] getUserRoles error:", error);
    return [];
  }
}

/**
 * Получить роли пользователя через переданный Supabase-клиент (для middleware)
 */
export async function getUserRolesWithClient(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string[]> {
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("*, roles(name)")
      .eq("user_id", userId)
      .eq("is_active", true);

    return data?.map((ur: { roles?: { name?: string } }) => ur.roles?.name).filter(Boolean) as string[] || [];
  } catch {
    return [];
  }
}

/**
 * Проверить доступ к разделу
 */
export async function checkAccess(
  userId: string,
  section: "admin" | "courier" | "restaurant",
  restaurantId?: string
): Promise<boolean> {
  const roles = await getUserRoles(userId);

  switch (section) {
    case "admin":
      return roles.includes("admin");
    case "courier":
      return roles.includes("courier");
    case "restaurant":
      if (!restaurantId) return false;
      const access = await checkRestaurantAccess(userId, restaurantId);
      return access.hasAccess;
    default:
      return false;
  }
}
