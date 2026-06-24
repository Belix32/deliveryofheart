"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Users, Search, Plus, X, Check, 
  Store, Shield, Truck, User,
  Loader2, AlertCircle, ChevronDown
} from "lucide-react";

interface UserRole {
  id: string;
  name: string;
  display_name: string;
  restaurant_id: string | null;
  restaurant_name: string | null;
  is_active: boolean;
}

interface UserData {
  id: string;
  email: string;
  created_at: string;
  roles: UserRole[];
}

interface Role {
  id: string;
  name: string;
  display_name: string;
}

interface RestaurantData {
  id: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedUsers = filteredUsers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setError("Требуется авторизация для просмотра пользователей");
        setIsLoading(false);
        return;
      }
      
      // Real API call
      const response = await fetch('/api/admin/users');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка загрузки');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setRoles(data.roles || []);
      setRestaurants(data.restaurants || []);
    } catch (err: any) {
      console.error('[Users] Error:', err);
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      setIsAssigning(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_user_id: selectedUser.id,
          role_name: selectedRole,
          restaurant_id: selectedRestaurant || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка');
      }

      setShowAddModal(false);
      setSelectedUser(null);
      setSelectedRole("");
      setSelectedRestaurant("");
      fetchData();
    } catch (err: any) {
      console.error('[Assign] Error:', err);
      setError(err.message || 'Ошибка назначения роли');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveRole = async (userRoleId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/admin/users?user_role_id=${userRoleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка');
      }

      fetchData();
    } catch (err: any) {
      console.error('[Remove] Error:', err);
      setError(err.message || 'Ошибка удаления роли');
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'restaurant_owner':
      case 'restaurant_admin':
        return <Store className="w-4 h-4" />;
      case 'courier':
        return <Truck className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Пользователи</h1>
          <p className="text-neutral-400">Управление пользователями и ролями</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Поиск по email..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#1A1918] border border-[#2D2A26] text-white placeholder-neutral-500 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {paginatedUsers.map((user) => (
          <div
            key={user.id}
            className="p-4 rounded-xl bg-[#1A1918] border border-[#2D2A26]"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-white">{user.email}</p>
                <p className="text-sm text-neutral-500">
                  Создан: {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </p>
                
                {/* Roles */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {user.roles.filter(r => r.is_active).map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2D2A26] text-sm"
                    >
                      {getRoleIcon(role.name)}
                      <span className="text-white">{role.display_name}</span>
                      {role.restaurant_name && (
                        <span className="text-neutral-400">• {role.restaurant_name}</span>
                      )}
                      <button
                        onClick={() => handleRemoveRole(role.id)}
                        className="ml-1 text-neutral-500 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowAddModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-sm hover:bg-primary/30"
                  >
                    <Plus className="w-3 h-3" />
                    Добавить роль
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-4 py-2 rounded-lg bg-[#2D2A26] text-white disabled:opacity-40"
          >
            Назад
          </button>
          <span className="text-neutral-400 text-sm">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg bg-[#2D2A26] text-white disabled:opacity-40"
          >
            Далее
          </button>
        </div>
      )}

      {/* Add Role Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#1A1918] border border-[#2D2A26]">
            <h2 className="text-xl font-semibold text-white mb-4">
              Назначить роль
            </h2>
            
            <p className="text-neutral-400 mb-4">
              {selectedUser?.email}
            </p>

            {/* Role Select */}
            <div className="mb-4">
              <label className="block text-sm text-neutral-400 mb-2">Роль</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#2D2A26] border border-[#3D3A36] text-white focus:outline-none focus:border-primary"
              >
                <option value="">Выберите роль</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Restaurant Select (for restaurant roles) */}
            {['restaurant_owner', 'restaurant_admin'].includes(selectedRole) && (
              <div className="mb-4">
                <label className="block text-sm text-neutral-400 mb-2">Ресторан</label>
                <select
                  value={selectedRestaurant}
                  onChange={(e) => setSelectedRestaurant(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#2D2A26] border border-[#3D3A36] text-white focus:outline-none focus:border-primary"
                >
                  <option value="">Выберите ресторан</option>
                  {restaurants.map((rest) => (
                    <option key={rest.id} value={rest.id}>
                      {rest.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedUser(null);
                  setSelectedRole("");
                  setSelectedRestaurant("");
                }}
                className="flex-1 py-3 rounded-xl bg-[#2D2A26] text-white hover:bg-[#3D3A36]"
              >
                Отмена
              </button>
              <button
                onClick={handleAssignRole}
                disabled={!selectedRole || isAssigning}
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