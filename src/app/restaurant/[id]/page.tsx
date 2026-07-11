"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Star, Clock, MapPin, ArrowLeft, Package, Check, ChefHat, Truck, UserCheck, X } from "lucide-react";
import Link from "next/link";
import { fetchRestaurants, fetchRestaurantById, fetchRestaurantMenu, fetchCategories, fetchMenuItems, Restaurant, Category, MenuItem } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import DishCard from "@/components/DishCard";

interface RestaurantOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  final_amount: number;
  created_at: string;
  users?: { full_name: string; phone: string };
  order_items?: { name: string; quantity: number; price: number }[];
}

const RestaurantPage: React.FC = () => {
  const params = useParams();
  const restaurantId = params.id as string;
  const { user } = useAuth();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Заказы и права доступа
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    loadRestaurantData();
  }, [restaurantId]);

  // Загружаем заказы и проверяем права доступа при изменении user или restaurantId
  useEffect(() => {
    if (restaurantId && user?.id) {
      checkAccessAndLoadOrders();
    }
  }, [restaurantId, user?.id]);

  const checkAccessAndLoadOrders = async () => {
    if (!user?.id || !restaurantId) return;
    
    setOrderLoading(true);
    setOrderError(null);
    
    try {
      const res = await fetch(`/api/restaurant/orders?restaurant_id=${restaurantId}`);
      if (res.status === 403) {
        setHasAccess(false);
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load orders");
      }
      const data = await res.json();
      setHasAccess(true);
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Ошибка проверки доступа:", err);
      setOrderError("Ошибка загрузки заказов");
    } finally {
      setOrderLoading(false);
    }
  };

  const loadRestaurantData = async () => {
    setLoading(true);
    
    // Fetch single restaurant by ID instead of all restaurants
    const restaurant = await fetchRestaurantById(restaurantId);
    setRestaurant(restaurant);
    
    if (restaurant) {
      // Fetch categories
      const cats = await fetchCategories(restaurantId);
      setCategories(cats);
      
      // Fetch all menu items using optimized function
      const menu = await fetchRestaurantMenu(restaurantId);
      const allItems = menu.map(item => {
        const cat = cats.find(c => c.id === item.category_id);
        return { ...item, category_name: cat?.name || '' };
      });
      setMenuItems(allItems);
    }
    
    setLoading(false);
  };

  // Обновить статус заказа
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!user?.id) return;
    
    setOrderLoading(true);
    setOrderError(null);
    
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        const ordersRes = await fetch(`/api/restaurant/orders?restaurant_id=${restaurantId}`);
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data.orders || []);
        }
      } else {
        setOrderError("Не удалось обновить статус");
      }
    } catch (err) {
      console.error("Ошибка обновления статуса:", err);
      setOrderError("Ошибка обновления статуса");
    } finally {
      setOrderLoading(false);
    }
  };

  // Получить следующий статус
  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: Record<string, string> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'waiting_courier',
    };
    return statusFlow[currentStatus] || null;
  };

  // Получить название статуса на русском
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'Новый',
      confirmed: 'Подтверждён',
      preparing: 'Готовится',
      ready: 'Готов',
      waiting_courier: 'Ожидает курьера',
      in_delivery: 'В доставке',
      delivered: 'Доставлен',
      cancelled: 'Отменён',
    };
    return labels[status] || status;
  };

  // Получить цвет статуса
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: 'bg-orange-100 text-orange-800 border-orange-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      preparing: 'bg-purple-100 text-purple-800 border-purple-200',
      ready: 'bg-green-100 text-green-800 border-green-200',
      waiting_courier: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      in_delivery: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Получить иконку статуса
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Package className="w-4 h-4" />;
      case 'confirmed':
        return <Check className="w-4 h-4" />;
      case 'preparing':
        return <ChefHat className="w-4 h-4" />;
      case 'ready':
        return <UserCheck className="w-4 h-4" />;
      case 'waiting_courier':
        return <Truck className="w-4 h-4" />;
      case 'in_delivery':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <Check className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  // Формат даты
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl mb-4">Ресторан не найден</p>
        <Link href="/" className="text-primary dark:text-primary-dark">
          Вернуться на главную
        </Link>
      </div>
    );
  }

  const imageUrl = restaurant.cover_url || restaurant.logo_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a446ae?w=800&h=400&fit=crop';

  return (
    <div className="animate-fade-in">
      {/* Restaurant Header */}
      <div className="relative">
        <div className="relative h-48 md:h-64 w-full">
          <Image
            src={imageUrl}
            alt={restaurant.name}
            fill
            sizes="100vw"
            priority={true}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Link
            href="/"
            className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
            {restaurant.name}
          </h1>
          <p className="text-white/80 text-sm">{restaurant.address}</p>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="px-4 py-4 flex flex-wrap items-center gap-4 border-b border-[#F5F3F0] dark:border-[#3D3A36]">
        <div className="flex items-center gap-1">
          <Star className="w-5 h-5 star-filled" fill="#FFD700" />
          <span className="font-semibold">{restaurant.rating?.toFixed(1) || '0.0'}</span>
          <span className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
            ({restaurant.review_count || 0})
          </span>
        </div>
        <div className="flex items-center gap-1 text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{restaurant.delivery_time_min}-{restaurant.delivery_time_max} мин</span>
        </div>
        <div className="flex items-center gap-1 text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">от {restaurant.delivery_price} ₽</span>
        </div>
      </div>

      {/* Description */}
      {restaurant.description && (
        <div className="px-4 py-4 border-b border-[#F5F3F0] dark:border-[#3D3A36]">
          <p className="text-[#2D2A26]/70 dark:text-[#E8E6E3]/70">{restaurant.description}</p>
        </div>
      )}

      {/* Menu Categories */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-display font-semibold mb-4">Меню</h2>
        
        {categories.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-[#2D2A26] rounded-xl border">
            <p className="text-[#2D2A26]/60">Меню пока не добавлено</p>
          </div>
        ) : (
          <>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 mb-4">
              <button
                onClick={() => setActiveCategory(null)}
                className={`category-pill flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                  activeCategory === null
                    ? "active"
                    : "bg-[#F5F3F0] dark:bg-[#2D2A26] text-[#2D2A26] dark:text-[#E8E6E3] hover:bg-[#E8E6E3] dark:hover:bg-[#3D3A36]"
                }`}
              >
                Все блюда
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`category-pill flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                    activeCategory === category.id
                      ? "active"
                      : "bg-[#F5F3F0] dark:bg-[#2D2A26] text-[#2D2A26] dark:text-[#E8E6E3] hover:bg-[#E8E6E3] dark:hover:bg-[#3D3A36]"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Dishes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(activeCategory
                ? menuItems.filter(item => item.category_id === activeCategory)
                : menuItems
              ).map((dish) => (
                <DishCard key={dish.id} dish={dish} restaurant={restaurant} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Секция заказов для админа/владельца */}
      {hasAccess && (
        <div className="px-4 py-6 border-t border-[#F5F3F0] dark:border-[#3D3A36]">
          <h2 className="text-lg font-display font-semibold mb-4">Заказы ресторана</h2>

          {orderError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {orderError}
            </div>
          )}
          
          {orderLoading && orders.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 bg-white dark:bg-[#2D2A26] rounded-xl border">
              <p className="text-[#2D2A26]/60">Заказов пока нет</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const nextStatus = getNextStatus(order.status);
                return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-[#2D2A26] rounded-xl border p-4"
                  >
                    {/* Заголовок заказа */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div>
                        <span className="font-semibold">Заказ #{order.order_number}</span>
                        <span className="text-sm text-[#2D2A26]/60 ml-2">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                      <div className="font-semibold">
                        {order.final_amount} ₽
                      </div>
                    </div>
                    
                    {/* Статус */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    
                    {/* Клиент */}
                    {order.users && (
                      <div className="text-sm text-[#2D2A26]/70 dark:text-[#E8E6E3]/70 mb-3">
                        Клиент: {order.users.full_name} {order.users.phone && `(${order.users.phone})`}
                      </div>
                    )}
                    
                    {/* Кнопка изменения статуса */}
                    {nextStatus && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, nextStatus)}
                        disabled={orderLoading}
                        className="w-full mt-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                      >
                        {orderLoading ? 'Обновление...' : `Перевести в статус "${getStatusLabel(nextStatus)}"`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantPage;