import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { logAdminAction } from "@/lib/admin/audit";
import { parseJsonBody, parseQuery } from "@/lib/admin/validate";
import {
  restaurantCreateSchema,
  restaurantPatchSchema,
  idQuerySchema,
} from "@/lib/admin/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || `restaurant-${Date.now()}`
  );
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
  const result = await withAdmin(async (userId) => {
    const parsed = await parseJsonBody(request, restaurantCreateSchema);
    if (!parsed.ok) return parsed.response;

    const fields = { ...parsed.data };
    if (!fields.slug) {
      fields.slug = slugify(fields.name);
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("restaurants")
      .insert({
        ...fields,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "create", "restaurant", data.id, { name: data.name });
    return NextResponse.json({ restaurant: data }, { status: 201 });
  });

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = await parseJsonBody(request, restaurantPatchSchema);
    if (!parsed.ok) return parsed.response;

    const { id, ...updates } = parsed.data;
    const admin = createAdminClient();
    const { error } = await admin
      .from("restaurants")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "update", "restaurant", id, updates);
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
    const { error } = await admin.from("restaurants").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "delete", "restaurant", id);
    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}
