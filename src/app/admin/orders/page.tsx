"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  MapPin,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Truck,
  Home,
  Download,
} from "lucide-react";
import AdminLoader from "@/components/admin/AdminLoader";
import AdminModal from "@/components/admin/AdminModal";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import { adminStyles } from "@/lib/admin/styles";
import { buildCsv, downloadCsv } from "@/lib/admin/export-csv";

interface City {
  id: string;
  name: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  total_price: number;
  note: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  final_amount: number;
  delivery_address_full: string | null;
  delivery_city: string | null;
  comment: string | null;
  coupon_code: string | null;
  restaurants: { name: string; address: string } | null;
  users: { full_name: string | null; phone: string | null; email: string | null } | null;
  couriers: { name: string; phone: string } | null;
  order_items?: OrderItem[];
}

const STATUS_LABELS: Record<string, string> = {
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

const STATUS_COLORS: Record<string, string> = {
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

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [restaurantFilter, setRestaurantFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [exporting, setExporting] = useState(false);
  const PAGE_SIZE = 20;

  useEffect(() => {
    fetch("/api/admin/cities")
      .then((r) => r.json())
      .then((data) =>
        setCities(
          (data.cities || [])
            .filter((c: { is_active: boolean }) => c.is_active)
            .map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))
        )
      );
  }, []);

  const loadOrders = useCallback(async () => {
    setIsRefreshing(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (cityFilter !== "all") params.set("city", cityFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);

    const response = await fetch(`/api/admin/orders?${params}`);
    const data = await response.json();
    if (response.ok) {
      setOrders(data.orders || []);
      setTotalCount(data.totalCount || 0);
      setLastUpdate(new Date());
    }
    setLoading(false);
    setIsRefreshing(false);
  }, [cityFilter, statusFilter, page]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  useEffect(() => {
    setPage(0);
  }, [cityFilter, statusFilter]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, status: newStatus }),
    });
    loadOrders();
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((o) => (o ? { ...o, status: newStatus } : null));
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ru-RU").format(price || 0) + " ₽";

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchQuery ||
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.restaurants?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRestaurant =
      restaurantFilter === "all" || order.restaurants?.name === restaurantFilter;
    return matchesSearch && matchesRestaurant;
  });

  const restaurants = Array.from(
    new Set(orders.map((o) => o.restaurants?.name).filter(Boolean))
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ page: "0", pageSize: "5000" });
      if (cityFilter !== "all") params.set("city", cityFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const response = await fetch(`/api/admin/orders?${params}`);
      const data = await response.json();
      const rows: Order[] = data.orders || [];
      const csv = buildCsv(rows, [
        { header: "Номер", value: (r) => r.order_number },
        { header: "Статус", value: (r) => STATUS_LABELS[r.status] || r.status },
        { header: "Дата", value: (r) => new Date(r.created_at).toLocaleString("ru-RU") },
        { header: "Ресторан", value: (r) => r.restaurants?.name || "" },
        { header: "Клиент", value: (r) => r.users?.full_name || "" },
        { header: "Телефон", value: (r) => r.users?.phone || "" },
        { header: "Город", value: (r) => r.delivery_city || "" },
        { header: "Сумма", value: (r) => r.final_amount },
        { header: "Курьер", value: (r) => r.couriers?.name || "" },
      ]);
      downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <AdminLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#2D2A26] dark:text-[#E8E6E3]">
            Заказы
          </h1>
          <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 mt-1">
            {totalCount} заказов • обновлено {lastUpdate.toLocaleTimeString("ru-RU")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className={`${adminStyles.buttonPrimary} flex items-center gap-2`}
          >
            <Download className="w-4 h-4" />
            {exporting ? "Экспорт…" : "Экспорт"}
          </button>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2A26]/40" />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-[#F5F3F0] dark:bg-[#2D2A26] outline-none focus:ring-2 focus:ring-primary text-[#2D2A26] dark:text-[#E8E6E3]"
            >
              <option value="all">Все города</option>
              {cities.map((city) => (
                <option key={city.id} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadOrders}
            disabled={isRefreshing}
            className="p-3 rounded-xl bg-[#F5F3F0] dark:bg-[#2D2A26] hover:bg-[#E8E6E3] dark:hover:bg-[#3D3A36] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "pending", "confirmed", "preparing", "ready", "waiting_courier", "in_delivery", "delivered"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap ${
                statusFilter === status
                  ? "bg-primary text-white"
                  : "bg-[#F5F3F0] dark:bg-[#2D2A26] text-[#2D2A26] dark:text-[#E8E6E3]"
              }`}
            >
              {status === "all" ? "Все" : STATUS_LABELS[status]}
            </button>
          )
        )}
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D2A26]/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по номеру, ресторану или клиенту"
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F5F3F0] dark:bg-[#2D2A26] outline-none focus:ring-2 focus:ring-primary text-[#2D2A26] dark:text-[#E8E6E3]"
          />
        </div>
        <select
          value={restaurantFilter}
          onChange={(e) => setRestaurantFilter(e.target.value)}
          className="px-4 py-3 rounded-xl bg-[#F5F3F0] dark:bg-[#2D2A26] outline-none min-w-[200px]"
        >
          <option value="all">Все заведения</option>
          {restaurants.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const StatusIcon = STATUS_ICONS[order.status] || Clock;
          return (
            <div key={order.id} className="bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-lg">#{order.order_number}</p>
                  <p className="text-sm text-[#2D2A26]/60">{formatDate(order.created_at)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${STATUS_COLORS[order.status] || ""}`}>
                  <StatusIcon className="w-4 h-4" />
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                <div>
                  <p className="text-[#2D2A26]/60">Ресторан</p>
                  <p className="font-medium">{order.restaurants?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-[#2D2A26]/60">Клиент</p>
                  <p className="font-medium">{order.users?.full_name || "Гость"}</p>
                  <p className="text-[#2D2A26]/60">{order.users?.phone || ""}</p>
                </div>
                <div>
                  <p className="text-[#2D2A26]/60">Курьер</p>
                  <p className="font-medium text-purple-500">{order.couriers?.name || "Не назначен"}</p>
                </div>
                <div>
                  <p className="text-[#2D2A26]/60">Сумма</p>
                  <p className="font-semibold text-lg">{formatPrice(order.final_amount)}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#2D2A26]/10">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="px-3 py-2 rounded-lg bg-[#E8E6E3] dark:bg-[#3D3A36] text-sm flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Детали
                </button>
                {order.status === "pending" && (
                  <button onClick={() => updateOrderStatus(order.id, "confirmed")} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm">
                    Подтвердить
                  </button>
                )}
                {order.status === "confirmed" && (
                  <button onClick={() => updateOrderStatus(order.id, "preparing")} className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm">
                    Готовить
                  </button>
                )}
                {order.status === "preparing" && (
                  <button onClick={() => updateOrderStatus(order.id, "ready")} className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm">
                    Готов
                  </button>
                )}
                {order.status === "ready" && (
                  <button onClick={() => updateOrderStatus(order.id, "waiting_courier")} className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm">
                    Ждёт курьера
                  </button>
                )}
                {order.status === "in_delivery" && (
                  <button onClick={() => updateOrderStatus(order.id, "delivered")} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm">
                    Доставлен
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && <AdminEmptyState icon={Package} title="Заказов не найдено" />}

        {totalCount > PAGE_SIZE && (
          <AdminPagination
            page={page}
            totalPages={totalPages}
            total={totalCount}
            onPageChange={setPage}
            zeroBased
          />
        )}
      </div>

      <AdminModal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Заказ #${selectedOrder.order_number}` : ""}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[#2D2A26]/60">Статус</p>
                <p className="font-medium">{STATUS_LABELS[selectedOrder.status] || selectedOrder.status}</p>
              </div>
              <div>
                <p className="text-[#2D2A26]/60">Дата</p>
                <p className="font-medium">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <div>
                <p className="text-[#2D2A26]/60">Ресторан</p>
                <p className="font-medium">{selectedOrder.restaurants?.name || "—"}</p>
              </div>
              <div>
                <p className="text-[#2D2A26]/60">Клиент</p>
                <p className="font-medium">{selectedOrder.users?.full_name || "Гость"}</p>
                <p className="text-[#2D2A26]/60">{selectedOrder.users?.phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[#2D2A26]/60">Адрес доставки</p>
                <p className="font-medium">{selectedOrder.delivery_address_full || "—"}</p>
                {selectedOrder.delivery_city && (
                  <p className="text-[#2D2A26]/60">{selectedOrder.delivery_city}</p>
                )}
              </div>
              {selectedOrder.comment && (
                <div className="col-span-2">
                  <p className="text-[#2D2A26]/60">Комментарий</p>
                  <p>{selectedOrder.comment}</p>
                </div>
              )}
              {selectedOrder.coupon_code && (
                <div>
                  <p className="text-[#2D2A26]/60">Промокод</p>
                  <p className="font-mono">{selectedOrder.coupon_code}</p>
                </div>
              )}
            </div>

            {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
              <div>
                <p className="font-medium mb-2">Позиции</p>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between bg-[#F5F3F0] dark:bg-[#1a1a1a] rounded-lg px-3 py-2">
                      <span>
                        {item.quantity} × {formatPrice(item.price)}
                        {item.note && <span className="text-[#2D2A26]/60 ml-2">({item.note})</span>}
                      </span>
                      <span className="font-medium">{formatPrice(item.total_price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t flex justify-between items-center">
              <span className="text-lg font-semibold">Итого</span>
              <span className="text-xl font-bold">{formatPrice(selectedOrder.final_amount)}</span>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
};

export default OrdersPage;
