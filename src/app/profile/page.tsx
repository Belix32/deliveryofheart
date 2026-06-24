"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Clock,
  MapPin,
  Heart,
  Settings,
  LogOut,
  Moon,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  Package,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase, fetchUserOrders, fetchAddresses, Order, Address } from "@/lib/supabase";
import OrderTracker from "@/components/OrderTracker";

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { user, authUser, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"orders" | "favorites" | "addresses" | "settings">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Гость");
  const [userPhone, setUserPhone] = useState<string>("");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [showTracker, setShowTracker] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    
    // Используем user из AuthContext
    if (user) {
      setUserId(user.id);
      setUserName(user.full_name || "Без имени");
      setUserPhone(user.phone || authUser?.email || "");
      
      // Загружаем заказы
      const userOrders = await fetchUserOrders(user.id);
      setOrders(userOrders);
      
      // Загружаем адреса
      const userAddresses = await fetchAddresses(user.id);
      setAddresses(userAddresses);
    } else {
      // Не авторизован - показываем пустой профиль гостя
      setUserId(null);
      setUserName("Гость");
      setUserPhone("");
      setOrders([]);
      setAddresses([]);
    }
    setLoading(false);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Новый",
      confirmed: "Подтверждён",
      preparing: "Готовится",
      ready: "Готов",
      delivering: "В пути",
      delivered: "Доставлен",
      cancelled: "Отменён",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-orange-100 text-orange-800",
      ready: "bg-green-100 text-green-800",
      delivering: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary dark:bg-primary-dark flex items-center justify-center">
          <User className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">{userName}</h1>
          <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
            {userPhone || (userId ? 'Зарегистрирован' : 'Гость')}
          </p>
          {!userId && (
            <Link 
              href="/auth" 
              className="mt-2 inline-block text-sm text-primary dark:text-primary-dark font-medium"
            >
              Войти или зарегистрироваться
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: "orders", label: "Заказы", icon: Clock },
          { key: "favorites", label: "Избранное", icon: Heart },
          { key: "addresses", label: "Адреса", icon: MapPin },
          { key: "settings", label: "Настройки", icon: Settings },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
              activeTab === key
                ? "bg-primary dark:bg-primary-dark text-white"
                : "bg-[#F5F3F0] dark:bg-[#2D2A26] text-[#2D2A26] dark:text-[#E8E6E3]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "orders" && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Мои заказы</h2>
          
          {/* Active Order Tracker */}
          {orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length > 0 && !showTracker && (
            <div className="mb-4 p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Активный заказ</p>
                    <p className="text-sm text-neutral-400">
                      {orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length} заказ(ов) в процессе
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const activeOrder = orders.find(o => !['delivered', 'cancelled'].includes(o.status));
                    if (activeOrder) {
                      setActiveOrderId(activeOrder.id);
                      setShowTracker(true);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
                >
                  Отследить
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Order Tracker Modal */}
          {showTracker && activeOrderId && (
            <div className="mb-4 p-4 rounded-2xl bg-[#1A1918] border border-[#2D2A26]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Отслеживание заказа</h3>
                <button
                  onClick={() => setShowTracker(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <OrderTracker orderId={activeOrderId} />
            </div>
          )}

          {orders.length === 0 ? (
            <div className="text-center py-12 bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl">
              <Clock className="w-12 h-12 mx-auto mb-4 text-[#2D2A26]/30 dark:text-[#E8E6E3]/30" />
              <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 mb-4">У вас пока нет заказов</p>
              <Link href="/" className="text-primary dark:text-primary-dark font-medium">
                Перейти к меню
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Заказ #{order.order_number}</p>
                      <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                        {formatDate(order.created_at ?? "")}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold">{formatPrice(order.final_amount ?? 0)}</p>
                    <Link
                      href={`/order/${order.id}`}
                      className="text-primary dark:text-primary-dark text-sm font-medium"
                    >
                      Подробнее
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "favorites" && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Избранное</h2>
          <div className="text-center py-12 bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl">
            <Heart className="w-12 h-12 mx-auto mb-4 text-[#2D2A26]/30 dark:text-[#E8E6E3]/30" />
            <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 mb-4">Нет избранных ресторанов</p>
            <Link href="/catalog" className="text-primary dark:text-primary-dark font-medium">
              Выбрать ресторан
            </Link>
          </div>
        </div>
      )}

      {activeTab === "addresses" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Мои адреса</h2>
            <button className="flex items-center gap-2 text-primary dark:text-primary-dark">
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          </div>
          
          {addresses.length === 0 ? (
            <div className="text-center py-12 bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-[#2D2A26]/30 dark:text-[#E8E6E3]/30" />
              <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 mb-4">Нет сохранённых адресов</p>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl p-4 flex justify-between items-start"
                >
                  <div>
                    <p className="font-medium">{addr.address_text}</p>
                    {addr.apartment && <p className="text-sm text-[#2D2A26]/60">кв. {addr.apartment}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-[#2D2A26]/40 hover:text-[#2D2A26]">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Настройки</h2>
          
          <div className="space-y-4">
            <div className="bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5" />
                <span>Тёмная тема</span>
              </div>
              <button
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full transition-colors ${
                  isDark ? "bg-primary dark:bg-primary-dark" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isDark ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            
            <button 
              onClick={async () => {
                await signOut();
                router.push('/auth');
              }}
              className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;