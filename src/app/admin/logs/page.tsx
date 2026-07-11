"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminPagination from "@/components/admin/AdminPagination";
import { adminStyles } from "@/lib/admin/styles";

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
      <AdminPageHeader
        title="Логи системы"
        subtitle={`Журнал действий администраторов (${total} записей)`}
      />

      <div className={`${adminStyles.cardPadding} mb-4`}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-400">Действие</label>
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="create, update..."
              className={adminStyles.input}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-400">Тип сущности</label>
            <input
              type="text"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              placeholder="banner, order..."
              className={adminStyles.input}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-400">С даты</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={adminStyles.input}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-400">По дату</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={adminStyles.input}
            />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={applyFilters} className={`${adminStyles.buttonPrimary} w-full`}>
              Применить
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className={`${adminStyles.errorBox} mb-4`}>
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <div className={`${adminStyles.cardPadding} text-center text-gray-400`}>
          Записей не найдено. Действия администраторов появятся здесь после изменений в системе.
        </div>
      ) : (
        <>
          <div className={`${adminStyles.card} overflow-hidden mb-4`}>
            <div className="overflow-x-auto">
              <table className={adminStyles.table}>
                <thead>
                  <tr className={adminStyles.tableHead}>
                    <th className="px-5 py-3 font-medium">Администратор</th>
                    <th className="px-5 py-3 font-medium">Действие</th>
                    <th className="px-5 py-3 font-medium">Сущность</th>
                    <th className="px-5 py-3 font-medium">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className={adminStyles.tableRow}>
                      <td className="px-5 py-3">{log.actor_email}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-medium">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400">{formatEntity(log)}</td>
                      <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString("ru-RU")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <AdminPagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default LogsPage;
