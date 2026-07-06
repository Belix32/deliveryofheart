"use client";

import AdminEmptyState from "./AdminEmptyState";
import { adminStyles } from "@/lib/admin/styles";

export interface AdminColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface AdminDataTableProps<T> {
  columns: AdminColumn<T>[];
  data: T[];
  keyField: keyof T | ((row: T) => string);
  emptyTitle?: string;
  onRowClick?: (row: T) => void;
}

export default function AdminDataTable<T>({
  columns,
  data,
  keyField,
  emptyTitle = "Нет данных",
  onRowClick,
}: AdminDataTableProps<T>) {
  const getKey = (row: T) =>
    typeof keyField === "function" ? keyField(row) : String(row[keyField]);

  if (data.length === 0) {
    return <AdminEmptyState title={emptyTitle} />;
  }

  return (
    <div className={`${adminStyles.card} overflow-hidden overflow-x-auto`}>
      <table className={`${adminStyles.table} min-w-[640px]`}>
        <thead>
          <tr className={adminStyles.tableHead}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-sm font-medium ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={getKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`${adminStyles.tableRow} ${onRowClick ? "cursor-pointer" : ""}`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 ${col.className || ""}`}>
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
