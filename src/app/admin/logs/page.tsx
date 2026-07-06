"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface LogRow {
  id: string;
  actor_email: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadLogs = useCallback(
    async (pageOverride?: number) => {
      setLoading(true);
      setError(null);

      const currentPage = pageOverride ?? page;
      const params = new URLSearchParams({ page: String(currentPage), pageSize: "20" });
    if (action) params.set("action", action);
    if (entityType) params.set("entity_type", entityType);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);

    const response = await fetch(`/api/admin/logs?${params}`);
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Ошибка загрузки логов");
      setLogs([]);
    } else {
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    }

    setLoading(false);
  }, [page, action, entityType, dateFrom, dateTo]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const applyFilters = () => {
    if (page === 1) {
      loadLogs(1);
    } else {
      setPage(1);
    }
  };

  const formatEntity = (log: LogRow) => {
    if (!log.entity_type) return "—";
    const id = log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : "";
    return `${log.entity_type}${id}`;
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Логи системы</h1>
        <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">
          Журнал действий администраторов ({total} записей)
        </p>
      </div>

      <div className="bg-white dark:bg-[#2D2A26] rounded-2xl border border-[#F5F3F0] dark:border-[#3D3A36] p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-[#2D2A26]/60">Действие</label>
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="create, update..."
              className="w-full px-3 py-2 rounded-lg bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-[#2D2A26]/60">Тип сущности</label>
            <input
              type="text"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              placeholder="banner, order..."
              className="w-full px-3 py-2 rounded-lg bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-[#2D2A26]/60">С даты</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-[#2D2A26]/60">По дату</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="w-full px-3 py-2 bg-primary text-white rounded-lg text-sm"
            >
              Применить
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-[#2D2A26] rounded-2xl border p-12 text-center text-[#2D2A26]/60">
          Записей не найдено. Действия администраторов появятся здесь после изменений в системе.
        </div>
      ) : (
        <div className="bg-white dark:bg-[#2D2A26] rounded-2xl border border-[#F5F3F0] dark:border-[#3D3A36] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F5F3F0] dark:border-[#3D3A36] text-left text-[#2D2A26]/60 bg-[#F5F3F0]/50 dark:bg-[#3D3A36]/50">
                  <th className="px-5 py-3 font-medium">Администратор</th>
                  <th className="px-5 py-3 font-medium">Действие</th>
                  <th className="px-5 py-3 font-medium">Сущность</th>
                  <th className="px-5 py-3 font-medium">Дата</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-[#F5F3F0] dark:border-[#3D3A36] last:border-0"
                  >
                    <td className="px-5 py-3">{log.actor_email}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#2D2A26]/70 dark:text-[#E8E6E3]/70">
                      {formatEntity(log)}
                    </td>
                    <td className="px-5 py-3 text-[#2D2A26]/60 whitespace-nowrap">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString("ru-RU")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#F5F3F0] dark:border-[#3D3A36]">
              <span className="text-sm text-[#2D2A26]/60">
                Страница {page} из {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg hover:bg-[#F5F3F0] dark:hover:bg-[#3D3A36] disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg hover:bg-[#F5F3F0] dark:hover:bg-[#3D3A36] disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LogsPage;
