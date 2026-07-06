"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import AdminLoader from "@/components/admin/AdminLoader";
import AdminModal from "@/components/admin/AdminModal";
import AdminConfirmDelete from "@/components/admin/AdminConfirmDelete";
import AdminDataTable, { type AdminColumn } from "@/components/admin/AdminDataTable";

interface CategoryRow {
  id: string;
  name: string;
  is_active: boolean | null;
  sort_order: number | null;
  restaurant_id: string;
  restaurants: { name: string | null; city: string | null } | null;
}

interface CategoryForm {
  name: string;
  restaurant_id: string;
  sort_order: string;
  is_active: boolean;
}

const emptyForm = (): CategoryForm => ({
  name: "",
  restaurant_id: "",
  sort_order: "0",
  is_active: true,
});

const CategoriesGlobalPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/categories");
    const data = await response.json();
    if (response.ok) setCategories(data.categories || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
    fetch("/api/admin/restaurants")
      .then((r) => r.json())
      .then((data) =>
        setRestaurants((data.restaurants || []).map((r: { id: string; name: string }) => ({
          id: r.id,
          name: r.name,
        })))
      );
  }, [loadCategories]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (cat: CategoryRow) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      restaurant_id: cat.restaurant_id,
      sort_order: String(cat.sort_order ?? 0),
      is_active: cat.is_active ?? true,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: form.name,
      restaurant_id: form.restaurant_id,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };

    const response = await fetch("/api/admin/categories", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
    });

    if (response.ok) {
      setShowModal(false);
      loadCategories();
    }
    setSaving(false);
  };

  const toggleActive = async (cat: CategoryRow) => {
    await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cat.id, is_active: !cat.is_active }),
    });
    loadCategories();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/admin/categories?id=${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    loadCategories();
  };

  const columns: AdminColumn<CategoryRow>[] = [
    { key: "sort_order", header: "Сорт.", className: "w-16" },
    { key: "name", header: "Название", render: (cat) => <span className="font-medium">{cat.name}</span> },
    {
      key: "restaurant",
      header: "Ресторан",
      render: (cat) => (
        <span className="text-sm text-[#2D2A26]/70">
          {cat.restaurants?.name || "—"}
          {cat.restaurants?.city ? ` (${cat.restaurants.city})` : ""}
        </span>
      ),
    },
    {
      key: "status",
      header: "Статус",
      render: (cat) => (
        <button onClick={() => toggleActive(cat)}>
          {cat.is_active ? (
            <ToggleRight className="w-6 h-6 text-primary" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-gray-400" />
          )}
        </button>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (cat) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => openEdit(cat)} className="p-1.5 text-primary hover:opacity-80">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteId(cat.id)} className="p-1.5 text-red-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <AdminLoader />;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Категории меню</h1>
          <p className="text-[#2D2A26]/60">{categories.length} категорий в ресторанах</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl">
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      <AdminDataTable columns={columns} data={categories} keyField="id" emptyTitle="Категорий пока нет" />

      <AdminModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Редактировать категорию" : "Новая категория"}
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36]">
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.restaurant_id}
              className="px-4 py-2.5 rounded-xl bg-primary text-white disabled:opacity-50"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#2D2A26]/60 mb-1">Название *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-[#2D2A26]/60 mb-1">Ресторан *</label>
            <select
              value={form.restaurant_id}
              onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
            >
              <option value="">Выберите ресторан</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#2D2A26]/60 mb-1">Порядок сортировки</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            <span className="text-sm">Активна</span>
          </label>
        </div>
      </AdminModal>

      <AdminConfirmDelete
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message="Категория будет удалена. Позиции меню могут остаться без категории."
      />
    </div>
  );
};

export default CategoriesGlobalPage;
