"use client";

import { adminStyles } from "@/lib/admin/styles";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function AdminPageHeader({ title, subtitle, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className={adminStyles.pageTitle}>{title}</h1>
        {subtitle && <p className={adminStyles.pageSubtitle}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}
