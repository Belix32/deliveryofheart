"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { adminStyles } from "@/lib/admin/styles";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  onPageChange: (page: number) => void;
  /** zero-based page index (default false = 1-based) */
  zeroBased?: boolean;
}

export default function AdminPagination({
  page,
  totalPages,
  total,
  onPageChange,
  zeroBased = false,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const displayPage = zeroBased ? page + 1 : page;
  const canPrev = zeroBased ? page > 0 : page > 1;
  const canNext = zeroBased ? page + 1 < totalPages : page < totalPages;

  return (
    <div className={`${adminStyles.card} flex items-center justify-between px-5 py-3`}>
      <span className="text-sm text-gray-400">
        Страница {displayPage} из {totalPages}
        {total !== undefined && ` • ${total} записей`}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(zeroBased ? page - 1 : page - 1)}
          disabled={!canPrev}
          className={`${adminStyles.button} p-2`}
          aria-label="Предыдущая страница"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(zeroBased ? page + 1 : page + 1)}
          disabled={!canNext}
          className={`${adminStyles.button} p-2`}
          aria-label="Следующая страница"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
