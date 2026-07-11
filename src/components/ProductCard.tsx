"use client";

import React, { useState } from "react";
import { Plus, Check, Minus } from "lucide-react";
import type { GroceryStore, Product } from "@/lib/types/grocery";
import { useGroceryCart } from "@/context/GroceryCartContext";
import { useAuth } from "@/context/AuthContext";

interface ProductCardProps {
  product: Product;
  store: GroceryStore;
  compact?: boolean;
}

export default function ProductCard({ product, store, compact }: ProductCardProps) {
  const { addToCart, items, updateQuantity } = useGroceryCart();
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);

  const cartItem = items.find((i) => i.product.id === product.id);
  const inCart = Boolean(cartItem);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(price);

  const handleAdd = () => {
    if (!user) {
      window.location.href = "/auth?redirect=" + encodeURIComponent(window.location.pathname);
      return;
    }
    setIsAdding(true);
    addToCart(product, store);
    setTimeout(() => setIsAdding(false), 400);
  };

  const step = product.quantity_step;
  const changeQty = (delta: number) => {
    if (!cartItem) return;
    updateQuantity(product.id, cartItem.quantity + delta * step);
  };

  return (
    <div
      className={`group bg-white dark:bg-[#2D2A26] rounded-2xl border border-[#F5F3F0] dark:border-[#3D3A36] transition-all hover:shadow-md ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex gap-3">
        <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0 text-2xl">
          🛒
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm md:text-base line-clamp-2">{product.name}</h4>
          {product.weight_label && (
            <p className="text-xs text-[#2D2A26]/50 dark:text-[#E8E6E3]/50">{product.weight_label}</p>
          )}
          <div className="flex items-center justify-between mt-2 gap-2">
            <div>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {formatPrice(product.price)} ₽
              </span>
              <span className="text-xs text-[#2D2A26]/50 ml-1">/ {product.unit}</span>
            </div>

            {inCart && cartItem ? (
              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => changeQty(-1)}
                  className="p-1.5 rounded-lg hover:bg-white/50"
                  aria-label="Уменьшить"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold min-w-[3rem] text-center">
                  {cartItem.quantity} {product.unit}
                </span>
                <button
                  type="button"
                  onClick={() => changeQty(1)}
                  className="p-1.5 rounded-lg hover:bg-white/50"
                  aria-label="Увеличить"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                disabled={product.stock <= 0}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isAdding
                    ? "bg-green-500 text-white"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {isAdding ? (
                  <>
                    <Check className="w-4 h-4" /> OK
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> В корзину
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
