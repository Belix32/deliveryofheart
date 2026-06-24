import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { getDashboardStats } from "@/lib/api/dashboard";

export async function GET() {
  const result = await withAdmin(async () => {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  });

  return result instanceof NextResponse ? result : result;
}
