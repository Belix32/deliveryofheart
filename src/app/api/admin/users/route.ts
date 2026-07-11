import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { logAdminAction } from "@/lib/admin/audit";
import { parseJsonBody, parseQuery } from "@/lib/admin/validate";
import { assignRoleSchema, userRoleIdQuerySchema } from "@/lib/admin/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const result = await withAdmin(async () => {
    const admin = createAdminClient();
    const { data: users, error } = await admin.auth.admin.listUsers();

    if (error) {
      return NextResponse.json({ error: "Ошибка получения пользователей" }, { status: 500 });
    }

    const { data: allUserRoles } = await admin
      .from("user_roles")
      .select("*, roles(name, display_name), restaurants(name)")
      .in(
        "user_id",
        users.users.map((u) => u.id)
      );

    const { data: roles } = await admin.from("roles").select("*").order("name");
    const { data: restaurants } = await admin.from("restaurants").select("id, name");

    const usersWithRoles = users.users.map((user) => {
      const userRole = allUserRoles?.filter((ur) => ur.user_id === user.id) || [];
      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
        roles: userRole.map((ur) => ({
          id: ur.roles?.id,
          name: ur.roles?.name,
          display_name: ur.roles?.display_name,
          restaurant_id: ur.restaurant_id,
          restaurant_name: ur.restaurants?.name,
          is_active: ur.is_active,
          user_role_id: ur.id,
        })),
      };
    });

    return NextResponse.json({
      users: usersWithRoles,
      roles: (roles || []).filter((r) => r.name !== "admin"),
      restaurants: restaurants || [],
    });
  });

  return result instanceof NextResponse ? result : result;
}

export async function POST(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = await parseJsonBody(request, assignRoleSchema);
    if (!parsed.ok) return parsed.response;

    const { target_user_id, role_name, restaurant_id } = parsed.data;

    if (role_name === "admin") {
      return NextResponse.json(
        { error: "Роль admin назначается только через базу данных" },
        { status: 403 }
      );
    }

    if (!target_user_id) {
      return NextResponse.json({ error: "Укажите пользователя" }, { status: 400 });
    }

    const admin = createAdminClient();
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
      .select("*")
      .eq("user_id", target_user_id)
      .eq("role_id", role.id)
      .eq("restaurant_id", restaurant_id || null)
      .maybeSingle();

    if (existingRole) {
      await admin
        .from("user_roles")
        .update({ is_active: true, assigned_by: userId, assigned_at: new Date().toISOString() })
        .eq("id", existingRole.id);
    } else {
      await admin.from("user_roles").insert({
        user_id: target_user_id,
        role_id: role.id,
        restaurant_id: restaurant_id || null,
        assigned_by: userId,
        is_active: true,
      });
    }

    await logAdminAction(userId, "assign_role", "user", target_user_id, {
      role_name,
      restaurant_id,
    });
    return NextResponse.json({ success: true, message: "Роль назначена" });
  });

  return result instanceof NextResponse ? result : result;
}

export async function DELETE(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = parseQuery(new URL(request.url).searchParams, userRoleIdQuerySchema);
    if (!parsed.ok) return parsed.response;

    const { user_role_id } = parsed.data;
    const admin = createAdminClient();
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("*, roles(name)")
      .eq("id", user_role_id)
      .maybeSingle();

    if (roleRow?.roles?.name === "admin") {
      return NextResponse.json(
        { error: "Роль admin нельзя отозвать через панель" },
        { status: 403 }
      );
    }

    await admin.from("user_roles").update({ is_active: false }).eq("id", user_role_id);

    await logAdminAction(userId, "revoke_role", "user_role", user_role_id, {
      user_id: roleRow?.user_id,
    });
    return NextResponse.json({ success: true, message: "Роль удалена" });
  });

  return result instanceof NextResponse ? result : result;
}
