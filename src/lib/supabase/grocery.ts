import { supabase } from "@/lib/supabase";
import { APP_CITY } from "@/lib/config";
import type { GroceryStore, GroceryCategory, Product } from "@/lib/types/grocery";

export async function fetchGroceryStores(city = APP_CITY): Promise<GroceryStore[]> {
  const { data, error } = await supabase
    .from("grocery_stores")
    .select("*")
    .eq("is_active", true)
    .eq("city", city)
    .order("sort_order", { ascending: true });

  if (error) {
    if (error.code === "42P01") return [];
    console.error("fetchGroceryStores:", error);
    return [];
  }
  return (data || []) as GroceryStore[];
}

export async function fetchGroceryStoreBySlug(slug: string): Promise<GroceryStore | null> {
  const { data, error } = await supabase
    .from("grocery_stores")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as GroceryStore;
}

export async function fetchGroceryCategories(storeId: string): Promise<GroceryCategory[]> {
  const { data, error } = await supabase
    .from("grocery_categories")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data || []) as GroceryCategory[];
}

export async function fetchStoreProducts(
  storeId: string,
  categoryId?: string
): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .gt("stock", 0)
    .order("sort_order", { ascending: true });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data || []) as Product[];
}

export async function fetchGroceryCategoryNames(city = APP_CITY): Promise<string[]> {
  const stores = await fetchGroceryStores(city);
  if (!stores.length) return [];

  const storeIds = stores.map((s) => s.id);
  const { data, error } = await supabase
    .from("grocery_categories")
    .select("name")
    .in("store_id", storeIds)
    .eq("is_active", true)
    .order("name");

  if (error) return [];
  const names = new Set<string>();
  for (const row of data || []) {
    names.add(row.name as string);
  }
  return Array.from(names);
}

export async function fetchProductsByCategoryName(
  categoryName: string,
  city = APP_CITY,
  limit = 12
): Promise<(Product & { store?: GroceryStore })[]> {
  const stores = await fetchGroceryStores(city);
  if (!stores.length) return [];

  const storeMap = new Map(stores.map((s) => [s.id, s]));
  const storeIds = stores.map((s) => s.id);

  const { data: cats } = await supabase
    .from("grocery_categories")
    .select("id, store_id")
    .in("store_id", storeIds)
    .eq("name", categoryName)
    .eq("is_active", true);

  if (!cats?.length) return [];

  const categoryIds = cats.map((c) => c.id as string);
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .in("category_id", categoryIds)
    .eq("is_active", true)
    .gt("stock", 0)
    .limit(limit);

  if (error) return [];

  return (products || []).map((p) => ({
    ...(p as Product),
    store: storeMap.get(p.store_id as string),
  }));
}
