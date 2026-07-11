import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { APP_CITY } from "@/lib/config";
import type { Restaurant } from "@/lib/types";
import type { GroceryStore, FoodCategoryGroup } from "@/lib/types/grocery";
import type { PublicBanner } from "@/lib/supabase/banners-server";
import { isValidBannerImageUrl, isValidBannerLinkUrl } from "@/lib/admin/banner-urls";

const RESTAURANT_COLUMNS =
  "id, name, slug, description, logo_url, cover_url, address, phone, rating, review_count, delivery_time_min, delivery_time_max, delivery_price, min_order_amount, is_active, city";

const GROCERY_STORE_COLUMNS =
  "id, name, slug, address, logo_url, cover_url, rating, delivery_time_min, delivery_time_max, delivery_price, min_order_amount, is_active, city, sort_order";

export interface HomePageData {
  restaurants: Restaurant[];
  groceryStores: GroceryStore[];
  foodCategories: FoodCategoryGroup[];
  groceryCategoryNames: string[];
  banners: PublicBanner[];
}

async function fetchHomePageDataUncached(city: string): Promise<HomePageData> {
  const supabase = await createClient();

  const [restaurantsResult, groceryStoresResult, bannersResult] = await Promise.all([
    supabase
      .from("restaurants")
      .select(RESTAURANT_COLUMNS)
      .eq("is_active", true)
      .eq("city", city)
      .order("rating", { ascending: false }),
    supabase
      .from("grocery_stores")
      .select(GROCERY_STORE_COLUMNS)
      .eq("is_active", true)
      .eq("city", city)
      .order("sort_order", { ascending: true }),
    supabase
      .from("banners")
      .select("id, title, subtitle, image_url, link_url, sort_order, starts_at, ends_at, city")
      .eq("is_active", true)
      .or(`city.is.null,city.eq.${city}`)
      .order("sort_order", { ascending: true }),
  ]);

  const restaurants = (restaurantsResult.data || []) as Restaurant[];
  const groceryStores =
    groceryStoresResult.error?.code === "42P01"
      ? []
      : ((groceryStoresResult.data || []) as GroceryStore[]);

  const bannersRaw =
    bannersResult.error?.code === "42P01" ? [] : bannersResult.data || [];
  const nowMs = Date.now();
  const banners = bannersRaw.filter((b) => {
    const starts = b.starts_at ? new Date(b.starts_at as string).getTime() : 0;
    const ends = b.ends_at ? new Date(b.ends_at as string).getTime() : Infinity;
    if (!(starts <= nowMs && ends >= nowMs)) return false;
    return (
      isValidBannerImageUrl(b.image_url as string) &&
      isValidBannerLinkUrl(b.link_url as string | null)
    );
  }) as PublicBanner[];

  const restaurantIds = restaurants.map((r) => r.id);

  let foodCategories: FoodCategoryGroup[] = [];
  if (restaurantIds.length > 0) {
    const { data: categories } = await supabase
      .from("categories")
      .select("name, restaurant_id")
      .in("restaurant_id", restaurantIds)
      .eq("is_active", true)
      .order("name");

    if (categories?.length) {
      const map = new Map<string, Set<string>>();
      for (const cat of categories) {
        const name = cat.name as string;
        if (!map.has(name)) map.set(name, new Set());
        map.get(name)!.add(cat.restaurant_id as string);
      }
      foodCategories = Array.from(map.entries()).map(([name, ids]) => ({
        name,
        restaurantIds: Array.from(ids),
      }));
    }
  }

  let groceryCategoryNames: string[] = [];
  if (groceryStores.length > 0) {
    const { data: groceryCats } = await supabase
      .from("grocery_categories")
      .select("name")
      .in(
        "store_id",
        groceryStores.map((s) => s.id)
      )
      .eq("is_active", true)
      .order("name");

    if (groceryCats?.length) {
      const names = new Set<string>();
      for (const row of groceryCats) names.add(row.name as string);
      groceryCategoryNames = Array.from(names);
    }
  }

  return {
    restaurants,
    groceryStores,
    foodCategories,
    groceryCategoryNames,
    banners,
  };
}

export function fetchHomePageData(city = APP_CITY): Promise<HomePageData> {
  return unstable_cache(() => fetchHomePageDataUncached(city), ["home-page", city], {
    revalidate: 60,
    tags: [`home-${city}`],
  })();
}
