"use client";

import React from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Truck,
  Home,
} from "lucide-react";

// =====================================================
// TYPES
// =====================================================

interface OrderStatusCardProps {
  status: string;
  orderNumber?: string;
  restaurantName?: string;
  customerName?: string;
  customerPhone?: string;
  courierName?: string;
  amount: number;
  date: string;
  onStatusChange?: (newStatus: string) => void;
}

// =====================================================
// ORDER STATUS CARD COMPONENT
// =====================================================

export function OrderStatusCard({
  status,
  orderNumber,
  restaurantName,
  customerName,
  customerPhone,
  courierName,
  amount,
  date,
  onStatusChange,
}: OrderStatusCardProps) {
  const getStatusIcon = () => {
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

  const getStatusLabel = () => {
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

  const getStatusColor = () => {
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
    const d = new Date(dateStr);
    return d.toLocaleString("ru-RU", {
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

  const StatusIcon = getStatusIcon();

  // Quick status actions mapping
  const getNextStatus = () => {
    const nextSteps: Record<string, string> = {
      pending: "confirmed",
      confirmed: "preparing",
      preparing: "ready",
      ready: "waiting_courier",
      in_delivery: "delivered",
    };
    return nextSteps[status];
  };

  const nextStatus = getNextStatus();

  const getNextStatusLabel = () => {
    const labels: Record<string, string> = {
      confirmed: "Подтвердить",
      preparing: "Готовить",
      ready: "Ждёт курьера",
      waiting_courier: "Ждёт курьера",
      in_delivery: "Доставлен",
    };
    return labels[status];
  };

  return (
    <div className="bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-lg text-[#2D2A26] dark:text-[#E8E6E3]">
            #{orderNumber}
          </p>
          <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
            {formatDate(date)}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${getStatusColor()}`}
        >
          <StatusIcon className="w-4 h-4" />
          {getStatusLabel()}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
        <div>
          <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
            Ресторан
          </p>
          <p className="font-medium text-[#2D2A26] dark:text-[#E8E6E3]">
            {restaurantName || "—"}
          </p>
        </div>
        <div>
          <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
            Клиент
          </p>
          <p className="font-medium text-[#2D2A26] dark:text-[#E8E6E3]">
            {customerName || "Гость"}
          </p>
          <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
            {customerPhone || ""}
          </p>
        </div>
        <div>
          <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
            Курьер
          </p>
          {courierName ? (
            <p className="font-medium text-purple-500">{courierName}</p>
          ) : (
            <p className="text-[#2D2A26]/40">Не назначен</p>
          )}
        </div>
        <div>
          <p className="text-sm text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
            Сумма
          </p>
          <p className="font-semibold text-[#2D2A26] dark:text-[#E8E6E3]">
            {formatPrice(amount)}
          </p>
        </div>
      </div>

      {nextStatus && onStatusChange && (
        <div className="flex justify-end pt-3 border-t border-[#2D2A26]/10 dark:border-[#E8E6E3]/10">
          <button
            onClick={() => onStatusChange(nextStatus)}
            className="px-3 py-2 bg-primary dark:bg-primary-dark text-white rounded-lg text-sm hover:opacity-90"
          >
            {getNextStatusLabel()}
          </button>
        </div>
      )}
    </div>
  );
}

export default OrderStatusCard;