"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Star,
  Package,
  DollarSign,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  Bike,
  Car,
} from "lucide-react";
import type { Courier } from "@/lib/types/courier";
import AdminLoader from "@/components/admin/AdminLoader";
import AdminModal from "@/components/admin/AdminModal";

// =====================================================
// TYPES
// =====================================================

interface CourierStats {
  today: { orders_completed: number; total_earnings: number; total_distance_km: number };
  week: { orders_completed: number; total_earnings: number; total_distance_km: number };
  month: { orders_completed: number; total_earnings: number; total_distance_km: number };
}

interface OrderHistory {
  id: string;
  order_id: string;
  status: string;
  earnings: number;
  created_at: string;
  orders?: {
    order_number: string;
    final_amount: number;
    status: string;
    created_at: string;
  };
}

interface DailyEarnings {
  period_date: string;
  amount: number;
}

// =====================================================
// COURIER DETAIL PAGE
// =====================================================

function CourierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [courier, setCourier] = useState<Courier | null>(null);
  const [stats, setStats] = useState<CourierStats | null>(null);
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [earnings, setEarnings] = useState<DailyEarnings[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const loadCourierData = async () => {
    setIsRefreshing(true);

    const response = await fetch(
      `/api/admin/couriers/${resolvedParams.id}?include_orders=true&include_earnings=true&include_stats=true`
    );
    const data = await response.json();

    if (response.ok && data.courier) {
      setCourier(data.courier);
      setStats(data.stats || null);
      setOrders(data.orders || []);
      setEarnings(data.earnings || []);
    }

    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadCourierData();
  }, [resolvedParams.id]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadCourierData();
    }, 30000);
    return () => clearInterval(interval);
  }, [resolvedParams.id]);

  const handleBlockCourier = async () => {
    if (!courier) return;

    await fetch(`/api/admin/couriers/${courier.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !courier.is_active }),
    });

    setShowBlockModal(false);
    loadCourierData();
  };

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

  const getTransportIcon = (type: string) => {
    const icons: Record<string, any> = {
      bike: Bike,
      car: Car,
      scooter: Package,
      walk: MapPin,
    };
    return icons[type] || Bike;
  };

  const getOrderStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-500",
      assigned: "bg-blue-500/20 text-blue-500",
      accepted: "bg-blue-500/20 text-blue-500",
      picked_up: "bg-purple-500/20 text-purple-500",
      in_delivery: "bg-purple-500/20 text-purple-500",
      delivered: "bg-green-500/20 text-green-500",
      cancelled: "bg-red-500/20 text-red-500",
      failed: "bg-red-500/20 text-red-500",
    };
    return colors[status] || "bg-gray-500/20 text-gray-500";
  };

  const getOrderStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Новый",
      assigned: "Принят",
      accepted: "Принят",
      picked_up: "Забран",
      in_delivery: "В пути",
      delivered: "Доставлен",
      cancelled: "Отменён",
      failed: "Неудача",
    };
    return labels[status] || status;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU").format(price || 0) + " ₽";
  };

  const formatRating = (rating: number) => {
    return rating ? rating.toFixed(1) : "—";
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

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  // Generate chart data for last 7 days
  const generateChartData = () => {
    const days = [];
    const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayName = dayNames[date.getDay()];
      
      const dayEarnings = earnings.find((e) => e.period_date === dateStr);
      
      days.push({
        day: dayName,
        date: dateStr,
        amount: dayEarnings?.amount || 0,
      });
    }
    
    return days;
  };

  const chartData = generateChartData();
  const maxEarnings = Math.max(...chartData.map((d) => d.amount), 1000);

  if (loading) {
    return <AdminLoader />;
  }

  if (!courier) {
    return (
      <div className="p-6 text-center">
        <p className="text-[#2D2A26]/60">Курьер не найден</p>
        <Link
          href="/admin/couriers"
          className="mt-4 inline-flex items-center gap-2 text-primary hover:opacity-80"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к списку
        </Link>
      </div>
    );
  }

  const TransportIcon = getTransportIcon(courier.vehicle_type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/couriers"
          className="flex items-center gap-2 text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 hover:text-[#2D2A26] dark:hover:text-[#E8E6E3]"
        >
          <ArrowLeft className="w-5 h-5" />
          Назад к списку
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={loadCourierData}
            disabled={isRefreshing}
            className="p-3 rounded-xl bg-[#F5F3F0] dark:bg-[#2D2A26] hover:bg-[#E8E6E3] dark:hover:bg-[#3D3A36] transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-5 h-5 text-[#2D2A26] dark:text-[#E8E6E3] ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
          </button>
          <button
            onClick={() => setShowBlockModal(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
              courier.is_active
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
            }`}
          >
            {courier.is_active ? (
              <>
                <Ban className="w-5 h-5" />
                <span className="font-medium">Заблокировать</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Разблокировать</span>
              </>
            )}
          </button>
          <Link
            href={`/admin/couriers/${courier.id}/edit`}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary dark:bg-primary-dark text-white rounded-xl hover:opacity-90 transition-opacity"
          >
            <Edit className="w-5 h-5" />
            <span className="font-medium">Изменить</span>
          </Link>
        </div>
      </div>

      {/* Courier Info Card */}
      <div className="bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-primary/20 dark:bg-primary-dark/20 flex items-center justify-center flex-shrink-0">
            {courier.avatar_url ? (
              <img
                src={courier.avatar_url}
                alt={courier.name}
                className="w-24 h-24 rounded-2xl object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-primary dark:text-primary-dark" />
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-display font-bold text-[#2D2A26] dark:text-[#E8E6E3]">
                {courier.name || "—"}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                  courier.status
                )}`}
              >
                {getStatusLabel(courier.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#2D2A26]/40" />
                <span className="text-[#2D2A26] dark:text-[#E8E6E3]">
                  {courier.phone || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#2D2A26]/40" />
                <span className="text-[#2D2A26] dark:text-[#E8E6E3]">
                  {courier.current_city || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TransportIcon className="w-5 h-5 text-[#2D2A26]/40" />
                <span className="text-[#2D2A26] dark:text-[#E8E6E3] capitalize">
                  {courier.vehicle_type || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-medium text-[#2D2A26] dark:text-[#E8E6E3]">
                  {formatRating(courier.rating)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today Stats */}
        <div className="bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl p-6">
          <h3 className="text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 mb-4">
            Сегодн��
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">Заказов</span>
              <span className="font-semibold text-[#2D2A26] dark:text-[#E8E6E3]">
                {stats?.today.orders_completed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">Заработок</span>
              <span className="font-semibold text-green-500">
                {formatPrice(stats?.today.total_earnings || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Week Stats */}
        <div className="bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl p-6">
          <h3 className="text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 mb-4">
            За неделю
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">Заказов</span>
              <span className="font-semibold text-[#2D2A26] dark:text-[#E8E6E3]">
                {stats?.week.orders_completed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">Заработок</span>
              <span className="font-semibold text-green-500">
                {formatPrice(stats?.week.total_earnings || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Month Stats */}
        <div className="bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl p-6">
          <h3 className="text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 mb-4">
            За месяц
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">Заказов</span>
              <span className="font-semibold text-[#2D2A26] dark:text-[#E8E6E3]">
                {stats?.month.orders_completed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">Заработок</span>
              <span className="font-semibold text-green-500">
                {formatPrice(stats?.month.total_earnings || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Chart */}
      <div className="bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-[#2D2A26] dark:text-[#E8E6E3] mb-6">
          Заработок по дням (последние 7 дней)
        </h3>
        <div className="flex items-end gap-2 h-40">
          {chartData.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center">
                <div
                  className="w-full bg-primary dark:bg-primary-dark rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max(
                      (day.amount / maxEarnings) * 100,
                      day.amount > 0 ? 4 : 0
                    )}%`,
                  }}
                >
                  <span className="sr-only">{formatPrice(day.amount)}</span>
                </div>
              </div>
              <span className="text-xs text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                {day.day}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <span className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
            Всего за 7 дней:{" "}
          </span>
          <span className="font-semibold text-green-500">
            {formatPrice(chartData.reduce((sum, d) => sum + d.amount, 0))}
          </span>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#2D2A26]/10 dark:border-[#E8E6E3]/10">
          <h3 className="text-lg font-semibold text-[#2D2A26] dark:text-[#E8E6E3]">
            История заказов
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D2A26]/10 dark:border-[#E8E6E3]/10">
                <th className="text-left p-4 text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                  Дата
                </th>
                <th className="text-left p-4 text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                  Заказ
                </th>
                <th className="text-left p-4 text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                  Сумма
                </th>
                <th className="text-left p-4 text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                  Статус
                </th>
                <th className="text-left p-4 text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
                  Заработок
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[#2D2A26]/10 dark:border-[#E8E6E3]/10 last:border-0"
                >
                  <td className="p-4 text-[#2D2A26] dark:text-[#E8E6E3]">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="p-4 font-medium text-[#2D2A26] dark:text-[#E8E6E3]">
                    #{order.orders?.order_number || order.order_id.slice(0, 8)}
                  </td>
                  <td className="p-4 text-[#2D2A26] dark:text-[#E8E6E3]">
                    {formatPrice(order.orders?.final_amount || 0)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${getOrderStatusColor(
                        order.status
                      )}`}
                    >
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-green-500">
                    {formatPrice(order.earnings || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {orders.length === 0 && (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-[#2D2A26]/30" />
            <p className="text-[#2D2A26]/60">Заказов пока нет</p>
          </div>
        )}
      </div>

      <AdminModal
        open={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        title={courier.is_active ? "Заблокировать курьера?" : "Разблокировать курьера?"}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setShowBlockModal(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] text-[#2D2A26] dark:text-[#E8E6E3]"
            >
              Отмена
            </button>
            <button
              onClick={handleBlockCourier}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white"
            >
              {courier.is_active ? "Заблокировать" : "Разблокировать"}
            </button>
          </>
        }
      >
        <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
          {courier.is_active
            ? "Курьер не сможет принимать новые заказы."
            : "Курьер снова сможет принимать заказы."}
        </p>
      </AdminModal>
    </div>
  );
}

export default CourierDetailPage;