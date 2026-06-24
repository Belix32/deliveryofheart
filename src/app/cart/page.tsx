"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Minus, Plus, MapPin, ArrowLeft, CreditCard, Printer, ShoppingBag, Leaf } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Address, fetchAddresses } from "@/lib/supabase";

const CartPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, total, deliveryPrice, clearCart, restaurant } = useCart();
  const { user } = useAuth();
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [comment, setComment] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card_on_delivery">("cash");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    if (!user) return;
    
    const addrs = await fetchAddresses(user.id);
    setSavedAddresses(addrs);
    
    // Автозаполнение дефолтного адреса
    const defaultAddr = addrs.find(a => a.is_default);
    if (defaultAddr) {
      setAddress(defaultAddr.address_text);
    }
  };

  const handleOrder = async () => {
    if (!user) {
      window.location.href = "/auth?redirect=/cart";
      return;
    }

    if (!address) {
      setError("Пожалуйста, укажите адрес доставки");
      return;
    }

    if (!restaurant) {
      setError("Выберите ресторан");
      return;
    }

    setError(null);
    setIsOrdering(true);

    try {
      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          items: items.map((item) => ({
            menu_item_id: item.dish.id,
            quantity: item.quantity,
            price: item.dish.price,
          })),
          address_text: address,
          apartment,
          comment,
          coupon_code: couponCode || undefined,
          payment_method: paymentMethod,
          delivery_price: deliveryPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при создании заказа");
        setIsOrdering(false);
        return;
      }

      setOrderNumber(data.order.order_number);
      clearCart();
    } catch {
      setError("Произошла ошибка. Попробуйте ещё раз.");
      setIsOrdering(false);
    }
  };

  // Success screen
  if (orderNumber) {
    return (
      <div className="animate-fade-in px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-32 h-32 mb-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center animate-bounce">
          <Printer className="w-16 h-16 text-green-600" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2 text-center">Заказ оформлен! 🎉</h2>
        <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 mb-4 text-center">
          Спасибо за заказ! Готовим с любовью ❤️
        </p>
        <div className="bg-white dark:bg-[#2D2A26] rounded-2xl p-6 shadow-lg border border-[#F5F3F0] dark:border-[#3D3A36] mb-8">
          <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 mb-1">Номер заказа</p>
          <p className="text-4xl font-display font-bold text-primary dark:text-primary-dark">#{orderNumber}</p>
        </div>
        <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 mb-8 text-center">
          Статус заказа можно отслеживать в разделе «Профиль»
        </p>
        <Link
          href={`/order?number=${orderNumber}`}
          className="px-8 py-4 mb-3 bg-primary dark:bg-primary-dark text-white font-bold rounded-2xl hover:opacity-90 transition-all duration-300"
        >
          Отследить заказ
        </Link>
        <Link
          href="/"
          className="px-8 py-4 bg-[#F5F3F0] dark:bg-[#2D2A26] text-[#2D2A26] dark:text-[#E8E6E3] font-bold rounded-2xl hover:opacity-90 transition-all duration-300"
        >
          Вернуться на главную
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="animate-fade-in px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-32 h-32 mb-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary-dark/10 dark:to-primary-dark/5 flex items-center justify-center">
          <ShoppingBag className="w-16 h-16 text-primary/40" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">
          Корзина пуста
        </h2>
        <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 text-center mb-8 max-w-xs">
          Добавьте вкусные блюда из ресторанов поблизости
        </p>
        <Link
          href="/"
          className="px-8 py-4 bg-primary dark:bg-primary-dark text-white font-bold rounded-2xl hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
        >
          Выбрать ресторан
        </Link>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  return (
    <div className="animate-fade-in px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link 
          href={restaurant ? `/restaurant/${restaurant.id}` : "/"} 
          className="p-2 rounded-full bg-[#F5F3F0] dark:bg-[#2D2A26] hover:bg-[#E8E6E3] dark:hover:bg-[#3D3A36] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold">Корзина</h1>
          <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
            {items.length} {items.length === 1 ? 'блюдо' : items.length < 5 ? 'блюда' : 'блюд'} на {formatPrice(total)}
          </p>
        </div>
      </div>

      {/* Restaurant Info Card */}
      {restaurant && (
        <div className="mb-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary-dark/10 dark:to-primary-dark/5 rounded-2xl border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 dark:bg-primary-dark/20 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-primary dark:text-primary-dark" />
            </div>
            <div>
              <p className="font-semibold">{restaurant.name}</p>
              <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                {restaurant.address}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dishes */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.dish.id} className="flex gap-4 bg-white dark:bg-[#2D2A26] rounded-2xl p-3 shadow-sm border border-[#F5F3F0] dark:border-[#3D3A36]">
            {item.dish.image ? (
              <div className="w-20 h-20 rounded-xl overflow-hidden relative flex-shrink-0">
                <Image src={item.dish.image} alt={item.dish.name} fill sizes="80px" className="object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 flex items-center justify-center flex-shrink-0">
                <Leaf className="w-8 h-8 text-primary/30" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{item.dish.name}</p>
              <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 mb-2">{formatPrice(item.dish.price)}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.dish.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="w-8 h-8 rounded-full bg-[#F5F3F0] dark:bg-[#3D3A36] flex items-center justify-center disabled:opacity-50 hover:bg-[#E8E6E3] dark:hover:bg-[#4D4A46] transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.dish.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-[#F5F3F0] dark:bg-[#3D3A36] flex items-center justify-center hover:bg-[#E8E6E3] dark:hover:bg-[#4D4A46] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between">
              <button
                onClick={() => removeFromCart(item.dish.id)}
                className="p-2 text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <p className="font-bold text-lg">{formatPrice(item.dish.price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Address */}
      <div className="mb-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Куда доставить?
        </h2>
        
        {savedAddresses.length > 0 && (
          <div className="mb-3 space-y-2">
            {savedAddresses.map(addr => (
              <button
                key={addr.id}
                onClick={() => setAddress(addr.address_text)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  address === addr.address_text
                    ? "border-primary dark:border-primary-dark bg-primary/5 dark:bg-primary-dark/10"
                    : "border-[#F5F3F0] dark:border-[#3D3A36] bg-white dark:bg-[#2D2A26]"
                }`}
              >
                <p className="font-medium">{addr.address_text}</p>
                {addr.apartment && <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">кв. {addr.apartment}</p>}
              </button>
            ))}
          </div>
        )}
        
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Улица, дом, подъезд"
          className="w-full p-4 rounded-xl bg-white dark:bg-[#2D2A26] border-2 border-[#F5F3F0] dark:border-[#3D3A36] focus:border-primary dark:focus:border-primary-dark outline-none transition-colors"
        />
        
        <div className="flex gap-3 mt-3">
          <input
            type="text"
            value={apartment}
            onChange={(e) => setApartment(e.target.value)}
            placeholder="Квартира"
            className="flex-1 p-4 rounded-xl bg-white dark:bg-[#2D2A26] border-2 border-[#F5F3F0] dark:border-[#3D3A36] focus:border-primary dark:focus:border-primary-dark outline-none transition-colors"
          />
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Комментарий"
            className="flex-1 p-4 rounded-xl bg-white dark:bg-[#2D2A26] border-2 border-[#F5F3F0] dark:border-[#3D3A36] focus:border-primary dark:focus:border-primary-dark outline-none transition-colors"
          />
        </div>
      </div>

      {/* Coupon & payment */}
      <div className="mb-4">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="Промокод"
          className="w-full p-4 rounded-xl bg-white dark:bg-[#2D2A26] border-2 border-[#F5F3F0] dark:border-[#3D3A36] focus:border-primary outline-none uppercase"
        />
      </div>
      <div className="mb-6 flex gap-3">
        <button
          type="button"
          onClick={() => setPaymentMethod("cash")}
          className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium ${
            paymentMethod === "cash" ? "border-primary bg-primary/5" : "border-[#F5F3F0] dark:border-[#3D3A36]"
          }`}
        >
          Наличные
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod("card_on_delivery")}
          className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium ${
            paymentMethod === "card_on_delivery" ? "border-primary bg-primary/5" : "border-[#F5F3F0] dark:border-[#3D3A36]"
          }`}
        >
          Картой курьеру
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
          {error}
        </div>
      )}

{/* Order Summary */}
      <div className="bg-white dark:bg-[#2D2A26] rounded-2xl p-4 shadow-sm border border-[#F5F3F0] dark:border-[#3D3A36] mb-4">
        <div className="flex justify-between items-center py-2">
          <span className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">Товары</span>
          <span className="font-medium">{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">Доставка</span>
          <span className={deliveryPrice > 0 ? "font-medium" : "text-green-600 font-semibold"}>
            {deliveryPrice > 0 ? formatPrice(deliveryPrice) : "Бесплатно"}
          </span>
        </div>
        <div className="flex justify-between items-center py-3 mt-2 border-t border-[#F5F3F0] dark:border-[#3D3A36]">
          <span className="text-lg font-bold">К оплате</span>
          <span className="text-xl font-bold text-primary dark:text-primary-dark">{formatPrice(total + deliveryPrice)}</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Order Button */}
      <button
        onClick={handleOrder}
        disabled={isOrdering}
        className="w-full py-4 bg-primary dark:bg-primary-dark text-white font-bold rounded-2xl hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
      >
        {isOrdering ? (
          <>
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Оформляем...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-6 h-6" />
            <span>Оформить заказ</span>
          </>
        )}
      </button>
      
      <p className="text-center text-xs text-[#2D2A26]/40 dark:text-[#E8E6E3]/40 mt-4">
        Нажимая кнопку, вы соглашаетесь с условиями использования
      </p>
    </div>
  );
};

export default CartPage;