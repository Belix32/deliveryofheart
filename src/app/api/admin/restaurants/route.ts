import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const RESTAURANT_FIELDS = [
  "name",
  "slug",
  "address",
  "phone",
  "description",
  "delivery_time_min",
  "delivery_time_max",
  "delivery_price",
  "city",
  "is_active",
] as const;

function pickRestaurantFields(body: Record<string, unknown>) {
  const picked: Record<string, unknown> = {};
  for (const key of RESTAURANT_FIELDS) {
    if (body[key] !== undefined) picked[key] = body[key];
  }
  return picked;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || `restaurant-${Date.now()}`;
}

export async function GET() {
  const result = await withAdmin(async () => {
    const admin = createAdminClient();
    const { data, error } = await admin.from("restaurants").select("*").order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ restaurants: data || [] });
  });

  return result instanceof NextResponse ? result : result;
}

export async function POST(request: NextRequest) {
  const result = await withAdmin(async () => {
    const body = await request.json();
    const fields = pickRestaurantFields(body);

    if (!fields.name || !fields.address) {
      return NextResponse.json({ error: "Укажите name и address" }, { status: 400 });
    }

    if (!fields.slug) {
      fields.slug = slugify(String(fields.name));
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("restaurants")
      .insert({
        ...fields,
        is_active: fields.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ restaurant: data }, { status: 201 });
  });

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(request: NextRequest) {
  const result = await withAdmin(async () => {
    const body = await request.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: "Укажите id ресторана" }, { status: 400 });
    }

    const updates = pickRestaurantFields(rest);
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Нет полей для обновления" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const admin = createAdminClient();
    const { error } = await admin.from("restaurants").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}

export async function DELETE(request: NextRequest) {
  const result = await withAdmin(async () => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Укажите id" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("restaurants").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}
