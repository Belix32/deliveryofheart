import { NextRequest, NextResponse } from "next/server";
import { withCourier } from "@/lib/auth/api-auth";
import { getCourierProfile, acceptOrder, updateOrderStatus } from "@/lib/api/couriers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await withCourier(async (userId) => {
    const profile = await getCourierProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { id: orderId } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === "accept") {
      if (!profile.is_online) {
        return NextResponse.json({ error: "Выйдите на линию, чтобы принять заказ" }, { status: 400 });
      }
      const success = await acceptOrder(orderId, profile.id);
      if (!success) {
        return NextResponse.json({ error: "Failed to accept order" }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  });

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await withCourier(async (userId) => {
    const profile = await getCourierProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { id: orderId } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ["accepted", "picked_up", "in_delivery", "delivered", "cancelled", "failed"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const success = await updateOrderStatus(orderId, profile.id, status);
    if (!success) {
      return NextResponse.json({ error: "Failed to update status" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}
