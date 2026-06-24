"use client";

import React from "react";

interface RevenueChartProps {
  data: { label: string; revenue: number; orders: number }[];
  title?: string;
}

export function RevenueChart({ data, title = "Выручка за 7 дней" }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n) + " ₽";

  return (
    <div className="rounded-2xl bg-[#111111] border border-[#222222] p-5">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {data.every((d) => d.revenue === 0) ? (
        <p className="text-gray-500 text-sm text-center py-8">Нет данных за период</p>
      ) : (
        <div className="flex items-end justify-between gap-2 h-40">
          {data.map((day) => (
            <div key={day.label} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="relative w-full flex justify-center">
                <span className="absolute -top-6 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {formatPrice(day.revenue)} · {day.orders} зак.
                </span>
                <div
                  className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-primary/80 to-primary transition-all"
                  style={{ height: `${Math.max(8, (day.revenue / maxRevenue) * 120)}px` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 text-center leading-tight">
                {day.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface StatusBreakdownProps {
  data: { status: string; count: number; label: string }[];
  title?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  preparing: "bg-orange-500",
  ready: "bg-emerald-500",
  waiting_courier: "bg-purple-500",
  in_delivery: "bg-primary",
  delivering: "bg-primary",
  delivered: "bg-green-600",
  cancelled: "bg-red-500",
};

export function StatusBreakdown({ data, title = "Заказы сегодня по статусам" }: StatusBreakdownProps) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="rounded-2xl bg-[#111111] border border-[#222222] p-5">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {total === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">Сегодня заказов пока нет</p>
      ) : (
        <div className="space-y-3">
          <div className="flex h-3 rounded-full overflow-hidden bg-[#1a1a1a]">
            {data.map((item) => (
              <div
                key={item.status}
                className={`${STATUS_COLORS[item.status] || "bg-gray-500"}`}
                style={{ width: `${(item.count / total) * 100}%` }}
                title={`${item.label}: ${item.count}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {data.map((item) => (
              <div key={item.status} className="flex items-center gap-2 text-sm">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_COLORS[item.status] || "bg-gray-500"}`}
                />
                <span className="text-gray-400 truncate">{item.label}</span>
                <span className="text-white font-medium ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
