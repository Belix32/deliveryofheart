"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  X,
  Check,
  Store,
  Loader2,
  AlertCircle,
  UserCog,
} from "lucide-react";

interface RestaurantAdmin {
  user_role_id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  restaurant_id: string | null;
  restaurant_name: string | null;
  role_name: string | null;
  role_display_name: string | null;
  is_active: boolean | null;
  assigned_at: string | null;
}

interface RestaurantOption {
  id: string;
  name: string;
}

interface RoleOption {
  name: string;
  display_name: string;
}

export default function RestaurantAdminsPage() {
  const [admins, setAdmins] = useState<RestaurantAdmin[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurantFilter, setRestaurantFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [assignEmail, setAssignEmail] = useState("");
  const [assignRole, setAssignRole] = useState("");
  const [assignRestaurant, setAssignRestaurant] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/admin/restaurant-admins");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ошибка загрузки");
      }

      const data = await response.json();
      setAdmins(data.admins || []);
      setRestaurants(data.restaurants || []);
      setRoles(data.roles || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ошибка загрузки данных";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAdmins = admins.filter((a) => {
    const matchesSearch =
      !searchQuery ||
      a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRestaurant =
      !restaurantFilter || a.restaurant_id === restaurantFilter;

    return matchesSearch && matchesRestaurant;
  });

  const handleAssign = async () => {
    if (!assignEmail.trim() || !assignRole || !assignRestaurant) return;

    try {
      setIsAssigning(true);
      setError(null);

      const response = await fetch("/api/admin/restaurant-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: assignEmail.trim(),
          role_name: assignRole,
          restaurant_id: assignRestaurant,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ошибка");
      }

      setShowModal(false);
      setAssignEmail("");
      setAssignRole("");
      setAssignRestaurant("");
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ошибка назначения роли";
      setError(message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeactivate = async (userRoleId: string) => {
    if (!confirm("Деактивировать роль этого администратора?")) return;

    try {
      setError(null);
      const response = await fetch(
        `/api/admin/restaurant-admins?user_role_id=${userRoleId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ошибка");
      }

      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ошибка деактивации";
      setError(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Админы ресторанов</h1>
          <p className="text-neutral-400">
            Назначение владельцев и администраторов ресторанов
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Назначить
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Поиск по email, имени или ресторану..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1A1918] border border-[#2D2A26] text-white placeholder-neutral-500 focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={restaurantFilter}
          onChange={(e) => setRestaurantFilter(e.target.value)}
          className="px-4 py-3 rounded-xl bg-[#1A1918] border border-[#2D2A26] text-white focus:outline-none focus:border-primary min-w-[200px]"
        >
          <option value="">Все рестораны</option>
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-[#2D2A26] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#1A1918] text-neutral-400 text-sm">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Ресторан</th>
              <th className="px-4 py-3 font-medium">Роль</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Назначен</th>
              <th className="px-4 py-3 font-medium w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2D2A26]">
            {filteredAdmins.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                  <UserCog className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  Нет назначенных админов ресторанов
                </td>
              </tr>
            ) : (
              filteredAdmins.map((admin) => (
                <tr key={admin.user_role_id} className="bg-[#111111] hover:bg-[#1A1918]">
                  <td className="px-4 py-3">
                    <p className="text-white">{admin.email || "—"}</p>
                    {admin.full_name && (
                      <p className="text-sm text-neutral-500">{admin.full_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-white">
                      <Store className="w-4 h-4 text-neutral-400" />
                      {admin.restaurant_name || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white">
                    {admin.role_display_name || admin.role_name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                        admin.is_active
                          ? "bg-green-500/20 text-green-400"
                          : "bg-neutral-500/20 text-neutral-400"
                      }`}
                    >
                      {admin.is_active ? "Активен" : "Неактивен"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-400">
                    {admin.assigned_at
                      ? new Date(admin.assigned_at).toLocaleDateString("ru-RU")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {admin.is_active && (
                      <button
                        onClick={() => handleDeactivate(admin.user_role_id)}
                        className="text-neutral-500 hover:text-red-400 transition-colors"
                        title="Деактивировать"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#1A1918] border border-[#2D2A26]">
            <h2 className="text-xl font-semibold text-white mb-4">
              Назначить админа ресторана
            </h2>

            <div className="mb-4">
              <label className="block text-sm text-neutral-400 mb-2">Email пользователя</label>
              <input
                type="email"
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-3 rounded-xl bg-[#2D2A26] border border-[#3D3A36] text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-neutral-400 mb-2">Роль</label>
              <select
                value={assignRole}
                onChange={(e) => setAssignRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#2D2A26] border border-[#3D3A36] text-white focus:outline-none focus:border-primary"
              >
                <option value="">Выберите роль</option>
                {roles.map((role) => (
                  <option key={role.name} value={role.name}>
                    {role.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-neutral-400 mb-2">Ресторан</label>
              <select
                value={assignRestaurant}
                onChange={(e) => setAssignRestaurant(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#2D2A26] border border-[#3D3A36] text-white focus:outline-none focus:border-primary"
              >
                <option value="">Выберите ресторан</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setAssignEmail("");
                  setAssignRole("");
                  setAssignRestaurant("");
                }}
                className="flex-1 py-3 rounded-xl bg-[#2D2A26] text-white hover:bg-[#3D3A36]"
              >
                Отмена
              </button>
              <button
                onClick={handleAssign}
                disabled={
                  !assignEmail.trim() || !assignRole || !assignRestaurant || isAssigning
                }
                className="flex-1 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAssigning ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Назначить
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
