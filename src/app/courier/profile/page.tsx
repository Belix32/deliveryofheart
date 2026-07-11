"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchCourierProfile } from "@/lib/courier-client";
import { useAuth } from "@/context/AuthContext";
import type { Courier } from "@/lib/types/courier";
import BottomNav from "@/components/courier/BottomNav";
import { ArrowLeft, User, Phone, MapPin, Bike, Star, LogOut, Settings, HelpCircle, Shield, ChevronRight } from "lucide-react";

const vehicleLabels = {
  bike: "Велосипед",
  car: "Автомобиль",
  walk: "Пешком",
  scooter: "Самокат",
};

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Courier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка профиля
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      try {
        setError(null);
        const data = await fetchCourierProfile();
        
        if (!data) {
          setError("Профиль не найден");
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error("Ошибка загрузки профиля:", err);
        setError("Не удалось загрузить профиль");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [user?.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A09] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-neutral-400">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0A0A09] flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center max-w-sm">
          <p className="text-red-400 mb-4">{error || "Профиль не найден"}</p>
          <Link
            href="/courier"
            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A09]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A09]/95 backdrop-blur-md border-b border-[#2D2A26]">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/courier"
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад</span>
          </Link>
          
          <h1 className="text-lg font-semibold text-white">Профиль</h1>
          
          <div className="w-10" />
        </div>
      </header>

      <main className="p-4 pb-20 space-y-6">
        {/* Profile card */}
        <div className="relative overflow-hidden rounded-2xl border border-[#2D2A26] bg-[#1A1918] p-5">
          {/* Background glow */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative flex items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{profile.name}</h2>
              
              {/* Rating */}
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-white">{profile.rating}</span>
                <span className="text-sm text-neutral-500">• {profile.total_deliveries} заказов</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#2D2A26] bg-[#1A1918] p-4">
            <p className="text-xs text-neutral-500 mb-1">Всего заработано</p>
            <p className="text-xl font-bold text-white">
              {formatCurrency(profile.total_earnings)}
            </p>
          </div>
          
          <div className="rounded-2xl border border-[#2D2A26] bg-[#1A1918] p-4">
            <p className="text-xs text-neutral-500 mb-1">Выполнено заказов</p>
            <p className="text-xl font-bold text-white">{profile.total_deliveries}</p>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3">
          <div className="rounded-xl bg-[#1A1918] border border-[#2D2A26] p-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-neutral-500" />
              <div>
                <p className="text-xs text-neutral-500">Телефон</p>
                <p className="text-white">{profile.phone}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-xl bg-[#1A1918] border border-[#2D2A26] p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-neutral-500" />
              <div>
                <p className="text-xs text-neutral-500">Город</p>
                <p className="text-white">{profile.current_city}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-xl bg-[#1A1918] border border-[#2D2A26] p-4">
            <div className="flex items-center gap-3">
              <Bike className="w-5 h-5 text-neutral-500" />
              <div>
                <p className="text-xs text-neutral-500">Транспорт</p>
                <p className="text-white">{vehicleLabels[profile.vehicle_type] || profile.vehicle_type}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="space-y-2">
          <Link
            href="/courier/profile/settings"
            className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1918] border border-[#2D2A26] hover:border-[#3D3A26] transition-colors"
          >
            <Settings className="w-5 h-5 text-neutral-400" />
            <span className="text-white flex-1">Настройки</span>
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </Link>
          
          <Link
            href="/courier/profile/help"
            className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1918] border border-[#2D2A26] hover:border-[#3D3A26] transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-neutral-400" />
            <span className="text-white flex-1">Помощь</span>
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </Link>
          
          <Link
            href="/courier/profile/legal"
            className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1918] border border-[#2D2A26] hover:border-[#3D3A26] transition-colors"
          >
            <Shield className="w-5 h-5 text-neutral-400" />
            <span className="text-white flex-1">Правовая информация</span>
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </Link>
          
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1A1918] border border-red-500/30 hover:border-red-500/50 transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-400" />
            <span className="text-red-400 flex-1">Выйти</span>
          </button>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-neutral-600">
          Версия приложения 1.0.0
        </p>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}