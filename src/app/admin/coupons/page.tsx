"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, ToggleLeft, ToggleRight, Copy } from "lucide-react";
import AdminLoader from "@/components/admin/AdminLoader";
import AdminModal from "@/components/admin/AdminModal";
import AdminConfirmDelete from "@/components/admin/AdminConfirmDelete";
import AdminEmptyState from "@/components/admin/AdminEmptyState";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  valid_to: string;
  scope: string;
}

interface CouponForm {
  code: string;
  description: string;
  discount_type: string;
  discount_value: string;
  min_order_amount: string;
  max_uses: string;
  valid_to: string;
  scope: string;
  is_active: boolean;
}

const emptyForm = (): CouponForm => ({
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: "10",
  min_order_amount: "0",
  max_uses: "",
  valid_to: "",
  scope: "food",
  is_active: true,
});

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CouponForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCoupons = async () => {
    setLoading(true);
    const response = await fetch("/api/admin/coupons");
    const data = await response.json();
    if (response.ok) setCoupons(data.coupons || []);
    setLoading(false);
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    const response = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        discount_value: Number(form.discount_value),
        min_order_amount: Number(form.min_order_amount),
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        valid_to: form.valid_to || null,
      }),
    });
    if (response.ok) {
      setShowModal(false);
      setForm(emptyForm());
      loadCoupons();
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !active }),
    });
    loadCoupons();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/admin/coupons?id=${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    loadCoupons();
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ru-RU").format(price || 0) + " ₽";
  const formatDate = (date: string) =>
    date ? new Date(date).toLocaleDateString("ru-RU") : "Без срока";

  const filteredCoupons = coupons.filter(
    (c) => !searchQuery || c.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <AdminLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Промокоды</h1>
          <p className="text-[#2D2A26]/60">{coupons.length} промокодов</p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm());
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Создать
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D2A26]/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по коду"
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F5F3F0] dark:bg-[#2D2A26] outline-none"
        />
      </div>

      <div className="space-y-4">
        {filteredCoupons.map((coupon) => (
          <div
            key={coupon.id}
            className={`bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl p-4 ${!coupon.is_active ? "opacity-50" : ""}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <code className="text-xl font-bold font-mono">{coupon.code}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(coupon.code)}
                    className="p-1 text-[#2D2A26]/40 hover:text-[#2D2A26]"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-[#2D2A26]/60">{coupon.description}</p>
              </div>
              <button onClick={() => toggleActive(coupon.id, coupon.is_active)}>
                {coupon.is_active ? (
                  <ToggleRight className="w-6 h-6 text-primary" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                )}
              </button>
            </div>
            <div className="flex gap-4 mt-3 text-sm text-[#2D2A26]/60">
              <span>
                {coupon.discount_type === "percent"
                  ? `${coupon.discount_value}%`
                  : formatPrice(coupon.discount_value)}
              </span>
              <span>от {formatPrice(coupon.min_order_amount)}</span>
              <span>
                {coupon.used_count}/{coupon.max_uses || "∞"}
              </span>
              <span>до {formatDate(coupon.valid_to)}</span>
            </div>
            <div className="flex justify-end mt-3 pt-3 border-t border-[#2D2A26]/10">
              <button onClick={() => setDeleteId(coupon.id)} className="p-2 text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCoupons.length === 0 && <AdminEmptyState title="Промокоды не найдены" />}

      <AdminModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Новый промокод"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36]">
              Отмена
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !form.code}
              className="px-4 py-2.5 rounded-xl bg-primary text-white disabled:opacity-50"
            >
              {saving ? "Создание..." : "Создать"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#2D2A26]/60 mb-1">Код *</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-sm text-[#2D2A26]/60 mb-1">Описание</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#2D2A26]/60 mb-1">Тип скидки</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
              >
                <option value="percent">Процент</option>
                <option value="fixed">Фиксированная</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#2D2A26]/60 mb-1">Значение</label>
              <input
                type="number"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2D2A26]/60 mb-1">Мин. сумма</label>
              <input
                type="number"
                value={form.min_order_amount}
                onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2D2A26]/60 mb-1">Макс. использований</label>
              <input
                type="number"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                placeholder="∞"
                className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2D2A26]/60 mb-1">Действует до</label>
              <input
                type="date"
                value={form.valid_to}
                onChange={(e) => setForm({ ...form, valid_to: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2D2A26]/60 mb-1">Область</label>
              <select
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#1a1a1a] outline-none"
              >
                <option value="food">Еда</option>
                <option value="grocery">Продукты</option>
              </select>
            </div>
          </div>
        </div>
      </AdminModal>

      <AdminConfirmDelete
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message="Промокод будет удалён безвозвратно."
      />
    </div>
  );
}
