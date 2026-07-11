import { createClient } from "@/lib/supabase/server";
import { APP_CITY } from "@/lib/config";
import type { GroceryStore, GroceryCategory, Product, FoodCategoryGroup } from "@/lib/types/grocery";

export async function fetchGroceryStoresServer(city = APP_CITY): Promise<GroceryStore[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grocery_stores")
    .select("*")
    .eq("is_active", true)
    .eq("city", city)
    .order("sort_order", { ascending: true });

  if (error) {
    if (error.code === "42P01") return [];
    console.error("fetchGroceryStoresServer:", error);
    return [];
  }
  return (data || []) as GroceryStore[];
}

export async function fetchFoodCategoryGroupsServer(city = APP_CITY): Promise<FoodCategoryGroup[]> {
  const supabase = await createClient();

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id")
    .eq("is_active", true)
    .eq("city", city);

  if (!restaurants?.length) return [];

  const restaurantIds = restaurants.map((r) => r.id as string);
  const { data: categories, error } = await supabase
    .from("categories")
    .select("name, restaurant_id")
    .in("restaurant_id", restaurantIds)
    .eq("is_active", true)
    .order("name");

  if (error || !categories?.length) return [];

  const map = new Map<string, Set<string>>();
  for (const cat of categories) {
    const name = cat.name as string;
    if (!map.has(name)) map.set(name, new Set());
    map.get(name)!.add(cat.restaurant_id as string);
  }

  return Array.from(map.entries()).map(([name, ids]) => ({
    name,
    restaurantIds: Array.from(ids),
  }));
}

export async function fetchGroceryStoreBySlugServer(slug: string): Promise<GroceryStore | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grocery_stores")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as GroceryStore;
}

export async function fetchGroceryCategoriesServer(storeId: string): Promise<GroceryCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grocery_categories")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data || []) as GroceryCategory[];
}

export async function fetchStoreProductsServer(
  storeId: string,
  categoryId?: string
): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .gt("stock", 0)
    .order("sort_order", { ascending: true });

  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query;
  if (error) return [];
  return (data || []) as Product[];
}

export async function fetchGroceryCategoryNamesServer(city = APP_CITY): Promise<string[]> {
  const stores = await fetchGroceryStoresServer(city);
  if (!stores.length) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grocery_categories")
    .select("name")
    .in(
      "store_id",
      stores.map((s) => s.id)
    )
    .eq("is_active", true)
    .order("name");

  if (error) return [];
  const names = new Set<string>();
  for (const row of data || []) names.add(row.name as string);
  return Array.from(names);
}
