"use client";

import React from "react";
import Link from "next/link";
import { Clock, MapPin, ShoppingBasket } from "lucide-react";
import type { GroceryStore } from "@/lib/types/grocery";

interface GroceryStoreCardProps {
  store: GroceryStore;
}

export default function GroceryStoreCard({ store }: GroceryStoreCardProps) {
  return (
    <Link href={`/store/${store.slug}`}>
      <div className="group bg-white dark:bg-[#2D2A26] rounded-2xl overflow-hidden border border-[#F5F3F0] dark:border-[#3D3A36] card-hover transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/30 flex items-center justify-center">
          <ShoppingBasket className="w-16 h-16 text-emerald-600/40 dark:text-emerald-400/40" />
        </div>
        <div className="p-4">
          <h4 className="font-display font-semibold text-lg mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {store.name}
          </h4>
          {store.description && (
            <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 mb-3 line-clamp-2">
              {store.description}
            </p>
          )}
          <div className="flex items-center justify-between text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">{store.address}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <Clock className="w-4 h-4" />
              <span>
                {store.delivery_time_min}-{store.delivery_time_max} мин
              </span>
            </div>
          </div>
          <p className="text-xs text-[#2D2A26]/50 dark:text-[#E8E6E3]/50 mt-2">
            Доставка от {store.delivery_price} ₽ · мин. заказ {store.min_order_amount} ₽
          </p>
        </div>
      </div>
    </Link>
  );
}
