import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  fetchGroceryStoreBySlugServer,
  fetchGroceryCategoriesServer,
  fetchStoreProductsServer,
} from "@/lib/supabase/grocery-server";
import StoreClient from "@/components/StoreClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const store = await fetchGroceryStoreBySlugServer(slug);

  if (!store) notFound();

  const categories = await fetchGroceryCategoriesServer(store.id);
  const products = await fetchStoreProductsServer(store.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <Link
        href="/?tab=grocery"
        className="inline-flex items-center gap-2 text-sm text-[#2D2A26]/60 hover:text-[#2D2A26] mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        На главную
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold">{store.name}</h1>
        <p className="text-[#2D2A26]/60 mt-1">{store.address}</p>
        <p className="text-sm text-[#2D2A26]/50 mt-2">
          Доставка {store.delivery_price} ₽ · мин. заказ {store.min_order_amount} ₽ ·{" "}
          {store.delivery_time_min}–{store.delivery_time_max} мин
        </p>
      </div>

      <StoreClient store={store} categories={categories} products={products} />
    </div>
  );
}
