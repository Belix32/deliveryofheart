"use client";

import React, { useState, useMemo } from "react";
import type { GroceryStore, GroceryCategory, Product } from "@/lib/types/grocery";
import ProductCard from "@/components/ProductCard";

interface StoreClientProps {
  store: GroceryStore;
  categories: GroceryCategory[];
  products: Product[];
}

export default function StoreClient({ store, categories, products }: StoreClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id ?? null
  );

  const filtered = useMemo(() => {
    if (!activeCategory) return products;
    return products.filter((p) => p.category_id === activeCategory);
  }, [products, activeCategory]);

  return (
    <div>
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 pb-1">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${
              !activeCategory ? "bg-emerald-600 text-white" : "bg-[#F5F3F0] dark:bg-[#2D2A26]"
            }`}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${
                activeCategory === cat.id
                  ? "bg-emerald-600 text-white"
                  : "bg-[#F5F3F0] dark:bg-[#2D2A26]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-[#2D2A26]/60">В этой категории пока нет товаров</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} store={store} />
          ))}
        </div>
      )}
    </div>
  );
}
