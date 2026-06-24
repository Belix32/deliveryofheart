"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Package,
  Store,
  Truck,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { DashboardStats } from "@/lib/api/dashboard";
import { getStatusLabel } from "@/lib/order-status";
import { RevenueChart, StatusBreakdown } from "@/components/admin/DashboardCharts";

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    preparing: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    ready: "bg-green-500/20 text-green-400 border-green-500/30",
    waiting_courier: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    in_delivery: "bg-primary/20 text-primary border-primary/30",
    delivering: "bg-primary/20 text-primary border-primary/30",
    delivered: "bg-green-500/20 text-green-400 border-green-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return colors[status] || "bg-gray-500/20 text-gray-400";
};

function ChangeBadge({ percent }: { percent: number | null }) {
  if (percent === null) {
    return (
      <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">
        к вчера
      </span>
    );
  }
  const isPositive = percent >= 0;
  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded-full ${
        isPositive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
      }`}
    >
      {isPositive ? "+" : ""}
      {percent}%
    </span>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Ошибка ${res.status}`);
      }
      setData(await res.json());
    } catch (err: unknown) {
      console.error("[Dashboard] Error:", err);
      setError(err instanceof Error ? err.message : "Ошибка загрузки данных");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error || "Нет данных"}</p>
          </div>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <RefreshCw className="w-4 h-4" />
          Повторить
        </button>
      </div>
    );
  }

  const { summary, recentOrders, topRestaurants, revenueByDay, ordersByStatus } = data;

  const stats = [
    {
      title: "Заказы сегодня",
      value: summary.ordersToday.toString(),
      change: summary.ordersChangePercent,
      icon: ShoppingCart,
      bg: "bg-primary/10",
    },
    {
      title: "Выручка сегодня",
      value: `${summary.revenueToday.toLocaleString("ru-RU")} ₽`,
      change: summary.revenueChangePercent,
      icon: DollarSign,
      bg: "bg-green-500/10",
    },
    {
      title: "Новые пользователи",
      value: summary.newUsersToday.toString(),
      change: summary.usersChangePercent,
      icon: Users,
      bg: "bg-blue-500/10",
    },
    {
      title: "Средний чек",
      value: `${summary.avgCheckToday.toLocaleString("ru-RU")} ₽`,
      change: summary.avgCheckChangePercent,
      icon: TrendingUp,
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Дашборд</h1>
          <p className="text-sm text-gray-500 mt-0.5">Город: {summary.city}</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white hover:border-[#444] transition-colors"
          title="Обновить"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="p-5 rounded-2xl bg-[#111111] border border-[#222222] hover:border-[#333333] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <ChangeBadge percent={stat.change} />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.title}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/orders"
          className="p-5 rounded-2xl bg-[#111111] border border-[#222222] hover:border-[#333333] transition-all flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-blue-500/10">
            <Package className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{summary.pendingOrders}</p>
            <p className="text-sm text-gray-400">Активных заказов</p>
          </div>
        </Link>

        <Link
          href="/admin/restaurants"
          className="p-5 rounded-2xl bg-[#111111] border border-[#222222] hover:border-[#333333] transition-all flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-green-500/10">
            <Store className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">
              {summary.activeRestaurants}/{summary.totalRestaurants}
            </p>
            <p className="text-sm text-gray-400">Ресторанов активно</p>
          </div>
        </Link>

        <Link
          href="/admin/couriers"
          className="p-5 rounded-2xl bg-[#111111] border border-[#222222] hover:border-[#333333] transition-all flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-purple-500/10">
            <Truck className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">
              {summary.onlineCouriers}/{summary.totalCouriers}
            </p>
            <p className="text-sm text-gray-400">Курьеров онлайн</p>
          </div>
        </Link>

        <div className="p-5 rounded-2xl bg-[#111111] border border-[#222222] flex items-center gap-4">
          <div className="flex gap-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold">{summary.deliveredToday}</span>
              <span className="text-gray-500">доставлено</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-white font-semibold">{summary.cancelledToday}</span>
              <span className="text-gray-500">отмен</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart data={revenueByDay} />
        <StatusBreakdown
          data={ordersByStatus.map((s) => ({
            ...s,
            label: getStatusLabel(s.status),
          }))}
        />
      </div>

      <div className="rounded-2xl bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="p-4 border-b border-[#222222] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Последние заказы</h2>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline">
            Смотреть все →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Пока нет заказов</p>
          </div>
        ) : (
          <div className="divide-y divide-[#222222]">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders`}
                className="p-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors block"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white">
                      #{order.order_number || order.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-gray-400 truncate">
                      {order.restaurant_name || "Ресторан"} ·{" "}
                      {new Date(order.created_at).toLocaleString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                  <span className="text-white font-semibold">
                    {order.final_amount.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="p-4 border-b border-[#222222] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Топ ресторанов (7 дней)</h2>
          <Link href="/admin/restaurants" className="text-sm text-primary hover:underline">
            Смотреть все →
          </Link>
        </div>

        {topRestaurants.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Нет заказов за период</p>
          </div>
        ) : (
          <div className="divide-y divide-[#222222]">
            {topRestaurants.map((restaurant, i) => (
              <div
                key={restaurant.id}
                className="p-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-sm font-bold text-gray-400">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-white">{restaurant.name}</p>
                    <p className="text-sm text-gray-400">{restaurant.orders_count} заказов</p>
                  </div>
                </div>
                <span className="text-white font-semibold">
                  {restaurant.revenue.toLocaleString("ru-RU")} ₽
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
