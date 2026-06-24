import { NextRequest, NextResponse } from "next/server";
import { withCourier } from "@/lib/auth/api-auth";
import { getCourierProfile, getCourierEarnings } from "@/lib/api/couriers";

export async function GET(request: NextRequest) {
  const result = await withCourier(async (userId) => {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") as "daily" | "weekly" | "monthly") || "daily";

    const profile = await getCourierProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const earnings = await getCourierEarnings(profile.id, period);
    return NextResponse.json({ earnings });
  });

  return result instanceof NextResponse ? result : result;
}
