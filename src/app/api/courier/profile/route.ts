import { NextRequest, NextResponse } from "next/server";
import { withCourier } from "@/lib/auth/api-auth";
import { getCourierProfile, upsertCourierProfile } from "@/lib/api/couriers";

export async function GET() {
  const result = await withCourier(async (userId) => {
    const profile = await getCourierProfile(userId);
    return NextResponse.json({ profile: profile || null });
  });

  return result instanceof NextResponse ? result : result;
}

export async function POST(request: NextRequest) {
  const result = await withCourier(async (userId) => {
    const body = await request.json();
    const profile = await upsertCourierProfile(userId, body);

    if (!profile) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 400 });
    }

    return NextResponse.json({ profile });
  });

  return result instanceof NextResponse ? result : result;
}
