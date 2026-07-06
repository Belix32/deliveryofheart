import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { logAdminAction } from "@/lib/admin/audit";
import { parseJsonBody } from "@/lib/admin/validate";
import { courierPatchSchema } from "@/lib/admin/schemas";
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
      return NextResponse.json({ error: "Курьер не найден" }, { status: 404 });
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
  const result = await withAdmin(async (userId) => {
    const { id } = await params;
    const parsed = await parseJsonBody(request, courierPatchSchema);
    if (!parsed.ok) return parsed.response;

    const { is_active } = parsed.data;
    const admin = createAdminClient();
    const { error } = await admin
      .from("couriers")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "update", "courier", id, { is_active });
    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}
