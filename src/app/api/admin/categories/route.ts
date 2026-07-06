import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const result = await withAdmin(async () => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("categories")
      .select(
        `
        *,
        restaurants (name, city)
      `
      )
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ categories: data || [] });
  });

  return result instanceof NextResponse ? result : result;
}

export async function POST(request: NextRequest) {
  const result = await withAdmin(async () => {
    const body = await request.json();
    const { name, restaurant_id, sort_order, is_active } = body;

    if (!name || !restaurant_id) {
      return NextResponse.json({ error: "Укажите name и restaurant_id" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("categories")
      .insert({
        name,
        restaurant_id,
        sort_order: sort_order ?? 0,
        is_active: is_active ?? true,
      })
      .select(
        `
        *,
        restaurants (name, city)
      `
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ category: data }, { status: 201 });
  });

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(request: NextRequest) {
  const result = await withAdmin(async () => {
    const body = await request.json();
    const { id, name, sort_order, is_active, restaurant_id } = body;

    if (!id) {
      return NextResponse.json({ error: "Укажите id категории" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    if (is_active !== undefined) updates.is_active = is_active;
    if (restaurant_id !== undefined) updates.restaurant_id = restaurant_id;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Нет полей для обновления" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select(
        `
        *,
        restaurants (name, city)
      `
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ category: data });
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
    const { error } = await admin.from("categories").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}
