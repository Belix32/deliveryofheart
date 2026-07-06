"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Trash2, Minus, Plus, MapPin, ArrowLeft, ShoppingBasket } from "lucide-react";
import { useGroceryCart } from "@/context/GroceryCartContext";
import { useAuth } from "@/context/AuthContext";
import { Address, fetchAddresses } from "@/lib/supabase";

function GroceryCartContent() {
  const { items, updateQuantity, removeFromCart, total, deliveryPrice, clearCart, store } =
    useGroceryCart();
  const { user } = useAuth();
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [comment, setComment] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card_on_delivery">("cash");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAddresses(user.id).then((addrs) => {
        const defaultAddr = addrs.find((a) => a.is_default);
        if (defaultAddr) setAddress(defaultAddr.address_text);
      });
    }
  }, [user]);

  const finalTotal = total + deliveryPrice;

  const handleOrder = async () => {
    if (!user) {
      window.location.href = "/auth?redirect=/grocery/cart";
      return;
    }
    if (!address.trim()) {
      setError("Укажите адрес доставки");
      return;
    }
    if (!store) {
      setError("Корзина пуста");
      return;
    }

    setError(null);
    setIsOrdering(true);

    try {
      const res = await fetch("/api/orders/grocery/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: store.id,
          items: items.map((i) => ({
            product_id: i.product.id,
            quantity: i.quantity,
            price: i.product.price,
          })),
          address_text: address,
          apartment,
          comment,
          coupon_code: couponCode || undefined,
          payment_method: paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка оформления");
        setIsOrdering(false);
        return;
      }

      setOrderNumber(data.order.order_number);
      clearCart();
    } catch {
      setError("Ошибка сети. Попробуйте снова.");
      setIsOrdering(false);
    }
  };

  if (orderNumber) {
    return (
      <div className="px-4 py-12 text-center max-w-lg mx-auto">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <ShoppingBasket className="w-12 h-12 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Заказ продуктов оформлен</h2>
        <p className="text-3xl font-bold text-emerald-600 mb-6">#{orderNumber}</p>
        <Link href="/profile" className="text-primary font-medium">
          Смотреть в профиле →
        </Link>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="px-4 py-16 text-center">
        <ShoppingBasket className="w-16 h-16 mx-auto mb-4 text-[#2D2A26]/20" />
        <h2 className="text-xl font-semibold mb-2">Корзина пуста</h2>
        <Link href="/" className="text-emerald-600 font-medium">
          Перейти к продуктам
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#2D2A26]/60 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Продолжить покупки
      </Link>

      <h1 className="text-2xl font-display font-bold mb-1">Корзина продуктов</h1>
      {store && <p className="text-sm text-[#2D2A26]/60 mb-6">{store.name}</p>}

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div
            key={item.product.id}
            className="flex gap-3 p-4 bg-white dark:bg-[#2D2A26] rounded-2xl border"
          >
            <div className="flex-1">
              <p className="font-medium">{item.product.name}</p>
              <p className="text-sm text-[#2D2A26]/60">
                {item.product.price} ₽ / {item.product.unit}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity - item.product.quantity_step)}>
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold min-w-[4rem] text-center">
                {item.quantity} {item.product.unit}
              </span>
              <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity + item.product.quantity_step)}>
                <Plus className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => removeFromCart(item.product.id)} className="ml-2 text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="w-4 h-4" />
          Адрес доставки
        </label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-[#2D2A26]"
          placeholder="Улица, дом"
        />
        <input
          value={apartment}
          onChange={(e) => setApartment(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-[#2D2A26]"
          placeholder="Квартира (необязательно)"
        />
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-[#2D2A26]"
          placeholder="Комментарий курьеру"
        />
        <input
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-[#2D2A26]"
          placeholder="Промокод (продукты)"
        />
      </div>

      <div className="bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl p-4 mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Товары</span>
          <span>{total.toFixed(2)} ₽</span>
        </div>
        <div className="flex justify-between">
          <span>Доставка</span>
          <span>{deliveryPrice} ₽</span>
        </div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Итого</span>
          <span>{finalTotal.toFixed(2)} ₽</span>
        </div>
        {store && total < store.min_order_amount && (
          <p className="text-amber-600 text-xs">
            Минимальный заказ: {store.min_order_amount} ₽
          </p>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}

      <button
        type="button"
        onClick={handleOrder}
        disabled={isOrdering || (store ? total < store.min_order_amount : false)}
        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 disabled:opacity-50"
      >
        {isOrdering ? "Оформляем..." : "Оформить заказ"}
      </button>
    </div>
  );
}

export default function GroceryCartPage() {
  return <GroceryCartContent />;
}
