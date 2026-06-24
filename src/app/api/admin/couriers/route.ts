import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { getAllCouriers } from "@/lib/api/couriers";

export async function GET(request: NextRequest) {
  const result = await withAdmin(async () => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const city = searchParams.get("city") || undefined;
    const isActive =
      searchParams.get("is_active") === "true"
        ? true
        : searchParams.get("is_active") === "false"
          ? false
          : undefined;

    const couriers = await getAllCouriers({
      status: status || undefined,
      city: city || undefined,
      isActive,
    });

    return NextResponse.json({ couriers });
  });

  return result instanceof NextResponse ? result : result;
}
