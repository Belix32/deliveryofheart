import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { logAdminAction } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/database.types";

const SETTING_KEYS = [
  "default_city",
  "min_order_amount",
  "delivery_fee",
  "platform_commission_percent",
  "support_phone",
  "support_email",
] as const;

function parseSettingValue(value: unknown): string | number {
  if (typeof value === "string" || typeof value === "number") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

export async function GET() {
  const result = await withAdmin(async () => {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.from("app_settings").select("key, value");

      if (error) throw error;

      const settings: Record<string, string | number> = {};
      for (const key of SETTING_KEYS) {
        const row = (data || []).find((r) => r.key === key);
        settings[key] = row ? parseSettingValue(row.value) : "";
      }

      return NextResponse.json({ settings });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ошибка загрузки настроек";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const body = await request.json();
    const { settings } = body as { settings?: Record<string, string | number> };

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Укажите объект settings" }, { status: 400 });
    }

    const admin = createAdminClient();
    const updates: Record<string, string | number> = {};

    for (const [key, value] of Object.entries(settings)) {
      if (!SETTING_KEYS.includes(key as (typeof SETTING_KEYS)[number])) continue;
      updates[key] = value;

      const { error } = await admin.from("app_settings").upsert({
        key,
        value: value as Json,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Нет допустимых ключей для сохранения" }, { status: 400 });
    }

    await logAdminAction(userId, "update", "app_settings", undefined, updates);
    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}
