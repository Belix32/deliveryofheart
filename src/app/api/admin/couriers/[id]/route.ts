import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCourierProfileById,
  getCourierOrders,
  getCourierEarnings,
  getCourierStats,
} from "@/lib/api/couriers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await withAdmin(async () => {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeOrders = searchParams.get("include_orders") === "true";
    const includeEarnings = searchParams.get("include_earnings") === "true";
    const includeStats = searchParams.get("include_stats") === "true";

    const courier = await getCourierProfileById(id);
    if (!courier) {
      return NextResponse.json({ error: "Courier not found" }, { status: 404 });
    }

    const response: Record<string, unknown> = { courier };
    if (includeOrders) response.orders = await getCourierOrders(id);
    if (includeEarnings) response.earnings = await getCourierEarnings(id, "weekly");
    if (includeStats) response.stats = await getCourierStats(id);

    return NextResponse.json(response);
  });

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await withAdmin(async () => {
    const { id } = await params;
    const body = await request.json();
    const { is_active } = body;

    if (is_active === undefined) {
      return NextResponse.json({ error: "Укажите is_active" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("couriers")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}
