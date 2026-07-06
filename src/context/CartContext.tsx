"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CartItem, Dish } from "@/types";

interface CartContextType {
  items: CartItem[];
  restaurant: any;
  deliveryPrice: number;
  addToCart: (dish: Dish, restaurant: any) => void;
  removeFromCart: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setItems(parsed.items || []);
        setRestaurant(parsed.restaurant || null);
        setDeliveryPrice(parsed.deliveryPrice || 0);
      } catch (e) {
        console.error("Error parsing cart", e);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("cart", JSON.stringify({ items, restaurant, deliveryPrice }));
  }, [items, restaurant, deliveryPrice, isHydrated]);

  const addToCart = (dish: Dish, rest: any) => {
    // Если ресторан другой, очищаем корзину
    if (restaurant && restaurant.id !== rest.id) {
      setItems([{ dish, quantity: 1 }]);
      setRestaurant(rest);
      setDeliveryPrice(rest.delivery_price || 0);
      return;
    }
    
    setRestaurant(rest);
    setDeliveryPrice(rest.delivery_price || 0);
    
    setItems((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { dish, quantity: 1 }];
    });
  };

  const removeFromCart = (dishId: string) => {
    const newItems = items.filter((item) => item.dish.id !== dishId);
    setItems(newItems);
    if (newItems.length === 0) {
      setRestaurant(null);
      setDeliveryPrice(0);
    }
  };

  const updateQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(dishId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.dish.id === dishId ? { ...item, quantity } : item,
      ),
    );
  };

  const clearCart = () => {
    setItems([]);
    setRestaurant(null);
    setDeliveryPrice(0);
  };

  const total = items.reduce(
    (sum, item) => sum + item.dish.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        restaurant,
        deliveryPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

// Re-export types
export type { CartItem, Dish } from "@/types";