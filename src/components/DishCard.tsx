"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Check } from "lucide-react";
import { MenuItem, Restaurant } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getDishEmoji, getDishPlaceholderStyle } from "@/lib/images";

interface DishCardProps {
  dish: MenuItem;
  restaurant?: {
    id: string;
    name: string;
    delivery_price?: number | null;
  };
}

const DishCard: React.FC<DishCardProps> = ({ dish, restaurant }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);

  const hasImage = dish.image_url && dish.image_url.startsWith('http');

  const handleAddToCart = () => {
    // Require authentication before adding to cart
    if (!user) {
      // Could show a toast or redirect to auth
      window.location.href = '/auth';
      return;
    }
    setIsAdding(true);
    addToCart({
      id: dish.id,
      name: dish.name,
      description: dish.description || "",
      price: dish.price,
      image: dish.image_url || undefined,
    }, {
      id: restaurant?.id || "",
      name: restaurant?.name || "",
      delivery_price: restaurant?.delivery_price ?? 0,
    });
    setTimeout(() => setIsAdding(false), 400);
  };

  const emoji = getDishEmoji(dish.name);

  return (
    <div className="group bg-white dark:bg-[#2D2A26] rounded-2xl overflow-hidden border border-[#F5F3F0] dark:border-[#3D3A36] card-hover transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 dark:hover:shadow-primary-dark/10">
      <div className="relative aspect-[3/2] overflow-hidden">
        {hasImage ? (
          <Image
            src={dish.image_url!}
            alt={dish.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div 
            className="flex items-center justify-center w-full h-full bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20"
            style={getDishPlaceholderStyle(400)}
          >
            <span className="text-6xl">{emoji}</span>
          </div>
        )}
        {!dish.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold">Нет в наличии</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-display font-semibold text-base mb-1 group-hover:text-primary dark:group-hover:text-primary-dark transition-colors line-clamp-1">
          {dish.name}
        </h4>
        <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 mb-3 line-clamp-2">
          {dish.description || dish.weight}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#2D2A26] dark:text-[#E8E6E3]">
            {dish.price} ₽
          </span>
          <button
            onClick={handleAddToCart}
            disabled={!dish.is_available}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              isAdding
                ? "bg-green-500 text-white pulse-add"
                : dish.is_available
                ? "bg-primary dark:bg-primary-dark text-white hover:opacity-90"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isAdding ? (
              <>
                <Check className="w-4 h-4" />
                Добавлено
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />В корзину
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DishCard;