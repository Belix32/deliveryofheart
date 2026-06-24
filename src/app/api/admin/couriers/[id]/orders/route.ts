import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { getCourierOrders, getCourierProfileById } from "@/lib/api/couriers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await withAdmin(async () => {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    const courier = await getCourierProfileById(id);
    if (!courier) {
      return NextResponse.json({ error: "Courier not found" }, { status: 404 });
    }

    const orders = await getCourierOrders(id, status);
    return NextResponse.json({ orders });
  });

  return result instanceof NextResponse ? result : result;
}
