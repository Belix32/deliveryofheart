"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchAvailableOrders, acceptCourierOrder } from "@/lib/courier-client";
import OrderCard from "@/components/courier/OrderCard";
import BottomNav from "@/components/courier/BottomNav";
import { ArrowLeft, Filter, SlidersHorizontal, RefreshCw, Package } from "lucide-react";

interface AvailableOrder {
  id: string;
  order_number?: string;
  address: string;
  total_amount: number;
  delivery_distance?: number;
  created_at: string;
  restaurants?: {
    name: string;
    address: string;
  };
  status: string;
}

type FilterType = "all" | "nearby" | "expensive";

export default function AvailableOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchAvailableOrders();
      setOrders(data as AvailableOrder[]);
    } catch (err) {
      console.error("Ошибка загрузки заказов:", err);
      setError("Не удалось загрузить заказы");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchOrders();
  }, [fetchOrders]);

  const handleAccept = async (orderId: string) => {
    setAcceptingOrderId(orderId);
    try {
      await acceptCourierOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      router.push("/courier/orders");
    } catch (err) {
      console.error("Ошибка принятия заказа:", err);
      setError("Не удалось принять заказ. Возможно, его уже взяли.");
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const filteredOrders = [...orders].sort((a, b) => {
    if (filter === "nearby") {
      return (a.delivery_distance || 0) - (b.delivery_distance || 0);
    }
    if (filter === "expensive") {
      return b.total_amount - a.total_amount;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A09] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-neutral-400">Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A09]">
      <header className="sticky top-0 z-40 bg-[#0A0A09]/95 backdrop-blur-md border-b border-[#2D2A26]">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/courier"
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад</span>
          </Link>

          <h1 className="text-lg font-semibold text-white">Доступные заказы</h1>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? "bg-primary/20 text-primary" : "hover:bg-[#2D2A26] text-white"
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="px-4 pb-3 space-y-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-neutral-500" />
              <span className="text-sm text-neutral-500">Сортировка:</span>
            </div>
            <div className="flex gap-2">
              {(["all", "nearby", "expensive"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filter === f
                      ? "bg-primary text-white"
                      : "bg-[#2D2A26] text-neutral-400 hover:text-white"
                  }`}
                >
                  {f === "all" && "Все"}
                  {f === "nearby" && "Рядом"}
                  {f === "expensive" && "Дорогие"}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <main className="p-4 pb-20">
        {isRefreshing && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-2 text-neutral-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Обновление...</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-neutral-400">
            Найдено {filteredOrders.length} заказов
          </p>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Обновить
          </button>
        </div>

        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                variant="available"
                onAccept={handleAccept}
                isLoading={acceptingOrderId === order.id}
                actionLabel=" принять"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#2D2A26] flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Заказов нет</h3>
            <p className="text-sm text-neutral-500">Новые заказы появятся здесь</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-sm hover:bg-primary-dark transition-colors"
            >
              Обновить
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
