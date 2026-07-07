"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, MapPin, Package, Loader2 } from "lucide-react";

interface CityRow {
  id: string;
  name: string;
  region: string | null;
  is_active: boolean;
  restaurants_count: number;
  orders_count: number;
}

const CitiesPage: React.FC = () => {
  const [cities, setCities] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCity, setEditingCity] = useState<CityRow | null>(null);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCities = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/cities");
    const data = await response.json();
    if (response.ok) setCities(data.cities || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  const openCreate = () => {
    setEditingCity(null);
    setName("");
    setRegion("");
    setShowModal(true);
  };

  const openEdit = (city: CityRow) => {
    setEditingCity(city);
    setName(city.name);
    setRegion(city.region || "");
    setShowModal(true);
  };

  const saveCity = async () => {
    if (!name.trim()) return;
    setSaving(true);

    if (editingCity) {
      await fetch("/api/admin/cities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingCity.id, name: name.trim(), region: region.trim() || null }),
      });
    } else {
      await fetch("/api/admin/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), region: region.trim() || null }),
      });
    }

    setSaving(false);
    setShowModal(false);
    loadCities();
  };

  const toggleActive = async (city: CityRow) => {
    await fetch("/api/admin/cities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: city.id, is_active: !city.is_active }),
    });
    loadCities();
  };

  const deleteCity = async (id: string) => {
    if (!confirm("Удалить город?")) return;
    await fetch(`/api/admin/cities?id=${id}`, { method: "DELETE" });
    loadCities();
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
          <h1 className="text-2xl font-display font-bold">Города</h1>
          <p className="text-[#2D2A26]/60">Управление городами доставки</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl">
          <Plus className="w-4 h-4" />Добавить город
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map((city) => (
          <div key={city.id} className="bg-white dark:bg-[#2D2A26] rounded-2xl border border-[#F5F3F0] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl"><MapPin className="w-5 h-5 text-primary" /></div>
                <div>
                  <h3 className="font-semibold">{city.name}</h3>
                  <p className="text-sm text-[#2D2A26]/60">{city.region || "—"}</p>
                </div>
              </div>
              <button onClick={() => toggleActive(city)} className={`p-2 rounded-full ${city.is_active ? "bg-green-500" : "bg-gray-400"}`}>
                {city.is_active ? <ToggleRight className="w-5 h-5 text-white" /> : <ToggleLeft className="w-5 h-5 text-white" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#2D2A26]/60">{city.restaurants_count} ресторанов</span>
              <span className="text-[#2D2A26]/60 flex items-center gap-1"><Package className="w-3.5 h-3.5" />{city.orders_count} заказов</span>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => openEdit(city)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#F5F3F0] rounded-lg"><Edit className="w-4 h-4" />Изменить</button>
              <button onClick={() => deleteCity(city.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {cities.length === 0 && (
        <p className="text-center text-[#2D2A26]/60 py-12">Городов пока нет. Добавьте первый город.</p>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#2D2A26] rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{editingCity ? "Изменить город" : "Добавить город"}</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">Название</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0]" placeholder="Название города" /></div>
              <div><label className="block text-sm font-medium mb-2">Область</label><input type="text" value={region} onChange={(e) => setRegion(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0]" placeholder="Область" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-[#F5F3F0] rounded-xl">Отмена</button>
              <button onClick={saveCity} disabled={saving} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl disabled:opacity-50">{saving ? "Сохранение..." : "Сохранить"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitiesPage;
