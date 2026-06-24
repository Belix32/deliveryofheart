"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import type { DashboardStats } from "@/lib/api/dashboard";
import { getStatusLabel } from "@/lib/order-status";
import { RevenueChart, StatusBreakdown } from "@/components/admin/DashboardCharts";

const AnalyticsPage = () => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Ошибка ${res.status}`);
      }
      setData(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ru-RU").format(price) + " ₽";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error || "Нет данных"}</p>
        </div>
      </div>
    );
  }

  const { summary, revenueByDay, ordersByStatus, topRestaurants } = data;
  const weekOrders = revenueByDay.reduce((s, d) => s + d.orders, 0);
  const weekRevenue = revenueByDay.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Аналитика
            </h1>
            <p className="text-sm text-gray-500">{summary.city} · последние 7 дней</p>
          </div>
        </div>
        <button
          onClick={loadAnalytics}
          className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: ShoppingCart,
            label: "Заказы сегодня",
            value: summary.ordersToday.toString(),
            sub: `за неделю: ${weekOrders}`,
          },
          {
            icon: DollarSign,
            label: "Выручка сегодня",
            value: formatPrice(summary.revenueToday),
            sub: `за неделю: ${formatPrice(weekRevenue)}`,
          },
          {
            icon: Users,
            label: "Новые пользователи",
            value: summary.newUsersToday.toString(),
            sub: `вчера: ${summary.newUsersYesterday}`,
          },
          {
            icon: TrendingUp,
            label: "Средний чек",
            value: formatPrice(summary.avgCheckToday),
            sub: `вчера: ${formatPrice(summary.avgCheckYesterday)}`,
          },
        ].map((item, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-[#111111] border border-[#222222]"
          >
            <item.icon className="w-6 h-6 text-primary mb-3" />
            <p className="text-2xl font-bold text-white">{item.value}</p>
            <p className="text-sm text-gray-400">{item.label}</p>
            <p className="text-xs text-gray-500 mt-1">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart data={revenueByDay} title="Заказы и выручка по дням" />
        <StatusBreakdown
          data={ordersByStatus.map((s) => ({
            ...s,
            label: getStatusLabel(s.status),
          }))}
        />
      </div>

      <div className="rounded-2xl bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="p-4 border-b border-[#222222]">
          <h2 className="text-lg font-semibold text-white">Рестораны по выручке (7 дней)</h2>
        </div>
        {topRestaurants.length === 0 ? (
          <p className="p-8 text-center text-gray-500">Нет данных</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-[#222]">
                  <th className="text-left p-4 font-medium">Ресторан</th>
                  <th className="text-right p-4 font-medium">Заказы</th>
                  <th className="text-right p-4 font-medium">Выручка</th>
                  <th className="text-right p-4 font-medium">Ср. чек</th>
                </tr>
              </thead>
              <tbody>
                {topRestaurants.map((r) => (
                  <tr key={r.id} className="border-b border-[#222] hover:bg-[#1a1a1a]">
                    <td className="p-4 text-white">{r.name}</td>
                    <td className="p-4 text-right text-gray-300">{r.orders_count}</td>
                    <td className="p-4 text-right text-white font-medium">
                      {formatPrice(r.revenue)}
                    </td>
                    <td className="p-4 text-right text-gray-300">
                      {formatPrice(
                        r.orders_count > 0 ? Math.round(r.revenue / r.orders_count) : 0
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
