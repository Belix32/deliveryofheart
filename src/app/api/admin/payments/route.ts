import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const result = await withAdmin(async () => {
    const { searchParams } = new URL(request.url);
    const page = Math.max(0, Number(searchParams.get("page") || 0));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 20)));
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const admin = createAdminClient();
    const { data, error, count } = await admin
      .from("orders")
      .select(
        `
        id,
        order_number,
        final_amount,
        payment_method,
        payment_status,
        status,
        created_at,
        users (full_name, email),
        restaurants (name)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ payments: data || [], totalCount: count || 0 });
  });

  return result instanceof NextResponse ? result : result;
}
