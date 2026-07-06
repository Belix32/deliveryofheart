"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchCourierProfile,
  fetchCourierStats,
  setCourierOnlineStatus,
} from "@/lib/courier-client";
import { useAuth } from "@/context/AuthContext";
import type { Courier, CourierStatsSummary } from "@/lib/types/courier";
import StatusToggle from "@/components/courier/StatusToggle";
import QuickStats from "@/components/courier/QuickStats";
import BottomNav from "@/components/courier/BottomNav";
import { PackagePlus, ClipboardList, Zap } from "lucide-react";

const defaultStats: CourierStatsSummary = {
  today: {
    orders_completed: 0,
    total_earnings: 0,
    total_distance_km: 0,
  },
  week: {
    orders_completed: 0,
    total_earnings: 0,
    total_distance_km: 0,
  },
  month: {
    orders_completed: 0,
    total_earnings: 0,
    total_distance_km: 0,
  },
};

export default function CourierPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [courier, setCourier] = useState<Courier | null>(null);
  const [stats, setStats] = useState<CourierStatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const profile = await fetchCourierProfile();

      if (!profile) {
        setError("Профиль курьера не найден");
        setIsLoading(false);
        return;
      }

      setCourier(profile);
      const statsData = await fetchCourierStats();
      setStats(statsData);
    } catch (err) {
      console.error("Ошибка загрузки данных курьера:", err);
      setError("Не удалось загрузить данные. Попробуйте обновить страницу.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user?.id, fetchData]);

  const handleStatusChange = async (newStatus: "online" | "offline") => {
    if (!courier) return;

    setIsStatusLoading(true);
    try {
      await setCourierOnlineStatus(newStatus);
      setCourier({ ...courier, status: newStatus });
    } catch (err) {
      console.error("Ошибка изменения статуса:", err);
      setError("Ошибка при изменении статуса");
    } finally {
      setIsStatusLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Доброе утро";
    if (hour >= 12 && hour < 18) return "Добрый день";
    if (hour >= 18 && hour < 23) return "Добрый вечер";
    return "Доброй ночи";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-neutral-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center max-w-sm">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  const displayCourier = courier;
  const displayStats = stats || defaultStats;

  if (!displayCourier) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-neutral-400">Данные курьера не найдены</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-white">
          {getGreeting()}, {displayCourier.name}!
        </h1>
        <p className="text-neutral-400">Работайте с нами и зарабатывайте</p>
      </div>

      <section>
        <StatusToggle
          currentStatus={displayCourier.status}
          onStatusChange={handleStatusChange}
          isLoading={isStatusLoading}
        />
      </section>

      <section>
        <QuickStats
          todayEarnings={displayStats.today.total_earnings}
          todayOrders={displayStats.today.orders_completed}
          weekEarnings={displayStats.week.total_earnings}
          weekOrders={displayStats.week.orders_completed}
          isLoading={isLoading}
          onViewEarnings={() => router.push("/courier/earnings")}
          onViewOrders={() => router.push("/courier/orders")}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Быстрый доступ</h2>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/courier/orders/available"
            className="group relative overflow-hidden rounded-2xl border border-[#2D2A26] bg-[#1A1918] p-4 transition-all duration-200 hover:border-primary/50"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:blur-xl transition-all" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
                <PackagePlus className="w-5 h-5 text-primary" />
              </div>
              <p className="font-semibold text-white">Новые заказы</p>
              <p className="text-xs text-neutral-500 mt-1">Доступные для принятия</p>
            </div>
          </Link>

          <Link
            href="/courier/orders"
            className="group relative overflow-hidden rounded-2xl border border-[#2D2A26] bg-[#1A1918] p-4 transition-all duration-200 hover:border-blue-500/50"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:blur-xl transition-all" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3">
                <ClipboardList className="w-5 h-5 text-blue-400" />
              </div>
              <p className="font-semibold text-white">Мои заказы</p>
              <p className="text-xs text-neutral-500 mt-1">В работе и завершённые</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-[#2D2A26] bg-[#1A1918] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Общий заработок</p>
              <p className="text-xl font-bold text-white">
                {new Intl.NumberFormat("ru-RU", {
                  style: "currency",
                  currency: "RUB",
                  minimumFractionDigits: 0,
                }).format(displayStats.month.total_earnings)}
              </p>
            </div>
          </div>
          <Link
            href="/courier/earnings"
            className="px-4 py-2 rounded-xl bg-[#2D2A26] text-neutral-300 text-sm hover:bg-[#3D3A26] transition-colors"
          >
            Подробнее
          </Link>
        </div>
      </section>

      <BottomNav courierName={displayCourier.name} />
    </div>
  );
}
