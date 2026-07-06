import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const RESTAURANT_ROLES = ["restaurant_owner", "restaurant_admin"] as const;

export async function GET() {
  const result = await withAdmin(async () => {
    const admin = createAdminClient();

    const { data: roleRows } = await admin
      .from("roles")
      .select("id, name, display_name")
      .in("name", [...RESTAURANT_ROLES]);

    const roleIds = (roleRows || []).map((r) => r.id);
    if (roleIds.length === 0) {
      return NextResponse.json({ admins: [], restaurants: [], roles: [] });
    }

    const { data: userRoles, error } = await admin
      .from("user_roles")
      .select(
        "id, user_id, restaurant_id, is_active, assigned_at, roles(name, display_name), restaurants(name)"
      )
      .in("role_id", roleIds)
      .order("assigned_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userIds = Array.from(new Set((userRoles || []).map((ur) => ur.user_id)));
    const { data: userRows } = userIds.length
      ? await admin.from("users").select("id, email, full_name").in("id", userIds)
      : { data: [] };

    const userById = new Map((userRows || []).map((u) => [u.id, u]));

    const { data: restaurants } = await admin
      .from("restaurants")
      .select("id, name")
      .order("name");

    const admins = (userRoles || []).map((ur) => {
      const role = ur.roles as unknown as { name: string; display_name: string } | null;
      const restaurant = ur.restaurants as unknown as { name: string } | null;
      const user = userById.get(ur.user_id);

      return {
        user_role_id: ur.id,
        user_id: ur.user_id,
        email: user?.email ?? null,
        full_name: user?.full_name ?? null,
        restaurant_id: ur.restaurant_id,
        restaurant_name: restaurant?.name ?? null,
        role_name: role?.name ?? null,
        role_display_name: role?.display_name ?? null,
        is_active: ur.is_active,
        assigned_at: ur.assigned_at,
      };
    });

    return NextResponse.json({
      admins,
      restaurants: restaurants || [],
      roles: (roleRows || []).map((r) => ({
        name: r.name,
        display_name: r.display_name,
      })),
    });
  });

  return result instanceof NextResponse ? result : result;
}

export async function POST(request: NextRequest) {
  const result = await withAdmin(async (actorId) => {
    const body = await request.json();
    const { target_user_id, role_name, restaurant_id, email } = body;

    if (role_name === "admin") {
      return NextResponse.json(
        { error: "Роль admin нельзя назначить через этот API" },
        { status: 403 }
      );
    }

    if (!role_name || !RESTAURANT_ROLES.includes(role_name)) {
      return NextResponse.json(
        { error: "Допустимые роли: restaurant_owner, restaurant_admin" },
        { status: 400 }
      );
    }

    if (!restaurant_id) {
      return NextResponse.json({ error: "Укажите ресторан" }, { status: 400 });
    }

    const admin = createAdminClient();

    let userId = target_user_id as string | undefined;
    if (!userId && email) {
      const { data: userRow } = await admin
        .from("users")
        .select("id")
        .ilike("email", String(email).trim())
        .maybeSingle();
      userId = userRow?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Укажите пользователя (target_user_id или email)" },
        { status: 400 }
      );
    }

    const { data: role } = await admin
      .from("roles")
      .select("id")
      .eq("name", role_name)
      .single();

    if (!role) {
      return NextResponse.json({ error: "Роль не найдена" }, { status: 404 });
    }

    const { data: existingRole } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role_id", role.id)
      .eq("restaurant_id", restaurant_id)
      .maybeSingle();

    if (existingRole) {
      await admin
        .from("user_roles")
        .update({
          is_active: true,
          assigned_by: actorId,
          assigned_at: new Date().toISOString(),
        })
        .eq("id", existingRole.id);
    } else {
      await admin.from("user_roles").insert({
        user_id: userId,
        role_id: role.id,
        restaurant_id,
        assigned_by: actorId,
        is_active: true,
      });
    }

    return NextResponse.json({ success: true, message: "Роль назначена" });
  });

  return result instanceof NextResponse ? result : result;
}

export async function DELETE(request: NextRequest) {
  const result = await withAdmin(async () => {
    const { searchParams } = new URL(request.url);
    const user_role_id = searchParams.get("user_role_id");

    if (!user_role_id) {
      return NextResponse.json({ error: "Укажите user_role_id" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("id, roles(name)")
      .eq("id", user_role_id)
      .maybeSingle();

    if (!roleRow) {
      return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
    }

    const roleName = (roleRow.roles as unknown as { name: string } | null)?.name;

    if (roleName === "admin") {
      return NextResponse.json(
        { error: "Роль admin нельзя деактивировать через этот API" },
        { status: 403 }
      );
    }

    if (
      roleName &&
      !RESTAURANT_ROLES.includes(roleName as (typeof RESTAURANT_ROLES)[number])
    ) {
      return NextResponse.json(
        { error: "Можно деактивировать только роли ресторанов" },
        { status: 400 }
      );
    }

    await admin.from("user_roles").update({ is_active: false }).eq("id", user_role_id);

    return NextResponse.json({ success: true, message: "Роль деактивирована" });
  });

  return result instanceof NextResponse ? result : result;
}
