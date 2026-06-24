import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRestaurantOrders, checkIsAdmin } from "@/lib/api/orders";

export async function GET(request: NextRequest) {
  const result = await withAuth(async (userId) => {
    const isAdmin = await checkIsAdmin(userId);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    if (!isAdmin) {
      const admin = createAdminClient();
      const { data: userRoles } = await admin
        .from("user_roles")
        .select("restaurant_id, roles(name)")
        .eq("user_id", userId)
        .eq("is_active", true);

      const restaurantRole = userRoles?.find((ur: { roles?: { name?: string } | { name?: string }[]; restaurant_id?: string }) => {
        const roleName = Array.isArray(ur.roles) ? ur.roles[0]?.name : ur.roles?.name;
        return roleName === "restaurant_owner" || roleName === "restaurant_admin";
      });

      if (!restaurantRole?.restaurant_id) {
        return NextResponse.json(
          { error: "Ресторан не найден. У вас нет доступа к управлению заказами." },
          { status: 403 }
        );
      }

      const orders = await getRestaurantOrders(restaurantRole.restaurant_id, status);
      const paginatedOrders = orders.slice(offset, offset + limit);

      return NextResponse.json({
        orders: paginatedOrders,
        total: orders.length,
        limit,
        offset,
      });
    }

    const restaurantId = searchParams.get("restaurant_id") || undefined;
    const admin = createAdminClient();

    let query = admin
      .from("orders")
      .select(
        `
        *,
        users!orders_user_id_fkey(full_name, phone),
        restaurants(name, address)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (restaurantId) query = query.eq("restaurant_id", restaurantId);
    if (status) query = query.eq("status", status);

    const { data: orders, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: "Ошибка получения заказов" }, { status: 500 });
    }

    return NextResponse.json({
      orders: orders || [],
      total: count || 0,
      limit,
      offset,
    });
  });

  return result instanceof NextResponse ? result : result;
}
