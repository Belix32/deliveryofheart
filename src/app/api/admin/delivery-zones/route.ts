import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { logAdminAction } from "@/lib/admin/audit";
import { parseJsonBody, parseQuery } from "@/lib/admin/validate";
import {
  deliveryZoneCreateSchema,
  deliveryZonePatchSchema,
  idQuerySchema,
} from "@/lib/admin/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const result = await withAdmin(async () => {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("delivery_zones")
        .select("*, cities(id, name)")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const zones = (data || []).map((z) => ({
        ...z,
        city_name: (z.cities as { name: string } | null)?.name ?? null,
      }));

      return NextResponse.json({ zones });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ошибка загрузки зон доставки";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });

  return result instanceof NextResponse ? result : result;
}

export async function POST(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = await parseJsonBody(request, deliveryZoneCreateSchema);
    if (!parsed.ok) return parsed.response;

    const { city_id, name, delivery_price, min_order_amount, is_active } = parsed.data;
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("delivery_zones")
      .insert({ city_id, name, delivery_price, min_order_amount, is_active })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "create", "delivery_zone", data.id, { name: data.name });
    return NextResponse.json({ zone: data });
  });

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = await parseJsonBody(request, deliveryZonePatchSchema);
    if (!parsed.ok) return parsed.response;

    const { id, ...updates } = parsed.data;
    const admin = createAdminClient();
    const { error } = await admin.from("delivery_zones").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "update", "delivery_zone", id, updates);
    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}

export async function DELETE(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = parseQuery(new URL(request.url).searchParams, idQuerySchema);
    if (!parsed.ok) return parsed.response;

    const { id } = parsed.data;
    const admin = createAdminClient();
    const { error } = await admin.from("delivery_zones").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "delete", "delivery_zone", id);
    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}
