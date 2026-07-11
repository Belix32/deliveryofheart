"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Clock, CheckCircle, ChefHat, Package, 
  Truck, MapPin, Loader2, AlertCircle,
  Circle, Bell
} from "lucide-react";

interface OrderStatus {
  status: string;
  timestamp: string;
  note?: string;
}

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  final_amount: number;
  restaurant?: {
    name: string;
    address: string;
  };
  created_at: string;
  status_history?: OrderStatus[];
}

interface OrderTrackerProps {
  orderId: string;
  onClose?: () => void;
}

const statusConfig: Record<string, { 
  label: string; 
  description: string;
  icon: any;
  color: string;
  bgColor: string;
}> = {
  pending: {
    label: "Заказ оформлен",
    description: "Мы приняли ваш заказ",
    icon: Circle,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  confirmed: {
    label: "Заказ подтверждён",
    description: "Ресторан подтвердил заказ",
    icon: CheckCircle,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  preparing: {
    label: "Заказ готовят",
    description: "Повара готовят ваш заказ",
    icon: ChefHat,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
  },
  ready: {
    label: "Заказ готов",
    description: "Заказ готов к выдаче",
    icon: Package,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  waiting_courier: {
    label: "Ожидает курьера",
    description: "Заказ ждёт курьера",
    icon: Clock,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
  in_delivery: {
    label: "В доставке",
    description: "Курьер в пути",
    icon: Truck,
    color: "text-primary",
    bgColor: "bg-primary/20",
  },
  delivered: {
    label: "Доставлен",
    description: "Заказ доставлен",
    icon: MapPin,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  cancelled: {
    label: "Отменён",
    description: "Заказ был отменён",
    icon: AlertCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
};

const statusOrder = [
  "pending",
  "confirmed", 
  "preparing",
  "ready",
  "waiting_courier",
  "in_delivery",
  "delivered",
  "cancelled",
];

export default function OrderTracker({ orderId, onClose }: OrderTrackerProps) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant:restaurants(name, address)
        `)
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      setOrder(data);
    } catch (err: any) {
      console.error('[OrderTracker] Error:', err);
      setError(err.message || 'Ошибка загрузки заказа');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();

    // Subscribe to order changes
    const channel = supabase
      .channel('order-tracker')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, () => {
        fetchOrder();
      })
      .subscribe();

    // Poll every 10 seconds as backup
    const interval = setInterval(fetchOrder, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [orderId, fetchOrder]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <p className="text-red-400">{error || 'Заказ не найден'}</p>
      </div>
    );
  }

  const currentStatusIndex = statusOrder.indexOf(order.status);
  const config = statusConfig[order.status];

  return (
    <div className="space-y-6">
      {/* Order Info */}
      <div className="p-4 rounded-xl bg-[#1A1918] border border-[#2D2A26]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-neutral-400">Заказ</span>
          <span className="font-mono text-white">#{order.order_number}</span>
        </div>
        {order.restaurant && (
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Ресторан</span>
            <span className="text-white">{order.restaurant.name}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-neutral-400">Сумма</span>
          <span className="text-primary font-semibold">{order.final_amount} ₽</span>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#2D2A26]" />
        
        {/* Status Steps */}
        <div className="space-y-1">
          {statusOrder
            .filter((s) => s !== 'cancelled' || order.status === 'cancelled')
            .map((status, index) => {
              const stepConfig = statusConfig[status];
              const isCompleted = index <= currentStatusIndex && order.status !== 'cancelled';
              const isCurrent = status === order.status;
              const isCancelled = order.status === 'cancelled';

              return (
                <div
                  key={status}
                  className={`relative flex items-start gap-4 p-3 rounded-xl transition-colors ${
                    isCurrent ? 'bg-[#1A1918]' : ''
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                      isCompleted || isCurrent
                        ? stepConfig.bgColor
                        : 'bg-[#2D2A26]'
                    }`}
                  >
                    {isCurrent && isLoading ? (
                      <Loader2 className={`w-5 h-5 animate-spin ${stepConfig.color}`} />
                    ) : (
                      <stepConfig.icon
                        className={`w-5 h-5 ${
                          isCompleted || isCurrent
                            ? stepConfig.color
                            : 'text-neutral-600'
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <p
                      className={`font-medium ${
                        isCompleted || isCurrent ? 'text-white' : 'text-neutral-500'
                      }`}
                    >
                      {stepConfig.label}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {stepConfig.description}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-neutral-600 mt-1">
                        Обновлено только что
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Cancel Button (for cancellable statuses) */}
      {['pending', 'confirmed'].includes(order.status) && (
        <button
          onClick={async () => {
            if (!confirm('Отменить заказ?')) return;
            
            try {
              const res = await fetch(`/api/orders/${order.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "cancelled", note: "Отменён клиентом" }),
              });
              
              if (res.ok) {
                fetchOrder();
              }
            } catch (err) {
              console.error('[Cancel] Error:', err);
            }
          }}
          className="w-full py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30"
        >
          Отменить заказ
        </button>
      )}
    </div>
  );
}