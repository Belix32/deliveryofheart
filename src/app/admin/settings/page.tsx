"use client";

import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  Percent,
  DollarSign,
  Bell,
  CreditCard,
  Shield,
  Palette,
  Save,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const SettingsPage: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "Общие", icon: SettingsIcon },
    { id: "monetization", label: "Монетизация", icon: Percent },
    { id: "payments", label: "Платежи", icon: DollarSign },
    { id: "notifications", label: "Уведомления", icon: Bell },
    { id: "integrations", label: "Интеграции", icon: CreditCard },
    { id: "security", label: "Безопасность", icon: Shield },
    { id: "appearance", label: "Внешний вид", icon: Palette },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Настройки</h1>
        <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">Настройка системы</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
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

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-[#2D2A26] rounded-2xl border border-[#F5F3F0] dark:border-[#3D3A36] p-6">
            {/* General */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold">Общие настройки</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Название системы</label>
                    <input
                      type="text"
                      defaultValue="Доставка от души"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Город по умолчанию</label>
                    <select className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 focus:ring-2 focus:ring-primary">
                      <option>Сураж</option>
                      <option>Брянск</option>
                      <option>Дятьково</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email поддержки</label>
                    <input
                      type="email"
                      defaultValue="support@delivery-ot-dushi.ru"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Телефон поддержки</label>
                    <input
                      type="tel"
                      defaultValue="+7 (48336) 2-00-00"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Monetization */}
            {activeTab === "monetization" && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold">Настройки монетизации</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Процент от заказа (%)</label>
                    <input
                      type="number"
                      defaultValue="15"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-[#2D2A26]/50 mt-1">Комиссия с каждого заказа</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Фиксированная плата за заказ (₽)</label>
                    <input
                      type="number"
                      defaultValue="0"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-[#2D2A26]/50 mt-1">Дополнительная фиксированная плата</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Доплата за доставку (₽)</label>
                    <input
                      type="number"
                      defaultValue="0"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-[#2D2A26]/50 mt-1">Добавляется к стоимости доставки ресторана</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Индивидуальные комиссии</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl">
                        <span className="flex-1 font-medium">Пельменная №1</span>
                        <input type="number" defaultValue="12" className="w-20 px-3 py-1.5 rounded-lg bg-white dark:bg-[#2D2A26]" />
                        <span>%</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl">
                        <span className="flex-1 font-medium">Sushi Master</span>
                        <input type="number" defaultValue="18" className="w-20 px-3 py-1.5 rounded-lg bg-white dark:bg-[#2D2A26]" />
                        <span>%</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl">
                        <span className="flex-1 font-medium">Pizza Napoli</span>
                        <input type="number" defaultValue="15" className="w-20 px-3 py-1.5 rounded-lg bg-white dark:bg-[#2D2A26]" />
                        <span>%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payments */}
            {activeTab === "payments" && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold">Настройки платежей</h2>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-yellow-800 dark:text-yellow-200 text-sm">
                  ⚠️ Платежные интеграции находятся в режиме настройки. При реальном использовании нужно добавить ключи API.
                </div>
                <div className="space-y-4">
                  <div className="p-4 border border-[#F5F3F0] dark:border-[#3D3A36] rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                        <div>
                          <p className="font-semibold">Сбербанк</p>
                          <p className="text-xs text-[#2D2A26]/50">Приём карт, Apple Pay, Google Pay</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">Не настроено</span>
                    </div>
                    <input type="password" placeholder="API Key" className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0" />
                  </div>
                  <div className="p-4 border border-[#F5F3F0] dark:border-[#3D3A36] rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">Y</div>
                        <div>
                          <p className="font-semibold">ЮKassa</p>
                          <p className="text-xs text-[#2D2A26]/50">Платежи, переводы, автооплата</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">Не настроено</span>
                    </div>
                    <input type="password" placeholder="ShopId" className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 mb-2" />
                    <input type="password" placeholder="Secret Key" className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0" />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold">Настройки уведомлений</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl">
                    <div>
                      <p className="font-medium">Email уведомления</p>
                      <p className="text-sm text-[#2D2A26]/50">Отправка уведомлений на email</p>
                    </div>
                    <button className="relative w-12 h-6 rounded-full bg-primary dark:bg-primary-dark">
                      <span className="absolute left-7 top-1 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl">
                    <div>
                      <p className="font-medium">Push-уведомления</p>
                      <p className="text-sm text-[#2D2A26]/50">Push-уведомления в браузере</p>
                    </div>
                    <button className="relative w-12 h-6 rounded-full bg-primary dark:bg-primary-dark">
                      <span className="absolute left-7 top-1 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl opacity-60">
                    <div>
                      <p className="font-medium">Уведомления о новых заказах</p>
                      <p className="text-sm text-[#2D2A26]/50">В приложении и на email (без SMS)</p>
                    </div>
                    <button className="relative w-12 h-6 rounded-full bg-primary dark:bg-primary-dark">
                      <span className="absolute left-7 top-1 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations */}
            {activeTab === "integrations" && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold">Интеграции</h2>
                <div className="space-y-4">
                  <div className="p-4 border border-[#F5F3F0] dark:border-[#3D3A36] rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white">Y</div>
                      <div>
                        <p className="font-semibold">Яндекс.Карты</p>
                        <p className="text-xs text-[#2D2A26]/50">Карты и геолокация</p>
                      </div>
                    </div>
                    <input type="password" placeholder="API Key" className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0" />
                  </div>
                  <div className="p-4 border border-[#F5F3F0] dark:border-[#3D3A36] rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">T</div>
                      <div>
                        <p className="font-semibold">Telegram Bot</p>
                        <p className="text-xs text-[#2D2A26]/50">Уведомления в Telegram</p>
                      </div>
                    </div>
                    <input type="password" placeholder="Bot Token" className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 mb-2" />
                    <input type="text" placeholder="Chat ID" className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0" />
                  </div>
                </div>
              </div>
            )}

            {/* Security */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold">Безопасность</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Срок действия сессии (дней)</label>
                    <input type="number" defaultValue="30" className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl">
                    <div>
                      <p className="font-medium">Двухфакторная аутентификация</p>
                      <p className="text-sm text-[#2D2A26]/50">Требовать 2FA для админов</p>
                    </div>
                    <button className="relative w-12 h-6 rounded-full bg-gray-300">
                      <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Администраторы системы</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">A</div>
                        <span className="flex-1">admin@delivery-ot-dushi.ru</span>
                        <span className="text-xs text-primary">Супер-админ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <h2 className="text-lg font-display font-semibold">Внешний вид</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl">
                    <div>
                      <p className="font-medium">Тёмная тема</p>
                      <p className="text-sm text-[#2D2A26]/50">Использовать тёмную тему по умолчанию</p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? "bg-primary dark:bg-primary-dark" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isDark ? "left-7" : "left-1"}`} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Цвет бренда</label>
                    <div className="flex items-center gap-3">
                      <input type="color" defaultValue="#FF6B35" className="w-12 h-12 rounded-lg cursor-pointer" />
                      <span className="text-[#2D2A26]/70">Оранжевый (#FF6B35)</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Логотип (URL)</label>
                    <input type="url" placeholder="https://..." className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0 focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 pt-6 border-t border-[#F5F3F0] dark:border-[#3D3A36]">
              <button className="flex items-center gap-2 px-6 py-2.5 bg-primary dark:bg-primary-dark text-white rounded-xl hover:opacity-90">
                <Save className="w-4 h-4" />
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;