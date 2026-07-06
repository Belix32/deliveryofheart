"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  User,
  Phone,
  MapPin,
  Star,
  Package,
  DollarSign,
  CircleDot,
  MoreVertical,
  RefreshCw,
  Loader2,
} from "lucide-react";
import type { Courier } from "@/lib/types/courier";

// =====================================================
// TYPES
// =====================================================

// =====================================================
// COURIERS LIST PAGE
// =====================================================

function CouriersContent() {
  const searchParams = useSearchParams();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadCouriers = async () => {
    setIsRefreshing(true);
    const response = await fetch("/api/admin/couriers");
    const data = await response.json();

    if (response.ok) {
      setCouriers(data.couriers || []);
    }
    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadCouriers();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadCouriers();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter couriers
  const filteredCouriers = couriers.filter((courier) => {
    const matchesSearch =
      !searchQuery ||
      courier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courier.phone?.includes(searchQuery);
    const matchesStatus =
      statusFilter === "all" || courier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Status counts
  const statusCounts = couriers.reduce((acc, courier) => {
    acc[courier.status] = (acc[courier.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      online: "bg-green-500/20 text-green-500",
      offline: "bg-gray-500/20 text-gray-500",
      busy: "bg-yellow-500/20 text-yellow-500",
    };
    return colors[status] || "bg-gray-500/20 text-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      online: "Онлайн",
      offline: "Оффлайн",
      busy: "Занят",
    };
    return labels[status] || status;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU").format(price || 0) + " ₽";
  };

  const formatRating = (rating: number) => {
    return rating ? rating.toFixed(1) : "—";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#2D2A26] dark:text-[#E8E6E3]">
            Курьеры
          </h1>
          <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
            {couriers.length} курьеров
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadCouriers}
            disabled={isRefreshing}
            className="p-3 rounded-xl bg-[#F5F3F0] dark:bg-[#2D2A26] hover:bg-[#E8E6E3] dark:hover:bg-[#3D3A36] transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-5 h-5 text-[#2D2A26] dark:text-[#E8E6E3] ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
          </button>
          <Link
            href="/admin/couriers/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary dark:bg-primary-dark text-white rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Добавить курьера</span>
          </Link>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
            statusFilter === "all"
              ? "bg-primary dark:bg-primary-dark text-white"
              : "bg-[#F5F3F0] dark:bg-[#2D2A26] text-[#2D2A26] dark:text-[#E8E6E3] hover:bg-[#E8E6E3] dark:hover:bg-[#3D3A36]"
          }`}
        >
          Все ({couriers.length})
        </button>
        {["online", "busy", "offline"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
              statusFilter === status
                ? "bg-primary dark:bg-primary-dark text-white"
                : "bg-[#F5F3F0] dark:bg-[#2D2A26] text-[#2D2A26] dark:text-[#E8E6E3] hover:bg-[#E8E6E3] dark:hover:bg-[#3D3A36]"
            }`}
          >
            {getStatusLabel(status)} ({statusCounts[status] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D2A26]/40 dark:text-[#E8E6E3]/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по имени или телефону"
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F5F3F0] dark:bg-[#2D2A26] outline-none focus:ring-2 focus:ring-primary text-[#2D2A26] dark:text-[#E8E6E3] placeholder:text-[#2D2A26]/40 dark:placeholder:text-[#E8E6E3]/40"
        />
      </div>

      {/* Couriers Table */}
      <div className="bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D2A26]/10 dark:border-[#E8E6E3]/10">
                <th className="text-left p-4 text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                  Курьер
                </th>
                <th className="text-left p-4 text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                  Телефон
                </th>
                <th className="text-left p-4 text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                  Статус
                </th>
                <th className="text-left p-4 text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                  Рейтинг
                </th>
                <th className="text-left p-4 text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                  Заказов
                </th>
                <th className="text-left p-4 text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                  Заработок
                </th>
                <th className="text-right p-4 text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCouriers.map((courier) => (
                <tr
                  key={courier.id}
                  className="border-b border-[#2D2A26]/10 dark:border-[#E8E6E3]/10 last:border-0 hover:bg-[#E8E6E3]/50 dark:hover:bg-[#3D3A36]/50 transition-colors"
                >
                  <td className="p-4">
                    <Link
                      href={`/admin/couriers/${courier.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 dark:bg-primary-dark/20 flex items-center justify-center">
                        {courier.avatar_url ? (
                          <img
                            src={courier.avatar_url}
                            alt={courier.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-primary dark:text-primary-dark" />
                        )}
                      </div>
                      <span className="font-medium text-[#2D2A26] dark:text-[#E8E6E3] group-hover:text-primary dark:group-hover:text-primary-dark transition-colors">
                        {courier.name || "—"}
                      </span>
                    </Link>
                  </td>
                  <td className="p-4 text-[#2D2A26] dark:text-[#E8E6E3]">
                    {courier.phone || "—"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                        courier.status
                      )}`}
                    >
                      {getStatusLabel(courier.status)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-[#2D2A26] dark:text-[#E8E6E3]">
                        {formatRating(courier.rating)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-[#2D2A26] dark:text-[#E8E6E3]">
                    {courier.total_deliveries || 0}
                  </td>
                  <td className="p-4 font-medium text-[#2D2A26] dark:text-[#E8E6E3]">
                    {formatPrice(courier.total_earnings)}
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/couriers/${courier.id}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#2D2A26]/10 dark:hover:bg-[#E8E6E3]/10 transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-[#2D2A26]/60 dark:text-[#E8E6E3]/60" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredCouriers.length === 0 && (
          <div className="p-12 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-[#2D2A26]/30 dark:text-[#E8E6E3]/30" />
            <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
              {searchQuery || statusFilter !== "all"
                ? "Курьеры не найдены"
                : "Курьеры пока не добавлены"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CouriersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <CouriersContent />
    </Suspense>
  );
}

export default CouriersPage;