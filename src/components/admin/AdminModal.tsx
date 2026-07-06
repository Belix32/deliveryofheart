"use client";

import { X } from "lucide-react";

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export default function AdminModal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: AdminModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative bg-white dark:bg-[#2D2A26] rounded-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col shadow-xl`}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#F5F3F0] dark:border-[#3D3A36]">
          <h3 className="text-lg font-semibold text-[#2D2A26] dark:text-[#E8E6E3]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#F5F3F0] dark:hover:bg-[#3D3A36] transition-colors"
          >
            <X className="w-5 h-5 text-[#2D2A26]/60" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="p-6 border-t border-[#F5F3F0] dark:border-[#3D3A36] flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
