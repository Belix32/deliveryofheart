import { fetchHomePageData } from "@/lib/supabase/home-server";
import { APP_CITY } from "@/lib/config";
import HomeClient from "@/components/HomeClient";
import HomeBanners from "@/components/HomeBanners";

export const revalidate = 60;

export default async function HomePage() {
  const { restaurants, groceryStores, foodCategories, groceryCategoryNames, banners } =
    await fetchHomePageData(APP_CITY);

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
