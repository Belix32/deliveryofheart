"use client";

import React, { useState } from "react";
import { Plus, Send, Eye, Clock, CheckCircle, XCircle } from "lucide-react";

const notifications = [
  { id: "1", title: "Шаблон: Новый заказ", type: "push", content: "Уведомление о новом заказе", lastSent: "10.04.2026", sentCount: 156 },
  { id: "2", title: "Шаблон: Статус заказа", type: "push", content: "Изменение статуса заказа", lastSent: "09.04.2026", sentCount: 312 },
  { id: "3", title: "Рассылка: Новые блюда", type: "email", content: "Рассказываем о новинках", sentAt: "05.04.2026", recipients: 89, opens: 45 },
];

const NotificationsPage: React.FC = () => {
  const [showCompose, setShowCompose] = useState(false);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div><h1 className="text-2xl font-display font-bold">Уведомления</h1><p className="text-[#2D2A26]/60">Шаблоны и рассылки</p></div>
        <button onClick={() => setShowCompose(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl">
          <Send className="w-4 h-4" />Создать рассылку
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border"><p className="text-sm text-[#2D2A26]/60">Всего отправлено</p><p className="text-2xl font-bold">1 234</p></div>
        <div className="bg-white p-4 rounded-xl border"><p className="text-sm text-green-600">Открыто</p><p className="text-2xl font-bold text-green-600">67%</p></div>
        <div className="bg-white p-4 rounded-xl border"><p className="text-sm text-primary">Активных шаблонов</p><p className="text-2xl font-bold text-primary">5</p></div>
      </div>

      <h2 className="text-lg font-display font-semibold mb-4">Шаблоны и рассылки</h2>
      <div className="space-y-4">
        {notifications.map(n => (
          <div key={n.id} className="bg-white dark:bg-[#2D2A26] rounded-2xl border p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{n.title}</h3>
                <p className="text-sm text-[#2D2A26]/60">{n.type.toUpperCase()} • {n.content}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-[#2D2A26]/60">{"lastSent" in n ? `Последняя: ${n.lastSent}` : `Отправлено: ${n.sentAt}`}</p>
                <p className="font-medium">{"lastSent" in n ? `${n.sentCount} отправлено` : `${n.opens}/${n.recipients} открытий`}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F3F0] rounded-lg text-sm"><Eye className="w-4 h-4" />Просмотр</button>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F3F0] rounded-lg text-sm"><Send className="w-4 h-4" />Отправить</button>
            </div>
          </div>
        ))}
      </div>

      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#2D2A26] rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Создать рассылку</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">Тип</label><select className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0]"><option>Push-уведомление</option><option>Email</option></select></div>
              <div><label className="block text-sm font-medium mb-2">Заголовок</label><input type="text" className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0]" placeholder="Заголовок" /></div>
              <div><label className="block text-sm font-medium mb-2">Текст</label><textarea className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0]" rows={3} placeholder="Текст уведомления" /></div>
              <div><label className="block text-sm font-medium mb-2">Получатели</label><select className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0]"><option>Все пользователи</option><option>Новые пользователи</option><option>Активные пользователи</option></select></div>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={() => setShowCompose(false)} className="flex-1 px-4 py-2.5 bg-[#F5F3F0] rounded-xl">Отмена</button><button className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl">Отправить</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;