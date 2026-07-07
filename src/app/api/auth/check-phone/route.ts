import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const normalized = normalizePhone(body.phone as string | undefined);

    if (!normalized) {
      return NextResponse.json(
        { available: false, error: "Введите корректный номер телефона" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq("phone", normalized)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        available: false,
        error: "Этот номер телефона уже зарегистрирован. Войдите в существующий аккаунт.",
      });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error("[auth/check-phone]", error);
    return NextResponse.json({ error: "Ошибка проверки телефона" }, { status: 500 });
  }
}
