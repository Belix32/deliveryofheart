import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { getCourierProfileById, getCourierEarnings } from "@/lib/api/couriers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await withAdmin(async () => {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") as "daily" | "weekly" | "monthly") || "daily";

    const courier = await getCourierProfileById(id);
    if (!courier) {
      return NextResponse.json({ error: "Courier not found" }, { status: 404 });
    }

    const earnings = await getCourierEarnings(id, period);
    return NextResponse.json({ earnings });
  });

  return result instanceof NextResponse ? result : result;
}
