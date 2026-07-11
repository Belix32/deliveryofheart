import { createClient } from "@/lib/supabase/browser";

const supabase = createClient();
import type { Restaurant, Category, MenuItem, Order, Address } from "@/lib/types";
import { APP_CITY } from "@/lib/config";

export async function fetchRestaurants(city = APP_CITY): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("is_active", true)
    .eq("city", city)
    .order("rating", { ascending: false });

  if (error) {
    console.error("Error fetching restaurants:", error);
    return [];
  }
  return (data || []) as Restaurant[];
}

export async function fetchRestaurantById(restaurantId: string): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", restaurantId)
    .single();

  if (error) {
    console.error("Error fetching restaurant:", error);
    return null;
  }
  return data as Restaurant;
}

export async function fetchCategories(restaurantId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  return (data || []) as Category[];
}

export async function fetchMenuItems(categoryId: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_available", true)
    .order("sort_order");

  if (error) {
    console.error("Error fetching menu items:", error);
    return [];
  }
  return (data || []) as MenuItem[];
}

export async function fetchRestaurantMenu(restaurantId: string): Promise<MenuItem[]> {
  const categories = await fetchCategories(restaurantId);
  if (categories.length === 0) return [];

  const menuItemsArrays = await Promise.all(
    categories.map((category) => fetchMenuItems(category.id))
  );
  return menuItemsArrays.flat();
}

export async function fetchUser(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }
  return data;
}

export async function fetchAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching addresses:", error);
    return [];
  }
  return (data || []) as Address[];
}

export async function addAddress(addressData: {
  user_id: string;
  address_text: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  comment?: string;
  is_default?: boolean;
}) {
  const { data, error } = await supabase
    .from("addresses")
    .insert(addressData)
    .select()
    .single();

  if (error) {
    console.error("Error adding address:", error);
    return null;
  }
  return data;
}

export async function fetchUserOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
  return (data || []) as Order[];
}

export async function toggleFavorite(userId: string, restaurantId: string) {
  const { data: existing } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", userId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("restaurant_id", restaurantId);
    return false;
  }

  await supabase.from("favorites").insert({ user_id: userId, restaurant_id: restaurantId });
  return true;
}

export async function fetchFavorites(userId: string) {
  const { data, error } = await supabase
    .from("favorites")
    .select("restaurants (*)")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
  return data?.map((f) => f.restaurants).flat() || [];
}

export function subscribeToOrder(orderId: string, callback: (payload: unknown) => void) {
  return supabase
    .channel(`order-${orderId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      },
      callback
    )
    .subscribe();
}

/** Coupons are validated server-side at checkout; clients cannot read coupon rows. */
export async function validateCoupon(_code: string, _orderTotal: number) {
  return {
    valid: false as const,
    error: "Промокод проверяется при оформлении заказа",
  };
}
