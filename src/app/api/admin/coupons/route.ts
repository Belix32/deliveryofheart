import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
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
  const result = await withAdmin(async () => {
    const body = await request.json();
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
    } = body;

    if (!code || !discount_type || discount_value === undefined) {
      return NextResponse.json(
        { error: "Укажите code, discount_type и discount_value" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("coupons")
      .insert({
        code: String(code).toUpperCase().trim(),
        description: description || null,
        discount_type,
        discount_value: Number(discount_value),
        min_order_amount: min_order_amount ? Number(min_order_amount) : 0,
        max_uses: max_uses ? Number(max_uses) : null,
        valid_to: valid_to || null,
        is_active: is_active ?? true,
        scope: scope || "food",
        used_count: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ coupon: data }, { status: 201 });
  });

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(request: NextRequest) {
  const result = await withAdmin(async () => {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Укажите id промокода" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("coupons").update(updates).eq("id", id);

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
    const { error } = await admin.from("coupons").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}
