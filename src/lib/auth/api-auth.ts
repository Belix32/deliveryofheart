import { NextResponse } from "next/server";
import { AuthError, getSessionUser, requireAdmin, requireCourier, requireSessionUser } from "@/lib/auth/session";

export async function withAuth<T>(
  handler: (userId: string) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const user = await requireSessionUser();
    return handler(user.id);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

export async function withAdmin<T>(
  handler: (userId: string) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const user = await requireAdmin();
    return handler(user.id);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

export async function withCourier<T>(
  handler: (userId: string) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const user = await requireCourier();
    return handler(user.id);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

export { getSessionUser };
