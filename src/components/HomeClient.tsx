"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, ArrowRight, UtensilsCrossed, ShoppingBasket } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import type { GroceryStore } from "@/lib/types/grocery";
import type { FoodCategoryGroup } from "@/lib/types/grocery";
import RestaurantCard from "@/components/RestaurantCard";
import GroceryStoreCard from "@/components/GroceryStoreCard";
import ProductCard from "@/components/ProductCard";
import { fetchProductsByCategoryName } from "@/lib/supabase/grocery";
import type { Product } from "@/lib/types/grocery";

type HomeTab = "food" | "grocery";

interface HomeClientProps {
  initialRestaurants: Restaurant[];
  initialGroceryStores: GroceryStore[];
  foodCategories: FoodCategoryGroup[];
  groceryCategoryNames: string[];
  city: string;
}

function HomeClientInner({
  initialRestaurants,
  initialGroceryStores,
  foodCategories,
  groceryCategoryNames,
  city,
}: HomeClientProps) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<HomeTab>("food");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<string | null>(null);
  const [selectedGroceryCategory, setSelectedGroceryCategory] = useState<string | null>(
    groceryCategoryNames[0] ?? null
  );
  const [groceryProducts, setGroceryProducts] = useState<
    (Product & { store?: GroceryStore })[]
  >([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const restaurants = initialRestaurants;

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (!selectedFoodCategory) return true;

    const group = foodCategories.find((c) => c.name === selectedFoodCategory);
    return group?.restaurantIds.includes(r.id) ?? true;
  });

  const filteredStores = initialGroceryStores.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (searchParams.get("tab") === "grocery") {
      setTab("grocery");
    }
  }, [searchParams]);

  useEffect(() => {
    if (tab !== "grocery" || !selectedGroceryCategory) {
      setGroceryProducts([]);
      return;
    }

    let cancelled = false;
    setLoadingProducts(true);
    fetchProductsByCategoryName(selectedGroceryCategory, city, 12).then((data) => {
      if (!cancelled) {
        setGroceryProducts(data);
        setLoadingProducts(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [tab, selectedGroceryCategory, city]);

  const placeholder =
    tab === "food" ? "Ресторан или блюдо..." : "Магазин или продукт...";

  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFF9F5] dark:from-[#1A1918] to-transparent z-10" />
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 py-8 md:py-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3 leading-tight">
            Доставка с <span className="text-primary dark:text-primary-dark">душой</span>
          </h2>
          <p className="text-[#2D2A26]/70 dark:text-[#E8E6E3]/70 mb-6">
            Еда из ресторанов и продукты из магазинов — {city}
          </p>

          <div className="flex gap-2 p-1 bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl mb-6 max-w-md">
            <button
              type="button"
              onClick={() => setTab("food")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                tab === "food"
                  ? "bg-white dark:bg-[#1A1918] text-primary dark:text-primary-dark shadow-sm"
                  : "text-[#2D2A26]/60 dark:text-[#E8E6E3]/60"
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              Еда
            </button>
            <button
              type="button"
              onClick={() => setTab("grocery")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                tab === "grocery"
                  ? "bg-white dark:bg-[#1A1918] text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-[#2D2A26]/60 dark:text-[#E8E6E3]/60"
              }`}
            >
              <ShoppingBasket className="w-4 h-4" />
              Продукты
            </button>
          </div>

          <div className="flex gap-2 max-w-xl">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D2A26]/40" />
              <input
                type="text"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-[#2D2A26] border border-[#F5F3F0] dark:border-[#3D3A36] focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {tab === "food" ? (
        <>
          {foodCategories.length > 0 && (
            <section className="py-4 px-4">
              <div className="max-w-7xl mx-auto">
                <h3 className="text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 mb-3">
                  Категории меню
                </h3>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedFoodCategory(null)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      !selectedFoodCategory
                        ? "bg-primary text-white"
                        : "bg-[#F5F3F0] dark:bg-[#2D2A26]"
                    }`}
                  >
                    Все
                  </button>
                  {foodCategories.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setSelectedFoodCategory(cat.name)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedFoodCategory === cat.name
                          ? "bg-primary text-white"
                          : "bg-[#F5F3F0] dark:bg-[#2D2A26]"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="py-4 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">Рестораны</h3>
                <Link
                  href="/catalog"
                  className="flex items-center gap-1 text-primary text-sm font-medium"
                >
                  Все <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {filteredRestaurants.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border border-dashed">
                  <p className="text-[#2D2A26]/60">
                    {restaurants.length === 0
                      ? `Нет ресторанов в ${city}. Запустите seed.mjs`
                      : "Ничего не найдено"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRestaurants.slice(0, 9).map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          {groceryCategoryNames.length > 0 && (
            <section className="py-4 px-4">
              <div className="max-w-7xl mx-auto">
                <h3 className="text-sm font-medium text-[#2D2A26]/60 mb-3">
                  Категории продуктов
                </h3>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                  {groceryCategoryNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedGroceryCategory(name)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedGroceryCategory === name
                          ? "bg-emerald-600 text-white"
                          : "bg-[#F5F3F0] dark:bg-[#2D2A26]"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {selectedGroceryCategory && (
            <section className="py-4 px-4">
              <div className="max-w-7xl mx-auto">
                <h3 className="text-lg font-display font-semibold mb-4">{selectedGroceryCategory}</h3>
                {loadingProducts ? (
                  <div className="flex justify-center py-8">
                    <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : groceryProducts.length === 0 ? (
                  <p className="text-sm text-[#2D2A26]/60">Товаров в этой категории пока нет</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {groceryProducts.map((p) =>
                      p.store ? (
                        <ProductCard key={p.id} product={p} store={p.store} compact />
                      ) : null
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="py-4 px-4">
            <div className="max-w-7xl mx-auto">
              <h3 className="text-lg font-display font-semibold mb-4">Магазины</h3>
              {initialGroceryStores.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10">
                  <ShoppingBasket className="w-12 h-12 mx-auto mb-3 text-emerald-600/40" />
                  <p className="font-medium mb-1">Продуктовый раздел</p>
                  <p className="text-sm text-[#2D2A26]/60 max-w-md mx-auto">
                    Примените миграцию{" "}
                    <code className="text-xs bg-black/5 px-1 rounded">
                      20260624000000_grocery_system.sql
                    </code>{" "}
                    в Supabase SQL Editor
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStores.map((s) => (
                    <GroceryStoreCard key={s.id} store={s} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function HomeClient(props: HomeClientProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center">Загрузка...</div>}>
      <HomeClientInner {...props} />
    </Suspense>
  );
}
