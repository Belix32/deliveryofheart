"use client";

import AdminModal from "./AdminModal";

interface AdminConfirmDeleteProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  loading?: boolean;
}

export default function AdminConfirmDelete({
  open,
  onClose,
  onConfirm,
  title = "Удалить?",
  message = "Это действие нельзя отменить.",
  loading = false,
}: AdminConfirmDeleteProps) {
  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] text-[#2D2A26] dark:text-[#E8E6E3] disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "Удаление..." : "Удалить"}
          </button>
        </>
      }
    >
      <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">{message}</p>
    </AdminModal>
  );
}
