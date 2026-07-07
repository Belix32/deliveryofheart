import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import { APP_CITY } from "@/lib/config";

async function isPhoneTaken(phone: string, excludeUserId?: string): Promise<boolean> {
  const admin = createAdminClient();
  let query = admin.from("users").select("id").eq("phone", phone);
  if (excludeUserId) query = query.neq("id", excludeUserId);
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getSessionUser();
    if (!authUser) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const fullName = body.full_name as string | undefined;
    const phone = body.phone as string | undefined;

    const admin = createAdminClient();
    const email = authUser.email || `${authUser.id}@users.local`;
    const normalizedPhone = phone
      ? normalizePhone(phone)
      : normalizePhone(authUser.user_metadata?.phone as string | undefined);

    if (normalizedPhone && (await isPhoneTaken(normalizedPhone, authUser.id))) {
      return NextResponse.json(
        { error: "Этот номер телефона уже привязан к другому аккаунту" },
        { status: 409 }
      );
    }

    const { data: existing } = await admin
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (existing) {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (fullName && !existing.full_name) updates.full_name = fullName;
      if (normalizedPhone && !existing.phone) updates.phone = normalizedPhone;

      if (Object.keys(updates).length > 1) {
        await admin.from("users").update(updates).eq("id", authUser.id);
      }

      const { data: profile } = await admin
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      return NextResponse.json({ profile });
    }

    const { data: profile, error } = await admin
      .from("users")
      .insert({
        id: authUser.id,
        email,
        phone: normalizedPhone,
        full_name: fullName || authUser.user_metadata?.full_name || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[auth/sync-profile]", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Этот номер телефона уже привязан к другому аккаунту" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: clientRole } = await admin
      .from("roles")
      .select("id")
      .eq("name", "client")
      .maybeSingle();

    if (clientRole) {
      await admin.from("user_roles").upsert(
        {
          user_id: authUser.id,
          role_id: clientRole.id,
          is_active: true,
        },
        { onConflict: "user_id,role_id,restaurant_id" }
      );
    }

    // Ensure courier profile uses app city if created later
    void APP_CITY;

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[auth/sync-profile]", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
