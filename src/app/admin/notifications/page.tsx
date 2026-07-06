"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Send,
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface TemplateRow {
  id: string;
  name: string;
  channel: string | null;
  subject: string | null;
  body: string;
  is_active: boolean | null;
  created_at: string | null;
}

interface CampaignRow {
  id: string;
  title: string | null;
  status: string | null;
  sent_count: number | null;
  open_count: number | null;
  sent_at: string | null;
  created_at: string | null;
  notification_templates: { name: string; channel: string | null } | null;
}

interface Stats {
  total_sent: number;
  open_rate: number;
  active_templates: number;
}

const NotificationsPage: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total_sent: 0, open_rate: 0, active_templates: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState<TemplateRow | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [templateName, setTemplateName] = useState("");
  const [templateChannel, setTemplateChannel] = useState("push");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");

  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignTemplateId, setCampaignTemplateId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [templatesRes, campaignsRes] = await Promise.all([
      fetch("/api/admin/notifications/templates"),
      fetch("/api/admin/notifications/campaigns"),
    ]);

    const templatesData = await templatesRes.json();
    const campaignsData = await campaignsRes.json();

    if (!templatesRes.ok) {
      setError(templatesData.error || "Ошибка загрузки");
    } else {
      setTemplates(templatesData.templates || []);
    }

    if (campaignsRes.ok) {
      setCampaigns(campaignsData.campaigns || []);
      setStats(campaignsData.stats || { total_sent: 0, open_rate: 0, active_templates: 0 });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateChannel("push");
    setTemplateSubject("");
    setTemplateBody("");
    setShowTemplateModal(true);
  };

  const openEditTemplate = (t: TemplateRow) => {
    setEditingTemplate(t);
    setTemplateName(t.name);
    setTemplateChannel(t.channel || "push");
    setTemplateSubject(t.subject || "");
    setTemplateBody(t.body);
    setShowTemplateModal(true);
  };

  const saveTemplate = async () => {
    if (!templateName.trim() || !templateBody.trim()) return;
    setSaving(true);

    const payload = {
      name: templateName.trim(),
      channel: templateChannel,
      subject: templateSubject.trim() || null,
      body: templateBody.trim(),
    };

    const response = editingTemplate
      ? await fetch("/api/admin/notifications/templates", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingTemplate.id, ...payload }),
        })
      : await fetch("/api/admin/notifications/templates", {
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

    setShowTemplateModal(false);
    loadData();
  };

  const toggleTemplate = async (t: TemplateRow) => {
    await fetch("/api/admin/notifications/templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, is_active: !t.is_active }),
    });
    loadData();
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Удалить шаблон?")) return;
    await fetch(`/api/admin/notifications/templates?id=${id}`, { method: "DELETE" });
    loadData();
  };

  const createCampaign = async (asDraft: boolean) => {
    if (!campaignTitle.trim()) return;
    setSaving(true);

    const response = await fetch("/api/admin/notifications/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: campaignTitle.trim(),
        template_id: campaignTemplateId || null,
        status: asDraft ? "draft" : "sent_manual",
      }),
    });

    setSaving(false);
    if (!response.ok) {
      const data = await response.json();
      alert(data.error || "Ошибка создания");
      return;
    }

    setShowCampaignModal(false);
    setCampaignTitle("");
    setCampaignTemplateId("");
    loadData();
  };

  const markCampaignSent = async (id: string) => {
    await fetch("/api/admin/notifications/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "sent_manual" }),
    });
    loadData();
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
          <h1 className="text-2xl font-display font-bold">Уведомления</h1>
          <p className="text-[#2D2A26]/60 dark:text-[#E8E6E3]/60">Шаблоны и рассылки</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openCreateTemplate}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Шаблон
          </button>
          <button
            onClick={() => setShowCampaignModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl"
          >
            <Send className="w-4 h-4" />
            Создать рассылку
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-[#2D2A26] p-4 rounded-xl border border-[#F5F3F0] dark:border-[#3D3A36]">
          <p className="text-sm text-[#2D2A26]/60">Всего отправлено</p>
          <p className="text-2xl font-bold">{stats.total_sent.toLocaleString("ru-RU")}</p>
        </div>
        <div className="bg-white dark:bg-[#2D2A26] p-4 rounded-xl border border-[#F5F3F0] dark:border-[#3D3A36]">
          <p className="text-sm text-green-600">Открыто</p>
          <p className="text-2xl font-bold text-green-600">{stats.open_rate}%</p>
        </div>
        <div className="bg-white dark:bg-[#2D2A26] p-4 rounded-xl border border-[#F5F3F0] dark:border-[#3D3A36]">
          <p className="text-sm text-primary">Активных шаблонов</p>
          <p className="text-2xl font-bold text-primary">{stats.active_templates}</p>
        </div>
      </div>

      <h2 className="text-lg font-display font-semibold mb-4">Шаблоны</h2>
      {templates.length === 0 ? (
        <div className="bg-white dark:bg-[#2D2A26] rounded-2xl border p-8 text-center text-[#2D2A26]/60 mb-8">
          Шаблонов пока нет
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-[#2D2A26] rounded-2xl border border-[#F5F3F0] dark:border-[#3D3A36] p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-sm text-[#2D2A26]/60">
                    {(t.channel || "push").toUpperCase()} • {t.body.slice(0, 80)}
                    {t.body.length > 80 ? "…" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleTemplate(t)}
                    className={`p-2 rounded-full ${t.is_active ? "bg-green-500" : "bg-gray-400"}`}
                  >
                    {t.is_active ? (
                      <ToggleRight className="w-4 h-4 text-white" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowViewModal(t)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-lg text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Просмотр
                  </button>
                  <button
                    onClick={() => openEditTemplate(t)}
                    className="p-2 hover:bg-[#F5F3F0] dark:hover:bg-[#3D3A36] rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-lg font-display font-semibold mb-4">Рассылки</h2>
      {campaigns.length === 0 ? (
        <div className="bg-white dark:bg-[#2D2A26] rounded-2xl border p-8 text-center text-[#2D2A26]/60">
          Рассылок пока нет
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-[#2D2A26] rounded-2xl border border-[#F5F3F0] dark:border-[#3D3A36] p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{c.title}</h3>
                  <p className="text-sm text-[#2D2A26]/60">
                    {c.notification_templates?.name || "Без шаблона"} •{" "}
                    <span
                      className={
                        c.status === "sent_manual" || c.status === "sent"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }
                    >
                      {c.status === "draft" ? "Черновик" : "Отправлено вручную"}
                    </span>
                  </p>
                </div>
                <div className="text-right text-sm">
                  {c.sent_at && (
                    <p className="text-[#2D2A26]/60">
                      {new Date(c.sent_at).toLocaleDateString("ru-RU")}
                    </p>
                  )}
                  <p className="font-medium">
                    {c.open_count ?? 0}/{c.sent_count ?? 0} открытий
                  </p>
                </div>
              </div>
              {c.status === "draft" && (
                <button
                  onClick={() => markCampaignSent(c.id)}
                  className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-sm"
                >
                  <Send className="w-4 h-4" />
                  Отметить как отправленную
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#2D2A26] rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingTemplate ? "Редактировать шаблон" : "Создать шаблон"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Название</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Канал</label>
                <select
                  value={templateChannel}
                  onChange={(e) => setTemplateChannel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0"
                >
                  <option value="push">Push</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              {templateChannel === "email" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Тема письма</label>
                  <input
                    type="text"
                    value={templateSubject}
                    onChange={(e) => setTemplateSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Текст</label>
                <textarea
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="flex-1 px-4 py-2.5 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl"
              >
                Отмена
              </button>
              <button
                onClick={saveTemplate}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl disabled:opacity-50"
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#2D2A26] rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Создать рассылку</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Заголовок</label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Шаблон (опционально)</label>
                <select
                  value={campaignTemplateId}
                  onChange={(e) => setCampaignTemplateId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F5F3F0] dark:bg-[#3D3A36] border-0"
                >
                  <option value="">— Без шаблона —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCampaignModal(false)}
                className="flex-1 px-4 py-2.5 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl"
              >
                Отмена
              </button>
              <button
                onClick={() => createCampaign(true)}
                disabled={saving || !campaignTitle.trim()}
                className="flex-1 px-4 py-2.5 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl disabled:opacity-50"
              >
                Черновик
              </button>
              <button
                onClick={() => createCampaign(false)}
                disabled={saving || !campaignTitle.trim()}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl disabled:opacity-50"
              >
                Отправить вручную
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#2D2A26] rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">{showViewModal.name}</h2>
            <p className="text-sm text-[#2D2A26]/60 mb-2">
              Канал: {(showViewModal.channel || "push").toUpperCase()}
            </p>
            {showViewModal.subject && (
              <p className="text-sm mb-2">
                <strong>Тема:</strong> {showViewModal.subject}
              </p>
            )}
            <p className="whitespace-pre-wrap bg-[#F5F3F0] dark:bg-[#3D3A36] p-4 rounded-xl text-sm">
              {showViewModal.body}
            </p>
            <button
              onClick={() => setShowViewModal(null)}
              className="mt-4 w-full px-4 py-2.5 bg-[#F5F3F0] dark:bg-[#3D3A36] rounded-xl"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
