"use client";

import type { LucideIcon } from "lucide-react";

interface AdminEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
}

export default function AdminEmptyState({
  icon: Icon,
  title = "Ничего не найдено",
  description,
}: AdminEmptyStateProps) {
  return (
    <div className="text-center py-12">
      {Icon && <Icon className="w-12 h-12 mx-auto mb-4 text-[#2D2A26]/30 dark:text-[#E8E6E3]/30" />}
      <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">{title}</p>
      {description && (
        <p className="text-sm text-[#2D2A26]/40 dark:text-[#E8E6E3]/40 mt-2">{description}</p>
      )}
    </div>
  );
}
