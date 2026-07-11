"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle, AlertCircle, RefreshCw, Loader2, Download } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import { adminStyles } from "@/lib/admin/styles";
import { buildCsv, downloadCsv } from "@/lib/admin/export-csv";

interface PaymentRow {
  id: string;
  order_number: string;
  final_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  users: { full_name: string | null; email: string | null } | null;
  restaurants: { name: string | null } | null;
}

const PAGE_SIZE = 20;

const methodLabels: Record<string, string> = {
  cash: "Наличные",
  card: "Карта",
  online: "Онлайн",
};

const statusLabels: Record<string, string> = {
  paid: "Оплачен",
  pending: "Ожидание",
  refunded: "Возврат",
  failed: "Ошибка",
};

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [exporting, setExporting] = useState(false);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    const response = await fetch(`/api/admin/payments?${params}`);
    const data = await response.json();
    if (response.ok) {
      setPayments(data.payments || []);
      setTotalCount(data.totalCount || 0);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  const filtered = payments.filter((p) => {
    const userName = p.users?.full_name || p.users?.email || "";
    const matchesSearch =
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.order_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || p.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const successCount = payments.filter((p) => p.payment_status === "paid").length;
  const pendingCount = payments.filter((p) => p.payment_status === "pending").length;
  const totalAmount = payments.reduce((a, p) => a + Number(p.final_amount || 0), 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/admin/payments?page=0&pageSize=5000");
      const data = await response.json();
      const rows: PaymentRow[] = data.payments || [];
      const csv = buildCsv(rows, [
        { header: "Заказ", value: (r) => r.order_number },
        { header: "Клиент", value: (r) => r.users?.full_name || r.users?.email || "" },
        { header: "Ресторан", value: (r) => r.restaurants?.name || "" },
        { header: "Сумма", value: (r) => r.final_amount },
        { header: "Способ", value: (r) => methodLabels[r.payment_method] || r.payment_method },
        { header: "Статус", value: (r) => statusLabels[r.payment_status] || r.payment_status },
        { header: "Дата", value: (r) => new Date(r.created_at).toLocaleString("ru-RU") },
      ]);
      downloadCsv(`payments-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    } finally {
      setExporting(false);
    }
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <AdminPageHeader
        title="Платежи"
        subtitle="Данные из заказов (payment_method / payment_status)"
        actions={
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className={`${adminStyles.buttonPrimary} flex items-center gap-2`}
          >
            <Download className="w-4 h-4" />
            {exporting ? "Экспорт…" : "Экспорт"}
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={adminStyles.statCard}>
          <p className="text-sm text-gray-400">На странице</p>
          <p className="text-2xl font-bold text-white">{payments.length}</p>
        </div>
        <div className={adminStyles.statCard}>
          <p className="text-sm text-green-400">Оплачено</p>
          <p className="text-2xl font-bold text-green-400">{successCount}</p>
        </div>
        <div className={adminStyles.statCard}>
          <p className="text-sm text-orange-400">Ожидают</p>
          <p className="text-2xl font-bold text-orange-400">{pendingCount}</p>
        </div>
        <div className={adminStyles.statCard}>
          <p className="text-sm text-blue-400">Сумма (страница)</p>
          <p className="text-2xl font-bold text-blue-400">{totalAmount.toLocaleString("ru-RU")} ₽</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Поиск по заказу или клиенту..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${adminStyles.input} pl-12 py-3`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${adminStyles.select} py-3 min-w-[160px]`}
        >
          <option value="">Все статусы</option>
          <option value="paid">Оплачен</option>
          <option value="pending">Ожидание</option>
          <option value="refunded">Возврат</option>
          <option value="failed">Ошибка</option>
        </select>
      </div>

      <div className={`${adminStyles.card} overflow-hidden overflow-x-auto mb-4`}>
        <table className={`${adminStyles.table} min-w-[800px]`}>
          <thead>
            <tr className={adminStyles.tableHead}>
              <th className="px-4 py-3 font-medium">Заказ</th>
              <th className="px-4 py-3 font-medium">Клиент</th>
              <th className="px-4 py-3 font-medium">Ресторан</th>
              <th className="px-4 py-3 font-medium">Сумма</th>
              <th className="px-4 py-3 font-medium">Способ</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Дата</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((payment) => (
              <tr key={payment.id} className={adminStyles.tableRow}>
                <td className="px-4 py-3 font-mono text-sm">{payment.order_number}</td>
                <td className="px-4 py-3">{payment.users?.full_name || payment.users?.email || "—"}</td>
                <td className="px-4 py-3">{payment.restaurants?.name || "—"}</td>
                <td className="px-4 py-3 font-semibold">
                  {Number(payment.final_amount).toLocaleString("ru-RU")} ₽
                </td>
                <td className="px-4 py-3">
                  {methodLabels[payment.payment_method] || payment.payment_method}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      payment.payment_status === "paid"
                        ? "bg-green-500/20 text-green-400"
                        : payment.payment_status === "pending"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {payment.payment_status === "paid" && <CheckCircle className="w-3 h-3" />}
                    {payment.payment_status === "pending" && <AlertCircle className="w-3 h-3" />}
                    {payment.payment_status === "refunded" && <RefreshCw className="w-3 h-3" />}
                    {statusLabels[payment.payment_status] || payment.payment_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {new Date(payment.created_at).toLocaleString("ru-RU")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-12">Платежей пока нет</p>
        )}
      </div>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={totalCount}
        onPageChange={setPage}
        zeroBased
      />
    </div>
  );
};

export default PaymentsPage;
