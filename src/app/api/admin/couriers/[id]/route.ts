import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
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
    if (includeEarnings) response.earnings = await getCourierEarnings(id);
    if (includeStats) response.stats = await getCourierStats(id);

    return NextResponse.json(response);
  });

  return result instanceof NextResponse ? result : result;
}
