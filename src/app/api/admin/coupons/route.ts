import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { logAdminAction } from "@/lib/admin/audit";
import { parseJsonBody, parseQuery } from "@/lib/admin/validate";
import { couponCreateSchema, couponPatchSchema, idQuerySchema } from "@/lib/admin/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const result = await withAdmin(async () => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ coupons: data || [] });
  });

  return result instanceof NextResponse ? result : result;
}

export async function POST(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = await parseJsonBody(request, couponCreateSchema);
    if (!parsed.ok) return parsed.response;

    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_uses,
      valid_to,
      is_active,
      scope,
    } = parsed.data;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("coupons")
      .insert({
        code: code.toUpperCase(),
        description: description || null,
        discount_type,
        discount_value,
        min_order_amount: min_order_amount ?? 0,
        max_uses: max_uses ?? null,
        valid_to: valid_to || null,
        is_active,
        scope,
        used_count: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "create", "coupon", data.id, { code: data.code });
    return NextResponse.json({ coupon: data }, { status: 201 });
  });

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = await parseJsonBody(request, couponPatchSchema);
    if (!parsed.ok) return parsed.response;

    const { id, ...updates } = parsed.data;
    const admin = createAdminClient();
    const { error } = await admin.from("coupons").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "update", "coupon", id, updates);
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
    const { error } = await admin.from("coupons").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "delete", "coupon", id);
    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}
