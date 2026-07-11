import { createClient } from "@/lib/supabase/browser";
import type {
  Restaurant,
  Category,
  MenuItem,
  Order,
  Address,
} from "@/lib/types";

export type { Restaurant, Category, MenuItem, Order, Address };

export const supabase = createClient();

export const fetchRestaurants = async (city?: string): Promise<Restaurant[]> => {
  let query = supabase
    .from("restaurants")
    .select("*")
    .eq("is_active", true)
    .order("rating", { ascending: false });

  if (city) {
    query = query.eq("city", city);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching restaurants:", error);
    return [];
  }
  return data || [];
};

export const fetchRestaurantById = async (restaurantId: string): Promise<Restaurant | null> => {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", restaurantId)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("Error fetching restaurant:", error);
    return null;
  }
  return data;
};

export const fetchCategories = async (restaurantId: string): Promise<Category[]> => {
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
  return data || [];
};

export const fetchMenuItems = async (categoryId: string): Promise<MenuItem[]> => {
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
  return data || [];
};

export const fetchRestaurantMenu = async (restaurantId: string): Promise<MenuItem[]> => {
  const categories = await fetchCategories(restaurantId);
  if (categories.length === 0) return [];

  const menuItemsArrays = await Promise.all(
    categories.map((category) => fetchMenuItems(category.id))
  );
  return menuItemsArrays.flat();
};

export const fetchUser = async (userId: string) => {
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
};

export const fetchAddresses = async (userId: string) => {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching addresses:", error);
    return [];
  }
  return data || [];
};

export const addAddress = async (addressData: {
  user_id: string;
  address_text: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  comment?: string;
  is_default?: boolean;
}) => {
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
};

export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
  return data || [];
};

export const fetchAllOrders = async () => {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      restaurants (name),
      users (full_name, phone)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
  return data || [];
};

export const toggleFavorite = async (userId: string, restaurantId: string) => {
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
};

export const fetchFavorites = async (userId: string) => {
  const { data, error } = await supabase
    .from("favorites")
    .select(`restaurants (*)`)
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
  return data?.map((f) => f.restaurants).flat() || [];
};

export const subscribeToOrder = (
  orderId: string,
  callback: (payload: { new: Order }) => void
) => {
  const channel = supabase
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

  return channel;
};
