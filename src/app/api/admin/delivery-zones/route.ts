import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { logAdminAction } from "@/lib/admin/audit";
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
    const body = await request.json();
    const { city_id, name, delivery_price = 0, min_order_amount = 0, is_active = true } = body;

    if (!city_id) {
      return NextResponse.json({ error: "Укажите город" }, { status: 400 });
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: "Укажите название зоны" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("delivery_zones")
      .insert({
        city_id,
        name: name.trim(),
        delivery_price,
        min_order_amount,
        is_active,
      })
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
    const body = await request.json();
    const { id, city_id, name, delivery_price, min_order_amount, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "Укажите id зоны" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (city_id !== undefined) updates.city_id = city_id;
    if (name !== undefined) updates.name = name;
    if (delivery_price !== undefined) updates.delivery_price = delivery_price;
    if (min_order_amount !== undefined) updates.min_order_amount = min_order_amount;
    if (is_active !== undefined) updates.is_active = is_active;

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Укажите id" }, { status: 400 });
    }

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
