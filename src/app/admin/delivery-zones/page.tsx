"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface CityOption {
  id: string;
  name: string;
}

interface ZoneRow {
  id: string;
  city_id: string | null;
  city_name: string | null;
  name: string;
  delivery_price: number | null;
  min_order_amount: number | null;
  is_active: boolean | null;
}

const DeliveryZonesPage: React.FC = () => {
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ZoneRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [cityId, setCityId] = useState("");
  const [name, setName] = useState("");
  const [deliveryPrice, setDeliveryPrice] = useState("0");
  const [minOrderAmount, setMinOrderAmount] = useState("0");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [zonesRes, citiesRes] = await Promise.all([
      fetch("/api/admin/delivery-zones"),
      fetch("/api/admin/cities"),
    ]);

    const zonesData = await zonesRes.json();
    const citiesData = await citiesRes.json();

    if (!zonesRes.ok) {
      setError(zonesData.error || "Ошибка загрузки зон");
      setZones([]);
    } else {
      setZones(zonesData.zones || []);
    }

    if (citiesRes.ok) {
      setCities((citiesData.cities || []).map((c: CityOption) => ({ id: c.id, name: c.name })));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setCityId(cities[0]?.id || "");
    setName("");
    setDeliveryPrice("0");
    setMinOrderAmount("0");
    setShowModal(true);
  };

  const openEdit = (zone: ZoneRow) => {
    setEditing(zone);
    setCityId(zone.city_id || "");
    setName(zone.name);
    setDeliveryPrice(String(zone.delivery_price ?? 0));
    setMinOrderAmount(String(zone.min_order_amount ?? 0));
    setShowModal(true);
  };

  const saveZone = async () => {
    if (!name.trim() || !cityId) return;
    setSaving(true);

    const payload = {
      city_id: cityId,
      name: name.trim(),
      delivery_price: parseFloat(deliveryPrice) || 0,
      min_order_amount: parseFloat(minOrderAmount) || 0,
    };

    const response = editing
      ? await fetch("/api/admin/delivery-zones", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload }),
        })
      : await fetch("/api/admin/delivery-zones", {
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
    loadData();
  };

  const toggleActive = async (zone: ZoneRow) => {
    await fetch("/api/admin/delivery-zones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: zone.id, is_active: !zone.is_active }),
    });
    loadData();
  };

  const deleteZone = async (id: string) => {
    if (!confirm("Удалить зону доставки?")) return;
    await fetch(`/api/admin/delivery-zones?id=${id}`, { method: "DELETE" });
    loadData();
  };

  const grouped = cities.map((city) => ({
    city,
    zones: zones.filter((z) => z.city_id === city.id),
  }));

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
          <h1 className="text-2xl font-display font-bold">Зоны доставки</h1>
          <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">Тарифы доставки по городам</p>
        </div>
        <button
          onClick={openCreate}
          disabled={cities.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Добавить зону
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {cities.length === 0 ? (
        <div className="bg-white dark:bg-[#2D2A26] rounded-2xl border p-12 text-center text-[#2D2A26]/60">
          Сначала добавьте города в разделе «Города».
        </div>
      ) : zones.length === 0 ? (
        <div className="bg-white dark:bg-[#2D2A26] rounded-2xl border p-12 text-center text-[#2D2A26]/60">
          Зон доставки пока нет. Создайте первую зону.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped
            .filter((g) => g.zones.length > 0)
            .map(({ city, zones: cityZones }) => (
              <div
                key={city.id}
                className="bg-white dark:bg-[#2D2A26] rounded-2xl border border-[#F5F3F0] dark:border-[#3D3A36] overflow-hidden"
              >
                <div className="px-5 py-3 bg-[#F5F3F0] dark:bg-[#3D3A36] font-semibold">{city.name}</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#F5F3F0] dark:border-[#3D3A36] text-left text-[#2D2A26]/60">
                        <th className="px-5 py-3 font-medium">Название</th>
                        <th className="px-5 py-3 font-medium">Доставка, ₽</th>
                        <th className="px-5 py-3 font-medium">Мин. заказ, ₽</th>
                        <th className="px-5 py-3 font-medium">Статус</th>
                        <th className="px-5 py-3 font-medium">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cityZones.map((zone) => (
                        <tr key={zone.id} className="border-b border-[#F5F3F0] dark:border-[#3D3A36] last:border-0">
                          <td className="px-5 py-3 font-medium">{zone.name}</td>
                          <td className="px-5 py-3">{zone.delivery_price ?? 0}</td>
                          <td className="px-5 py-3">{zone.min_order_amount ?? 0}</td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => toggleActive(zone)}
                              className={`p-1.5 rounded-full ${zone.is_active ? "bg-green-500" : "bg-gray-400"}`}
                            >
                              {zone.is_active ? (
                                <ToggleRight className="w-4 h-4 text-white" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-white" />
                              )}
                            </button>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEdit(zone)}
                                className="p-1.5 hover:bg-[#F5F3F0] dark:hover:bg-[#3D3A36] rounded"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteZone(zone.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#2D2A26] rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{editing ? "Редактировать зону" : "Добавить зону"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Город</label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0"
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Название зоны</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0"
                  placeholder="Центр"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Доставка, ₽</label>
                  <input
                    type="number"
                    min="0"
                    value={deliveryPrice}
                    onChange={(e) => setDeliveryPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Мин. заказ, ₽</label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
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
                onClick={saveZone}
                disabled={saving || !name.trim() || !cityId}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl disabled:opacity-50"
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryZonesPage;
