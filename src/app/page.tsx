import { fetchRestaurantsServer } from "@/lib/supabase/server-queries";
import { APP_CITY } from "@/lib/config";
import HomeClient from "@/components/HomeClient";

export const revalidate = 60;

export default async function HomePage() {
  const restaurants = await fetchRestaurantsServer(APP_CITY);
  return <HomeClient initialRestaurants={restaurants} city={APP_CITY} />;
}
