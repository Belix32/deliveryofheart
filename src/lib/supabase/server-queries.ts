import { createClient } from "@/lib/supabase/server";
import { APP_CITY } from "@/lib/config";
import type { Restaurant } from "@/lib/types";

export async function fetchRestaurantsServer(city = APP_CITY): Promise<Restaurant[]> {
  const supabase = await createClient();
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

export async function fetchRestaurantByIdServer(id: string): Promise<Restaurant | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Restaurant;
}
