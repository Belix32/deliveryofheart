import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { normalizePhone } from "@/lib/phone";
import {
  checkRateLimit,
  clientIpFromRequest,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

const INVALID_CREDENTIALS = "Неверный телефон или пароль";

export async function POST(request: NextRequest) {
  try {
    const ip = clientIpFromRequest(request);
    const limited = checkRateLimit(`auth:login:${ip}`, 10, 15 * 60 * 1000);
    if (!limited.allowed) {
      return rateLimitResponse(limited.retryAfterSec);
    }

    const body = await request.json().catch(() => ({}));
    const password = body.password as string | undefined;
    const normalizedPhone = normalizePhone(body.phone as string | undefined);

    if (!normalizedPhone || !password) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    const phoneLimited = checkRateLimit(
      `auth:login:phone:${normalizedPhone}`,
      8,
      15 * 60 * 1000
    );
    if (!phoneLimited.allowed) {
      return rateLimitResponse(phoneLimited.retryAfterSec);
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("email")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (!profile?.email) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    });

    const { error } = await supabase.auth.signInWithPassword({
      email: profile.email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[auth/login]", error);
    return NextResponse.json({ error: "Ошибка входа" }, { status: 500 });
  }
}
