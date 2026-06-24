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
  Eye,
} from "lucide-react";
import { supabase, Restaurant } from "@/lib/supabase";

const RestaurantsAdminPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .order('name');
    
    if (data) {
      setRestaurants(data);
    }
    setLoading(false);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await supabase
      .from('restaurants')
      .update({ is_active: !currentActive })
      .eq('id', id);
    
    loadRestaurants();
  };

  const deleteRestaurant = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот ресторан?')) {
      await supabase.from('restaurants').delete().eq('id', id);
      loadRestaurants();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price || 0) + ' ₽';
  };

  const filteredRestaurants = restaurants.filter((r) =>
    !searchQuery ||
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Рестораны</h1>
          <p className="text-[#2D2A26]/60">{restaurants.length} ресторанов</p>
        </div>
      </div>

      {/* Search */}
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

      {/* Restaurants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRestaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className={`bg-[#F5F3F0] dark:bg-[#2D2A26] rounded-2xl p-4 ${
              !restaurant.is_active ? 'opacity-50' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                <p className="text-sm text-[#2D2A26]/60 line-clamp-2">
                  {restaurant.description}
                </p>
              </div>
              <button
                onClick={() => toggleActive(restaurant.id, restaurant.is_active ?? false)}
                className="text-primary"
              >
                {restaurant.is_active ? (
                  <ToggleRight className="w-6 h-6" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                )}
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[#2D2A26]/60">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{restaurant.rating?.toFixed(1) || '0.0'}</span>
                <span className="text-xs">({restaurant.review_count || 0} отзывов)</span>
              </div>
              <div className="flex items-center gap-2 text-[#2D2A26]/60">
                <Clock className="w-4 h-4" />
                <span>{restaurant.delivery_time_min}-{restaurant.delivery_time_max} мин</span>
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
                <button
                  onClick={() => deleteRestaurant(restaurant.id)}
                  className="p-2 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRestaurants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#2D2A26]/60">Ресторанов не найдено</p>
        </div>
      )}
    </div>
  );
};

export default RestaurantsAdminPage;