import { createClient } from "@/lib/supabase/server";
import { APP_CITY } from "@/lib/config";

export interface PublicBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number | null;
}

export async function fetchActiveBannersServer(city = APP_CITY): Promise<PublicBanner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("banners")
    .select("id, title, subtitle, image_url, link_url, sort_order")
    .or(`city.is.null,city.eq.${city}`)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching banners:", error);
    return [];
  }

  return (data || []) as PublicBanner[];
}
