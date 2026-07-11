import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { logAdminAction } from "@/lib/admin/audit";
import { parseJsonBody } from "@/lib/admin/validate";
import { orderPatchSchema } from "@/lib/admin/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateOrderStatus } from "@/lib/api/orders";

export async function GET(request: NextRequest) {
  const result = await withAdmin(async () => {
    const { searchParams } = new URL(request.url);
    const cityFilter = searchParams.get("city");
    const statusFilter = searchParams.get("status");
    const page = Math.max(0, Number(searchParams.get("page") || 0));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 20)));
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const admin = createAdminClient();
    let query = admin
      .from("orders")
      .select(
        `
        *,
        restaurants (name, address),
        users (full_name, phone, email),
        couriers (name, phone),
        order_items (*)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (cityFilter && cityFilter !== "all") {
      query = query.eq("delivery_city", cityFilter);
    }
    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data || [], totalCount: count || 0 });
  });

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = await parseJsonBody(request, orderPatchSchema);
    if (!parsed.ok) return parsed.response;

    const { order_id, status, note } = parsed.data;
    const success = await updateOrderStatus(order_id, status, note, userId, "admin");
    if (!success) {
      return NextResponse.json({ error: "Ошибка обновления статуса" }, { status: 500 });
    }

    await logAdminAction(userId, "update", "order", order_id, { status, note });
    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}
