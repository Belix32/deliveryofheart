import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { logAdminAction } from "@/lib/admin/audit";
import { parseJsonBody, parseQuery } from "@/lib/admin/validate";
import {
  categoryCreateSchema,
  categoryPatchSchema,
  idQuerySchema,
} from "@/lib/admin/schemas";
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
  const result = await withAdmin(async (userId) => {
    const parsed = await parseJsonBody(request, categoryCreateSchema);
    if (!parsed.ok) return parsed.response;

    const { name, restaurant_id, sort_order, is_active } = parsed.data;
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("categories")
      .insert({ name, restaurant_id, sort_order, is_active })
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

    await logAdminAction(userId, "create", "category", data.id, { name });
    return NextResponse.json({ category: data }, { status: 201 });
  });

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = await parseJsonBody(request, categoryPatchSchema);
    if (!parsed.ok) return parsed.response;

    const { id, ...updates } = parsed.data;
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

    await logAdminAction(userId, "update", "category", id, updates);
    return NextResponse.json({ category: data });
  });

  return result instanceof NextResponse ? result : result;
}

export async function DELETE(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = parseQuery(new URL(request.url).searchParams, idQuerySchema);
    if (!parsed.ok) return parsed.response;

    const { id } = parsed.data;
    const admin = createAdminClient();
    const { error } = await admin.from("categories").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "delete", "category", id);
    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}
