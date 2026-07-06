"use client";

import AdminEmptyState from "./AdminEmptyState";

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
    <div className="bg-white dark:bg-[#2D2A26] rounded-2xl border border-[#F5F3F0] dark:border-[#3D3A36] overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead className="bg-[#F5F3F0] dark:bg-[#1a1a1a]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-sm font-medium text-[#2D2A26]/60 dark:text-[#E8E6E3]/60 ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F5F3F0] dark:divide-[#3D3A36]">
          {data.map((row) => (
            <tr
              key={getKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`hover:bg-gray-50 dark:hover:bg-[#1a1a1a]/50 ${onRowClick ? "cursor-pointer" : ""}`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-[#2D2A26] dark:text-[#E8E6E3] ${col.className || ""}`}
                >
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
