import { isValidBannerImageUrl, isValidBannerLinkUrl } from "@/lib/admin/banner-urls";
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
    .select("id, title, subtitle, image_url, link_url, sort_order, starts_at, ends_at")
    .eq("is_active", true)
    .or(`city.is.null,city.eq.${city}`)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching banners:", error);
    return [];
  }

  const nowMs = Date.now();
  return (data || []).filter((banner) => {
    const starts = banner.starts_at ? new Date(banner.starts_at as string).getTime() : 0;
    const ends = banner.ends_at ? new Date(banner.ends_at as string).getTime() : Infinity;
    if (!(starts <= nowMs && ends >= nowMs)) return false;
    return (
      isValidBannerImageUrl(banner.image_url as string) &&
      isValidBannerLinkUrl(banner.link_url as string | null)
    );
  }) as PublicBanner[];
}
