"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Truck,
  Home,
  RefreshCw,
  MapPin,
  Loader2,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// =====================================================
// TYPES
// =====================================================

interface City {
  id: string;
  name: string;
}

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [restaurantFilter, setRestaurantFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const [totalCount, setTotalCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load cities
  useEffect(() => {
    const loadCities = async () => {
      const { data } = await supabase
        .from("cities")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      
      if (data) {
        setCities(data);
      }
    };
    
    loadCities();
  }, []);

  // Load orders
  const loadOrders = async () => {
    setIsRefreshing(true);
    
    let query = supabase
      .from("orders")
      .select(
        `
        *,
        restaurants (name, address),
        users (full_name, phone),
        couriers (name, phone)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (cityFilter !== "all") {
      query = query.eq("delivery_city", cityFilter);
    }

    const { data, error, count } = await query;

    if (!error && data) {
      setOrders(data);
      setTotalCount(count || 0);
      setLastUpdate(new Date());
    }
    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadOrders();
  }, [cityFilter, page]);

  // Real-time refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, [cityFilter, page]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    
    loadOrders();
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pending: Clock,
      confirmed: CheckCircle,
      preparing: Package,
      ready: CheckCircle,
      waiting_courier: Truck,
      in_delivery: Truck,
      delivering: Truck,
      delivered: Home,
      cancelled: XCircle,
    };
    return icons[status] || Clock;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Новый",
      confirmed: "Подтверждён",
      preparing: "Готовится",
      ready: "Готов",
      waiting_courier: "Ждёт курьера",
      in_delivery: "В доставке",
      delivering: "В доставке",
      delivered: "Доставлен",
      cancelled: "Отменён",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-500",
      confirmed: "bg-blue-500/20 text-blue-500",
      preparing: "bg-orange-500/20 text-orange-500",
      ready: "bg-green-500/20 text-green-500",
      waiting_courier: "bg-purple-500/20 text-purple-500",
      in_delivery: "bg-purple-500/20 text-purple-500",
      delivering: "bg-purple-500/20 text-purple-500",
      delivered: "bg-green-500/20 text-green-500",
      cancelled: "bg-red-500/20 text-red-500",
    };
    return colors[status] || "bg-gray-500/20 text-gray-500";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU").format(price || 0) + " ₽";
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchQuery ||
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.restaurants?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    const matchesRestaurant =
      !restaurantFilter ||
      restaurantFilter === "all" ||
      order.restaurants?.name === restaurantFilter;

    return matchesSearch && matchesStatus && matchesRestaurant;
  });

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get unique restaurants
  const restaurants = Array.from(new Set(orders.map((o) => o.restaurants?.name).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#2D2A26] dark:text-[#E8E6E3]">
            Заказы
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
              {orders.length} заказов
            </p>
            <span className="text-[#2D2A26]/30">•</span>
            <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
              Обновлено {lastUpdate.toLocaleTimeString("ru-RU")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2A26]/40" />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-[#F5F3F0] dark:bg-[#2D2A26] outline-none focus:ring-2 focus:ring-primary text-[#2D2A26] dark:text-[#E8E6E3]"
            >
              <option value="all">Все города</option>
              {cities.map((city) => (
                <option key={city.id} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadOrders}
            disabled={isRefreshing}
            className="p-3 rounded-xl bg-[#F5F3F0] dark:bg-[#2D2A26] hover:bg-[#E8E6E3] dark:hover:bg-[#3D3A36] transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-5 h-5 text-[#2D2A26] dark:text-[#E8E6E3] ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 rounded-xl whitespace-nowrap ${
            statusFilter === "all"
              ? "bg-primary dark:bg-primary-dark text-white"
              : "bg-[#F5F3F0] dark:bg-[#2D2A26] text-[#2D2A26] dark:text-[#E8E6E3]"
          }`}
        >
          Все ({orders.length})
        </button>
        {["pending", "confirmed", "preparing", "ready", "waiting_courier", "in_delivery", "delivered"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap ${
                statusFilter === status
                  ? "bg-primary dark:bg-primary-dark text-white"
                  : "bg-[#F5F3F0] dark:bg-[#2D2A26] text-[#2D2A26] dark:text-[#E8E6E3]"
              }`}
            >
              {getStatusLabel(status)} ({statusCounts[status] || 0})
            </button>
          )
        )}
      </div>

      {/* Filters Row */}
      <div className="flex gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D2A26]/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по номеру заказа, ресторану или клиенту"
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F5F3F0] dark:bg-[#2D2A26] outline-none focus:ring-2 focus:ring-primary text-[#2D2A26] dark:text-[#E8E6E3] placeholder:text-[#2D2A26]/40"
          />
        </div>

        {/* Restaurant Filter */}
        <div className="relative">
          <select
            value={restaurantFilter}
            onChange={(e) => setRestaurantFilter(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#F5F3F0] dark:bg-[#2D2A26] outline-none focus:ring-2 focus:ring-primary text-[#2D2A26] dark:text-[#E8E6E3] min-w-[200px]"
          >
            <option value="all">Все заведения</option>
            {restaurants.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center gap-2 text-sm text-[#2D2A26]/60">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span>Автообновление каждые 10 секунд</span>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const StatusIcon = getStatusIcon(order.status);

          return (
            <div
              key={order.id}
              className="bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-lg text-[#2D2A26] dark:text-[#E8E6E3]">
                    #{order.order_number}
                  </p>
                  <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${getStatusColor(
                    order.status
                  )}`}
                >
                  <StatusIcon className="w-4 h-4" />
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                    Ресторан
                  </p>
                  <p className="font-medium text-[#2D2A26] dark:text-[#E8E6E3]">
                    {order.restaurants?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                    Адрес
                  </p>
                  <p className="font-medium text-[#2D2A26] dark:text-[#E8E6E3]">
                    {order.restaurants?.address || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                    Клиент
                  </p>
                  <p className="font-medium text-[#2D2A26] dark:text-[#E8E6E3]">
                    {order.users?.full_name || "Гость"}
                  </p>
                  <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                    {order.users?.phone || ""}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                    Курьер
                  </p>
                  {order.couriers ? (
                    <p className="font-medium text-purple-500">
                      {order.couriers.name}
                    </p>
                  ) : (
                    <p className="text-[#2D2A26]/40">Не назначен</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-[#2D2A26]/10 dark:border-[#E8E6E3]/10">
                <div>
                  <p className="text-lg font-semibold text-[#2D2A26] dark:text-[#E8E6E3]">
                    {formatPrice(order.final_amount)}
                  </p>
                </div>

                <div className="flex gap-2">
                  {/* Quick Status Actions */}
                  {order.status === "pending" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "confirmed")}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                    >
                      Подтвердить
                    </button>
                  )}
                  {order.status === "confirmed" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "preparing")}
                      className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
                    >
                      Готовить
                    </button>
                  )}
                  {order.status === "preparing" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "ready")}
                      className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                    >
                      Готов
                    </button>
                  )}
                  {order.status === "ready" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "waiting_courier")}
                      className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
                    >
                      Ждёт курьера
                    </button>
                  )}
                  {order.status === "in_delivery" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "delivered")}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      Доставлен
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-4 text-[#2D2A26]/30" />
            <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
              Заказов не найдено
            </p>
          </div>
        )}

        {totalCount > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-6">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-4 py-2 rounded-xl bg-[#F5F3F0] dark:bg-[#2D2A26] disabled:opacity-50"
            >
              Назад
            </button>
            <span className="text-sm text-[#2D2A26]/60">
              Страница {page + 1} из {Math.ceil(totalCount / PAGE_SIZE)}
            </span>
            <button
              disabled={(page + 1) * PAGE_SIZE >= totalCount}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl bg-[#F5F3F0] dark:bg-[#2D2A26] disabled:opacity-50"
            >
              Далее
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;