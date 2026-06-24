import { NextResponse } from "next/server";
import { withCourier } from "@/lib/auth/api-auth";
import { getCourierProfile, getCourierStats } from "@/lib/api/couriers";

export async function GET() {
  const result = await withCourier(async (userId) => {
    const profile = await getCourierProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    const stats = await getCourierStats(profile.id);
    return NextResponse.json(stats);
  });

  return result instanceof NextResponse ? result : result;
}
