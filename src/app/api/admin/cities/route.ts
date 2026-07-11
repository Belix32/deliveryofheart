import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { logAdminAction } from "@/lib/admin/audit";
import { parseJsonBody, parseQuery } from "@/lib/admin/validate";
import { cityCreateSchema, cityPatchSchema, idQuerySchema } from "@/lib/admin/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

async function citiesWithStats(admin: ReturnType<typeof createAdminClient>) {
  const [{ data: cities, error }, { data: restaurants }, { data: orders }] = await Promise.all([
    admin.from("cities").select("*").order("name"),
    admin.from("restaurants").select("id, city, is_active"),
    admin.from("orders").select("id, delivery_city"),
  ]);

  if (error) throw error;

  return (cities || []).map((city) => {
    const cityRestaurants = (restaurants || []).filter((r) => r.city === city.name);
    const cityOrders = (orders || []).filter((o) => o.delivery_city === city.name);
    return {
      ...city,
      restaurants_count: cityRestaurants.length,
      active_restaurants_count: cityRestaurants.filter((r) => r.is_active).length,
      orders_count: cityOrders.length,
    };
  });
}

export async function GET() {
  const result = await withAdmin(async () => {
    try {
      const admin = createAdminClient();
      const cities = await citiesWithStats(admin);
      return NextResponse.json({ cities });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ошибка загрузки городов";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });

  return result instanceof NextResponse ? result : result;
}

export async function POST(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = await parseJsonBody(request, cityCreateSchema);
    if (!parsed.ok) return parsed.response;

    const { name, region, is_active } = parsed.data;
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("cities")
      .insert({ name, region: region || null, is_active })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "create", "city", data.id, { name });
    return NextResponse.json({ city: data });
  });

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = await parseJsonBody(request, cityPatchSchema);
    if (!parsed.ok) return parsed.response;

    const { id, ...updates } = parsed.data;
    const admin = createAdminClient();
    const { error } = await admin.from("cities").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "update", "city", id, updates);
    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}

export async function DELETE(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = parseQuery(new URL(request.url).searchParams, idQuerySchema);
    if (!parsed.ok) return parsed.response;

    const { id } = parsed.data;
    const admin = createAdminClient();
    const { error } = await admin.from("cities").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "delete", "city", id);
    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}
