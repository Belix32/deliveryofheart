"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { fetchCourierEarnings } from "@/lib/courier-client";
import BottomNav from "@/components/courier/BottomNav";
import { ArrowLeft, TrendingUp, Calendar, Wallet, Clock, ChevronRight } from "lucide-react";

interface DailyEarnings {
  id: string;
  courier_id: string;
  amount: number;
  period_date: string;
  orders_count?: number;
}

type PeriodType = "daily" | "weekly" | "monthly";

export default function EarningsPage() {
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [earnings, setEarnings] = useState<DailyEarnings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchCourierEarnings(period);
      setEarnings(data as DailyEarnings[]);
    } catch (err) {
      console.error("Ошибка загрузки заработка:", err);
      setError("Не удалось загрузить данные о заработке");
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  // Расчёт итогов
  const calculateTotal = () => {
    if (earnings.length === 0) return 0;
    
    if (period === "daily") {
      return earnings[0]?.amount || 0;
    }
    if (period === "weekly") {
      return earnings.slice(0, 7).reduce((sum, e) => sum + e.amount, 0);
    }
    return earnings.reduce((sum, e) => sum + e.amount, 0);
  };

  const calculateOrders = () => {
    if (earnings.length === 0) return 0;
    
    if (period === "daily") {
      return earnings[0]?.orders_count || 0;
    }
    if (period === "weekly") {
      return earnings.slice(0, 7).reduce((sum, e) => sum + (e.orders_count || 0), 0);
    }
    return earnings.reduce((sum, e) => sum + (e.orders_count || 0), 0);
  };

  const total = calculateTotal();
  const totalOrders = calculateOrders();
  const avgPerDay = period === "daily" ? total : total / (period === "weekly" ? 7 : 30);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split("T")[0]) {
      return "Сегодня";
    }
    if (dateStr === yesterday.toISOString().split("T")[0]) {
      return "Вчера";
    }
    return date.toLocaleDateString("ru-RU", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A09] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-neutral-400">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A09]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A09]/95 backdrop-blur-md border-b border-[#2D2A26]">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/courier"
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад</span>
          </Link>
          
          <h1 className="text-lg font-semibold text-white">Заработок</h1>
          
          <div className="w-10" />
        </div>
      </header>

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Period tabs */}
      <div className="px-4 py-3 border-b border-[#2D2A26]">
        <div className="flex gap-2">
          {(["daily", "weekly", "monthly"] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                period === p
                  ? "bg-primary text-white"
                  : "bg-[#2D2A26] text-neutral-400 hover:text-white"
              }`}
            >
              {p === "daily" && "Сегодня"}
              {p === "weekly" && "Неделя"}
              {p === "monthly" && "Месяц"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 space-y-4">
        {/* Main earnings card */}
        <div className="relative overflow-hidden rounded-2xl border border-[#2D2A26] bg-[#1A1918] p-5">
          {/* Background glow */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-primary" />
              <span className="text-sm text-neutral-400">
                {period === "daily" && "За сегодня"}
                {period === "weekly" && "За эту неделю"}
                {period === "monthly" && "За этот месяц"}
              </span>
            </div>
            
            <p className="text-4xl font-bold text-white mb-1">
              {formatCurrency(total)}
            </p>
            
            <div className="flex items-center gap-4 text-sm">
              <span className="text-neutral-400">
                {totalOrders} заказов
              </span>
              <span className="text-neutral-600">•</span>
              <span className="text-emerald-400">
                ~{formatCurrency(avgPerDay)}/день
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#2D2A26] bg-[#1A1918] p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-white">{totalOrders}</p>
            <p className="text-xs text-neutral-500">заказов</p>
          </div>
          
          <div className="rounded-2xl border border-[#2D2A26] bg-[#1A1918] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xl font-bold text-white">{formatCurrency(avgPerDay)}</p>
            <p className="text-xs text-neutral-500">в день</p>
          </div>
          
          <div className="rounded-2xl border border-[#2D2A26] bg-[#1A1918] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl font-bold text-white">
              {period === "daily" ? "1" : period === "weekly" ? "7" : "30"}
            </p>
            <p className="text-xs text-neutral-500">дней</p>
          </div>
        </div>

        {/* Daily breakdown */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">По дням</h2>
          
          {earnings.length > 0 ? (
            <div className="space-y-2">
              {earnings.slice(0, period === "daily" ? 1 : period === "weekly" ? 7 : 14).map((e, index) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1A1918] border border-[#2D2A26]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2D2A26] flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{formatDate(e.period_date)}</p>
                      <p className="text-xs text-neutral-500">{e.orders_count || 0} заказов</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {formatCurrency(e.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <p>Нет данных за этот период</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}