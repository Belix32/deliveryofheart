import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  updateOrderStatus,
  checkRestaurantOrderAccess,
  getOrderHistory,
} from "@/lib/api/orders";
import { isPlatformAdmin } from "@/lib/auth/admin-access";

const VALID_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "waiting_courier",
  "in_delivery",
  "delivered",
  "cancelled",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await withAuth(async (userId) => {
    const { id: orderId } = await params;
    const admin = createAdminClient();

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, restaurant_id, status, user_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    const isAdmin = await isPlatformAdmin(userId);
    const hasRestaurantAccess = await checkRestaurantOrderAccess(userId, order.restaurant_id);
    const isOwner = order.user_id === userId;

    if (!isAdmin && !hasRestaurantAccess && !isOwner) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const body = await request.json();
    const { status, note } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Неверный статус. Допустимые: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const role = isAdmin ? "admin" : hasRestaurantAccess ? "restaurant" : "customer";
    const success = await updateOrderStatus(orderId, status, note, userId, role);
    if (!success) {
      return NextResponse.json({ error: "Ошибка обновления статуса" }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  });

  return result instanceof NextResponse ? result : result;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await withAuth(async (userId) => {
    const { id: orderId } = await params;
    const admin = createAdminClient();

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, restaurant_id, user_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    const isAdmin = await isPlatformAdmin(userId);
    const hasRestaurantAccess = await checkRestaurantOrderAccess(userId, order.restaurant_id);
    const isOwner = order.user_id === userId;

    if (!isAdmin && !hasRestaurantAccess && !isOwner) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const history = await getOrderHistory(orderId);
    return NextResponse.json({ history });
  });

  return result instanceof NextResponse ? result : result;
}
