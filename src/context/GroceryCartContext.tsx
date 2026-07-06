"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { GroceryStore, GroceryCartItem, Product } from "@/lib/types/grocery";

interface GroceryCartContextType {
  items: GroceryCartItem[];
  store: GroceryStore | null;
  deliveryPrice: number;
  addToCart: (product: Product, store: GroceryStore, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const GroceryCartContext = createContext<GroceryCartContextType | undefined>(undefined);

function roundQuantity(qty: number, step: number): number {
  const rounded = Math.round(qty / step) * step;
  return Math.round(rounded * 1000) / 1000;
}

export const GroceryCartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<GroceryCartItem[]>([]);
  const [store, setStore] = useState<GroceryStore | null>(null);
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("grocery-cart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setItems(parsed.items || []);
        setStore(parsed.store || null);
        setDeliveryPrice(parsed.deliveryPrice || 0);
      } catch (e) {
        console.error("Error parsing grocery cart", e);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(
      "grocery-cart",
      JSON.stringify({ items, store, deliveryPrice })
    );
  }, [items, store, deliveryPrice, isHydrated]);

  const addToCart = (product: Product, groceryStore: GroceryStore, quantity?: number) => {
    if (store && store.id !== groceryStore.id) {
      const qty = quantity ?? product.min_quantity;
      setItems([{ product, quantity: roundQuantity(qty, product.quantity_step) }]);
      setStore(groceryStore);
      setDeliveryPrice(Number(groceryStore.delivery_price) || 0);
      return;
    }

    setStore(groceryStore);
    setDeliveryPrice(Number(groceryStore.delivery_price) || 0);

    const addQty = roundQuantity(quantity ?? product.min_quantity, product.quantity_step);

    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const next = roundQuantity(existing.quantity + addQty, product.quantity_step);
        const capped = product.max_quantity ? Math.min(next, product.max_quantity) : next;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: capped } : i
        );
      }
      return [...prev, { product, quantity: addQty }];
    });
  };

  const removeFromCart = (productId: string) => {
    const newItems = items.filter((i) => i.product.id !== productId);
    setItems(newItems);
    if (newItems.length === 0) {
      setStore(null);
      setDeliveryPrice(0);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const item = items.find((i) => i.product.id === productId);
    if (!item) return;

    const step = item.product.quantity_step;
    const min = item.product.min_quantity;

    if (quantity < min) {
      removeFromCart(productId);
      return;
    }

    let next = roundQuantity(quantity, step);
    if (item.product.max_quantity) {
      next = Math.min(next, item.product.max_quantity);
    }
    if (next > item.product.stock) {
      next = item.product.stock;
    }

    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: next } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setStore(null);
    setDeliveryPrice(0);
  };

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <GroceryCartContext.Provider
      value={{
        items,
        store,
        deliveryPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
      }}
    >
      {children}
    </GroceryCartContext.Provider>
  );
};

export const useGroceryCart = () => {
  const ctx = useContext(GroceryCartContext);
  if (!ctx) throw new Error("useGroceryCart must be used within GroceryCartProvider");
  return ctx;
};
