import { NextRequest, NextResponse } from "next/server";
import { withAuth, withCourier } from "@/lib/auth/api-auth";
import { getAvailableOrders, getCourierProfile, getCourierOrders, getOrdersForCourier } from "@/lib/api/couriers";
import { APP_CITY } from "@/lib/config";

export async function GET(request: NextRequest) {
  const result = await withCourier(async (userId) => {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "available";

    const profile = await getCourierProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const orders =
      type === "assigned"
        ? await getCourierOrders(profile.id)
        : type === "my"
          ? await getOrdersForCourier(profile.id)
          : await getAvailableOrders(profile.current_city || APP_CITY);

    return NextResponse.json({ orders });
  });

  return result instanceof NextResponse ? result : result;
}
