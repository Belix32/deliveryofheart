"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import RestaurantCard from "@/components/RestaurantCard";

interface HomeClientProps {
  initialRestaurants: Restaurant[];
  city: string;
}

export default function HomeClient({ initialRestaurants, city }: HomeClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const restaurants = initialRestaurants;

  const categories = ["Завтраки", "Обеды", "Ужины", "Напитки", "Выпечка"];

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFF9F5] dark:from-[#1A1918] to-transparent z-10" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-20 md:opacity-100">
          <h1 className="text-[15vw] md:text-[12vw] font-display font-bold text-primary/10 dark:text-primary-dark/10 leading-none">
            ДУШИ
          </h1>
        </div>

        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 py-12">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6 leading-tight">
              Вкусная еда с{" "}
              <span className="text-primary dark:text-primary-dark">душой</span>
            </h2>
            <p className="text-lg text-[#2D2A26]/70 dark:text-[#E8E6E3]/70 mb-8">
              Заказывайте любимые блюда из лучших ресторанов города {city}
            </p>

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D2A26]/40 dark:text-[#E8E6E3]/40" />
                <input
                  type="text"
                  placeholder="Что хотите заказать?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-[#2D2A26] border border-[#F5F3F0] dark:border-[#3D3A36] focus:border-primary dark:focus:border-primary-dark focus:outline-none transition-colors text-base"
                />
              </div>
              <button className="px-6 py-4 bg-primary dark:bg-primary-dark text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-lg font-display font-semibold mb-4">Категории</h3>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            <button className="category-pill flex-shrink-0 px-5 py-2.5 rounded-full font-medium transition-all bg-primary text-white">
              Все
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className="category-pill flex-shrink-0 px-5 py-2.5 rounded-full font-medium transition-all bg-[#F5F3F0] dark:bg-[#2D2A26] text-[#2D2A26] dark:text-[#E8E6E3] hover:bg-[#E8E6E3] dark:hover:bg-[#3D3A36]"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-semibold">Популярные заведения</h3>
            <Link
              href="/catalog"
              className="flex items-center gap-1 text-primary dark:text-primary-dark text-sm font-medium hover:opacity-80"
            >
              Все <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {restaurants.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#2D2A26] rounded-2xl border border-[#F5F3F0] dark:border-[#3D3A36]">
              <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                Пока нет доступных ресторанов в {city}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRestaurants.slice(0, 6).map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-[#2D2A26] rounded-2xl p-6 border border-[#F5F3F0] dark:border-[#3D3A36]">
            <h3 className="text-lg font-display font-semibold mb-4">О сервисе</h3>
            <p className="text-[#2D2A26]/70 dark:text-[#E8E6E3]/70">
              «Доставка от души» — удобный сервис заказа еды из лучших ресторанов {city}.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary dark:text-primary-dark">
                  {restaurants.length}
                </p>
                <p className="text-sm text-[#2D2A26]/60">Ресторанов</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary dark:text-primary-dark">24/7</p>
                <p className="text-sm text-[#2D2A26]/60">Работаем</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary dark:text-primary-dark">{city}</p>
                <p className="text-sm text-[#2D2A26]/60">Город</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
