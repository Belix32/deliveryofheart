"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Star,
  MapPin,
  Phone,
  Clock,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import type { Restaurant } from "@/lib/database.types";
import AdminLoader from "@/components/admin/AdminLoader";
import AdminModal from "@/components/admin/AdminModal";
import AdminConfirmDelete from "@/components/admin/AdminConfirmDelete";
import AdminEmptyState from "@/components/admin/AdminEmptyState";

interface RestaurantForm {
  name: string;
  slug: string;
  address: string;
  phone: string;
  description: string;
  delivery_time_min: string;
  delivery_time_max: string;
  delivery_price: string;
  city: string;
  is_active: boolean;
}

const emptyForm = (): RestaurantForm => ({
  name: "",
  slug: "",
  address: "",
  phone: "",
  description: "",
  delivery_time_min: "30",
  delivery_time_max: "60",
  delivery_price: "0",
  city: "",
  is_active: true,
});

const RestaurantsAdminPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RestaurantForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadRestaurants = async () => {
    setLoading(true);
    const response = await fetch("/api/admin/restaurants");
    const data = await response.json();
    if (response.ok) setRestaurants(data.restaurants || []);
    setLoading(false);
  };

  useEffect(() => {
    loadRestaurants();
    fetch("/api/admin/cities")
      .then((r) => r.json())
      .then((data) =>
        setCities(
          (data.cities || [])
            .filter((c: { is_active: boolean }) => c.is_active)
            .map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))
        )
      );
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (r: Restaurant) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      slug: r.slug,
      address: r.address,
      phone: r.phone || "",
      description: r.description || "",
      delivery_time_min: String(r.delivery_time_min ?? 30),
      delivery_time_max: String(r.delivery_time_max ?? 60),
      delivery_price: String(r.delivery_price ?? 0),
      city: r.city || "",
      is_active: r.is_active ?? true,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...form,
      delivery_time_min: Number(form.delivery_time_min),
      delivery_time_max: Number(form.delivery_time_max),
      delivery_price: Number(form.delivery_price),
    };

    const response = await fetch("/api/admin/restaurants", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
    });

    if (response.ok) {
      setShowModal(false);
      loadRestaurants();
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await fetch("/api/admin/restaurants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !currentActive }),
    });
    loadRestaurants();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/admin/restaurants?id=${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    loadRestaurants();
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ru-RU").format(price || 0) + " ₽";

  const filteredRestaurants = restaurants.filter(
    (r) =>
      !searchQuery ||
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <AdminLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Рестораны</h1>
          <p className="text-[#2D2A26]/60">{restaurants.length} ресторанов</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D2A26]/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск ресторанов"
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F5F3F0] dark:bg-[#2D2A26] outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRestaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className={`bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl p-4 ${!restaurant.is_active ? "opacity-50" : ""}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                <p className="text-sm text-[#2D2A26]/60 line-clamp-2">{restaurant.description}</p>
              </div>
              <button onClick={() => toggleActive(restaurant.id, restaurant.is_active ?? false)}>
                {restaurant.is_active ? (
                  <ToggleRight className="w-6 h-6 text-primary" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                )}
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[#2D2A26]/60">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{restaurant.rating?.toFixed(1) || "0.0"}</span>
                <span className="text-xs">({restaurant.review_count || 0} отзывов)</span>
              </div>
              <div className="flex items-center gap-2 text-[#2D2A26]/60">
                <Clock className="w-4 h-4" />
                <span>
                  {restaurant.delivery_time_min}-{restaurant.delivery_time_max} мин
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#2D2A26]/60">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{restaurant.address}</span>
              </div>
              <div className="flex items-center gap-2 text-[#2D2A26]/60">
                <Phone className="w-4 h-4" />
                <span>{restaurant.phone}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#2D2A26]/10">
              <span className="font-medium">{formatPrice(restaurant.delivery_price ?? 0)} доставка</span>
              <div className="flex gap-2">
                <button onClick={() => openEdit(restaurant)} className="p-2 text-primary hover:opacity-80">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteId(restaurant.id)} className="p-2 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRestaurants.length === 0 && <AdminEmptyState title="Ресторанов не найдено" />}

      <AdminModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Редактировать ресторан" : "Новый ресторан"}
        size="lg"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36]">
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.address}
              className="px-4 py-2.5 rounded-xl bg-primary text-white disabled:opacity-50"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-[#2D2A26]/60 mb-1">Название *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-[#2D2A26]/60 mb-1">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="авто из названия"
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-[#2D2A26]/60 mb-1">Город</label>
            <select
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
            >
              <option value="">—</option>
              {cities.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-[#2D2A26]/60 mb-1">Адрес *</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-[#2D2A26]/60 mb-1">Телефон</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-[#2D2A26]/60 mb-1">Цена доставки</label>
            <input
              type="number"
              value={form.delivery_price}
              onChange={(e) => setForm({ ...form, delivery_price: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-[#2D2A26]/60 mb-1">Время доставки мин</label>
            <input
              type="number"
              value={form.delivery_time_min}
              onChange={(e) => setForm({ ...form, delivery_time_min: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-[#2D2A26]/60 mb-1">Время доставки макс</label>
            <input
              type="number"
              value={form.delivery_time_max}
              onChange={(e) => setForm({ ...form, delivery_time_max: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-[#2D2A26]/60 mb-1">Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none resize-none"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Активен</span>
          </label>
        </div>
      </AdminModal>

      <AdminConfirmDelete
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message="Ресторан и связанные данные могут быть удалены безвозвратно."
      />
    </div>
  );
};

export default RestaurantsAdminPage;
