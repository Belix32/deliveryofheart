"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings as SettingsIcon,
  Percent,
  DollarSign,
  Bell,
  CreditCard,
  Shield,
  Palette,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface CityOption {
  id: string;
  name: string;
}

type SettingsMap = Record<string, string | number>;

const SettingsPage: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cities, setCities] = useState<CityOption[]>([]);

  const [defaultCity, setDefaultCity] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [platformCommission, setPlatformCommission] = useState("15");
  const [deliveryFee, setDeliveryFee] = useState("250");
  const [minOrderAmount, setMinOrderAmount] = useState("500");

  const tabs = [
    { id: "general", label: "Общие", icon: SettingsIcon },
    { id: "monetization", label: "Монетизация", icon: Percent },
    { id: "payments", label: "Платежи", icon: DollarSign },
    { id: "notifications", label: "Уведомления", icon: Bell },
    { id: "integrations", label: "Интеграции", icon: CreditCard },
    { id: "security", label: "Безопасность", icon: Shield },
    { id: "appearance", label: "Внешний вид", icon: Palette },
  ];

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [settingsRes, citiesRes] = await Promise.all([
      fetch("/api/admin/settings"),
      fetch("/api/admin/cities"),
    ]);

    const settingsData = await settingsRes.json();
    const citiesData = await citiesRes.json();

    if (!settingsRes.ok) {
      setError(settingsData.error || "Ошибка загрузки настроек");
    } else {
      const s: SettingsMap = settingsData.settings || {};
      setDefaultCity(String(s.default_city || ""));
      setSupportEmail(String(s.support_email || ""));
      setSupportPhone(String(s.support_phone || ""));
      setPlatformCommission(String(s.platform_commission_percent ?? "15"));
      setDeliveryFee(String(s.delivery_fee ?? "250"));
      setMinOrderAmount(String(s.min_order_amount ?? "500"));
    }

    if (citiesRes.ok) {
      setCities((citiesData.cities || []).map((c: CityOption) => ({ id: c.id, name: c.name })));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          default_city: defaultCity,
          support_email: supportEmail,
          support_phone: supportPhone,
          platform_commission_percent: parseFloat(platformCommission) || 0,
          delivery_fee: parseFloat(deliveryFee) || 0,
          min_order_amount: parseFloat(minOrderAmount) || 0,
        },
      }),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error || "Ошибка сохранения");
      return;
    }

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
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
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Настройки</h1>
        <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">Настройка системы</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl">
          <CheckCircle className="w-5 h-5" />
          Настройки сохранены
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-[#2D2A26] rounded-2xl border border-[#F5F3F0] dark:border-[#3D3A36] p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary/10 dark:bg-primary-dark/10 text-primary dark:text-primary-dark"
                      : "hover:bg-[#F5F3F0] dark:hover:bg-[#3D3A36]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white dark:bg-[#2D2A26] rounded-2xl border border-[#F5F3F0] dark:border-[#3D3A36] p-6">
            {activeTab === "general" && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold">Общие настройки</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Город по умолчанию</label>
                    <select
                      value={defaultCity}
                      onChange={(e) => setDefaultCity(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 focus:ring-2 focus:ring-primary"
                    >
                      <option value="">— Выберите город —</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      {defaultCity && !cities.some((c) => c.name === defaultCity) && (
                        <option value={defaultCity}>{defaultCity}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email поддержки</label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Телефон поддержки</label>
                    <input
                      type="tel"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "monetization" && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold">Настройки монетизации</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Процент от заказа (%)</label>
                    <input
                      type="number"
                      value={platformCommission}
                      onChange={(e) => setPlatformCommission(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-[#2D2A26]/50 mt-1">Комиссия с каждого заказа</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Доплата за доставку (₽)</label>
                    <input
                      type="number"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-[#2D2A26]/50 mt-1">Базовая стоимость доставки платформы</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Минимальная сумма заказа (₽)</label>
                    <input
                      type="number"
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold">Настройки платежей</h2>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-yellow-800 dark:text-yellow-200 text-sm">
                  Платежные интеграции находятся в режиме настройки. Ключи API не сохраняются в этой версии.
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold">Настройки уведомлений</h2>
                <p className="text-sm text-[#2D2A26]/60">
                  Шаблоны и рассылки управляются в разделе «Уведомления».
                </p>
              </div>
            )}

            {activeTab === "integrations" && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold">Интеграции</h2>
                <p className="text-sm text-[#2D2A26]/60">
                  Интеграции с внешними сервисами будут добавлены в следующих версиях.
                </p>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold">Безопасность</h2>
                <p className="text-sm text-[#2D2A26]/60">
                  Управление администраторами — в разделе «Пользователи». Журнал действий — в «Логи».
                </p>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold">Внешний вид</h2>
                <div className="flex items-center justify-between p-4 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl">
                  <div>
                    <p className="font-medium">Тёмная тема</p>
                    <p className="text-sm text-[#2D2A26]/50">Переключается локально в браузере</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? "bg-primary dark:bg-primary-dark" : "bg-gray-300"}`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isDark ? "left-7" : "left-1"}`}
                    />
                  </button>
                </div>
              </div>
            )}

            {["general", "monetization"].includes(activeTab) && (
              <div className="mt-6 pt-6 border-t border-[#F5F3F0] dark:border-[#3D3A36]">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary dark:bg-primary-dark text-white rounded-xl hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Сохранение..." : "Сохранить изменения"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
