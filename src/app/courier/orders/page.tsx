"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { fetchCourierOrders, updateCourierOrderStatus } from "@/lib/courier-client";
import OrderCard from "@/components/courier/OrderCard";
import StatusBadge from "@/components/courier/StatusBadge";
import BottomNav from "@/components/courier/BottomNav";
import { ArrowLeft, Package, CheckCircle2, Clock } from "lucide-react";
import type { CourierOrder } from "@/lib/types/courier";

type OrderStatus = "assigned" | "accepted" | "picked_up" | "in_delivery" | "delivered" | "cancelled" | "failed" | "pending";
type TabType = "active" | "completed";

export default function MyOrdersPage() {
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [activeOrders, setActiveOrders] = useState<CourierOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<CourierOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchCourierOrders();

      const active = data.filter((o) =>
        ["assigned", "accepted", "picked_up", "in_delivery"].includes(o.status)
      );
      const completed = data.filter((o) =>
        ["delivered", "cancelled", "failed"].includes(o.status)
      );

      setActiveOrders(active);
      setCompletedOrders(completed);
    } catch (err) {
      console.error("Ошибка загрузки заказов:", err);
      setError("Не удалось загрузить заказы");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAction = async (order: CourierOrder) => {
    if (!order.order) return;

    setProcessingOrderId(order.id);
    try {
      let newStatus: "accepted" | "picked_up" | "delivered" | null = null;

      if (order.status === "assigned") {
        newStatus = "accepted";
      } else if (order.status === "accepted") {
        newStatus = "picked_up";
      } else if (order.status === "picked_up" || order.status === "in_delivery") {
        newStatus = "delivered";
      }

      if (newStatus) {
        await updateCourierOrderStatus(order.order_id, newStatus);

        if (newStatus === "delivered") {
          setActiveOrders((prev) => prev.filter((o) => o.id !== order.id));
          setCompletedOrders((prev) => [
            { ...order, status: "delivered" as OrderStatus },
            ...prev,
          ]);
        } else {
          setActiveOrders((prev) =>
            prev.map((o) =>
              o.id === order.id ? { ...o, status: newStatus as OrderStatus } : o
            )
          );
        }
      }
    } catch (err) {
      console.error("Ошибка обновления заказа:", err);
      setError("Ошибка при обновлении заказа");
    } finally {
      setProcessingOrderId(null);
    }
  };

  const getActionLabel = (status: OrderStatus) => {
    switch (status) {
      case "assigned":
        return "Забрать";
      case "accepted":
        return "Взять";
      case "picked_up":
        return "Еду";
      case "in_delivery":
        return "Доставлен";
      default:
        return "Детали";
    }
  };

  const currentOrders = activeTab === "active" ? activeOrders : completedOrders;
  const totalEarnings = completedOrders.reduce((sum, o) => sum + o.earnings, 0);

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

          <h1 className="text-lg font-semibold text-white">Мои заказы</h1>

          <div className="w-10" />
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="px-4 py-3 border-b border-[#2D2A26]">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "active"
                ? "bg-primary text-white"
                : "bg-[#2D2A26] text-neutral-400 hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4" />
            Активные ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "completed"
                ? "bg-primary text-white"
                : "bg-[#2D2A26] text-neutral-400 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Завершённые ({completedOrders.length})
          </button>
        </div>
      </div>

      {activeTab === "completed" && completedOrders.length > 0 && (
        <div className="px-4 py-3 border-b border-[#2D2A26]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">Завершено:</span>
            <span className="text-lg font-bold text-white">
              {new Intl.NumberFormat("ru-RU", {
                style: "currency",
                currency: "RUB",
                minimumFractionDigits: 0,
              }).format(totalEarnings)}
            </span>
          </div>
        </div>
      )}

      <main className="p-4 pb-20">
        {currentOrders.length > 0 ? (
          <div className="space-y-4">
            {currentOrders.map((order) => (
              <div key={order.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <StatusBadge status={order.status} />
                  <span className="text-xs text-neutral-500">
                    {new Date(order.created_at).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {order.order && (
                  <OrderCard
                    order={{
                      ...order.order,
                      created_at: order.order.created_at as string,
                      delivery_distance: order.distance_km,
                    }}
                    variant={activeTab === "active" ? "active" : "completed"}
                    onAction={() => handleAction(order)}
                    isLoading={processingOrderId === order.id}
                    actionLabel={getActionLabel(order.status)}
                  />
                )}

                {activeTab === "completed" && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Заказ выполнен</span>
                    <span className="text-emerald-400 font-medium">+{order.earnings} ₽</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#2D2A26] flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {activeTab === "active" ? "Нет активных заказов" : "Нет завершённых заказов"}
            </h3>
            <p className="text-sm text-neutral-500">
              {activeTab === "active"
                ? "Примите новый заказ"
                : "Завершённые заказы появятся здесь"}
            </p>
            {activeTab === "active" && (
              <Link
                href="/courier/orders/available"
                className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-sm hover:bg-primary-dark transition-colors"
              >
                К доступным заказам
              </Link>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
