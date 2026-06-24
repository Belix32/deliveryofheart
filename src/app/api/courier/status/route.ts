import { NextRequest, NextResponse } from "next/server";
import { withCourier } from "@/lib/auth/api-auth";
import { getCourierProfile, setCourierStatus } from "@/lib/api/couriers";

export async function GET() {
  const result = await withCourier(async (userId) => {
    const profile = await getCourierProfile(userId);
    if (!profile) {
      return NextResponse.json({ status: null, error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json({ status: profile.status, is_online: profile.is_online });
  });

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(request: NextRequest) {
  const result = await withCourier(async (userId) => {
    const body = await request.json();
    const { status } = body;

    if (!status || !["online", "offline", "busy"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const profile = await getCourierProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const success = await setCourierStatus(profile.id, status);
    if (!success) {
      return NextResponse.json({ error: "Failed to update status" }, { status: 400 });
    }

    return NextResponse.json({ success: true, status });
  });

  return result instanceof NextResponse ? result : result;
}
