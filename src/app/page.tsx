import { fetchRestaurantsServer } from "@/lib/supabase/server-queries";
import {
  fetchGroceryStoresServer,
  fetchFoodCategoryGroupsServer,
  fetchGroceryCategoryNamesServer,
} from "@/lib/supabase/grocery-server";
import { fetchActiveBannersServer } from "@/lib/supabase/banners-server";
import { APP_CITY } from "@/lib/config";
import HomeClient from "@/components/HomeClient";
import HomeBanners from "@/components/HomeBanners";

export const revalidate = 60;

export default async function HomePage() {
  const [restaurants, groceryStores, foodCategories, groceryCategoryNames, banners] =
    await Promise.all([
      fetchRestaurantsServer(APP_CITY),
      fetchGroceryStoresServer(APP_CITY),
      fetchFoodCategoryGroupsServer(APP_CITY),
      fetchGroceryCategoryNamesServer(APP_CITY),
      fetchActiveBannersServer(APP_CITY),
    ]);

  return (
    <>
      <HomeBanners banners={banners} />
      <HomeClient
        initialRestaurants={restaurants}
        initialGroceryStores={groceryStores}
        foodCategories={foodCategories}
        groceryCategoryNames={groceryCategoryNames}
        city={APP_CITY}
      />
    </>
  );
}
