"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface BannerRow {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  city: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  starts_at: string | null;
  ends_at: string | null;
}

function formatDateRange(starts: string | null, ends: string | null) {
  const fmt = (d: string) => new Date(d).toLocaleDateString("ru-RU");
  if (starts && ends) return `${fmt(starts)} – ${fmt(ends)}`;
  if (starts) return `с ${fmt(starts)}`;
  if (ends) return `до ${fmt(ends)}`;
  return "Без ограничений";
}

function toDateInput(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

const BannersPage: React.FC = () => {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BannerRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [city, setCity] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const loadBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/banners");
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Ошибка загрузки");
      setBanners([]);
    } else {
      setBanners(data.banners || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setSubtitle("");
    setImageUrl("");
    setLinkUrl("");
    setCity("");
    setStartsAt("");
    setEndsAt("");
    setShowModal(true);
  };

  const openEdit = (banner: BannerRow) => {
    setEditing(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || "");
    setImageUrl(banner.image_url);
    setLinkUrl(banner.link_url || "");
    setCity(banner.city || "");
    setStartsAt(toDateInput(banner.starts_at));
    setEndsAt(toDateInput(banner.ends_at));
    setShowModal(true);
  };

  const saveBanner = async () => {
    if (!title.trim() || !imageUrl.trim()) return;
    setSaving(true);

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      image_url: imageUrl.trim(),
      link_url: linkUrl.trim() || null,
      city: city.trim() || null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    };

    const response = editing
      ? await fetch("/api/admin/banners", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload }),
        })
      : await fetch("/api/admin/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setSaving(false);
    if (!response.ok) {
      const data = await response.json();
      alert(data.error || "Ошибка сохранения");
      return;
    }

    setShowModal(false);
    loadBanners();
  };

  const toggleActive = async (banner: BannerRow) => {
    await fetch("/api/admin/banners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: banner.id, is_active: !banner.is_active }),
    });
    loadBanners();
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Удалить баннер?")) return;
    await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" });
    loadBanners();
  };

  const moveBanner = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= banners.length) return;

    const reorder = banners.map((b, i) => {
      if (i === index) return { id: b.id, sort_order: swapIndex + 1 };
      if (i === swapIndex) return { id: b.id, sort_order: index + 1 };
      return { id: b.id, sort_order: i + 1 };
    });

    await fetch("/api/admin/banners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reorder }),
    });
    loadBanners();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Баннеры</h1>
          <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">Баннеры на главной странице</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Добавить баннер
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {banners.length === 0 ? (
        <div className="bg-white dark:bg-[#2D2A26] rounded-2xl border p-12 text-center text-[#2D2A26]/60">
          Баннеров пока нет. Создайте первый баннер.
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="bg-white dark:bg-[#2D2A26] rounded-2xl border border-[#F5F3F0] dark:border-[#3D3A36] p-4 flex flex-col md:flex-row gap-4"
            >
              <div className="w-full md:w-48 h-32 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl overflow-hidden">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120'%3E%3Crect fill='%23ddd' width='200' height='120'/%3E%3C/svg%3E";
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{banner.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#2D2A26]/60">Позиция: {banner.sort_order ?? index + 1}</span>
                    <button
                      onClick={() => moveBanner(index, "up")}
                      disabled={index === 0}
                      className="p-1 hover:bg-[#F5F3F0] dark:hover:bg-[#3D3A36] rounded disabled:opacity-30"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveBanner(index, "down")}
                      disabled={index === banners.length - 1}
                      className="p-1 hover:bg-[#F5F3F0] dark:hover:bg-[#3D3A36] rounded disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {banner.subtitle && <p className="text-[#2D2A26]/70 dark:text-[#E8E6E3]/70 mb-2">{banner.subtitle}</p>}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-[#2D2A26]/50">{formatDateRange(banner.starts_at, banner.ends_at)}</span>
                  {banner.city && <span className="text-[#2D2A26]/50">{banner.city}</span>}
                  {banner.link_url && <span className="text-primary">{banner.link_url}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(banner)}
                  className={`p-2 rounded-full ${banner.is_active ? "bg-green-500" : "bg-gray-400"}`}
                >
                  {banner.is_active ? (
                    <ToggleRight className="w-5 h-5 text-white" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-white" />
                  )}
                </button>
                <button
                  onClick={() => openEdit(banner)}
                  className="p-2 hover:bg-[#F5F3F0] dark:hover:bg-[#3D3A36] rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteBanner(banner.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#2D2A26] rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editing ? "Редактировать баннер" : "Добавить баннер"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Заголовок</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0"
                  placeholder="Заголовок"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Подзаголовок</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0"
                  placeholder="Текст"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">URL изображения</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0"
                  placeholder="https://"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ссылка</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0"
                  placeholder="/catalog"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Город</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0"
                  placeholder="Сураж (пусто = все города)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Дата начала</label>
                  <input
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Дата окончания</label>
                  <input
                    type="date"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl"
              >
                Отмена
              </button>
              <button
                onClick={saveBanner}
                disabled={saving || !title.trim() || !imageUrl.trim()}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl disabled:opacity-50"
              >
                {saving ? "Сохранение..." : editing ? "Сохранить" : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannersPage;
