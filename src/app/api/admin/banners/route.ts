import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { logAdminAction } from "@/lib/admin/audit";
import { parseJsonBody, parseQuery } from "@/lib/admin/validate";
import { bannerCreateSchema, bannerPatchSchema, idQuerySchema } from "@/lib/admin/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const result = await withAdmin(async () => {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("banners")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return NextResponse.json({ banners: data || [] });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ошибка загрузки баннеров";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });

  return result instanceof NextResponse ? result : result;
}

export async function POST(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = await parseJsonBody(request, bannerCreateSchema);
    if (!parsed.ok) return parsed.response;

    const {
      title,
      subtitle,
      image_url,
      link_url,
      city,
      starts_at,
      ends_at,
      is_active,
      sort_order,
    } = parsed.data;

    const admin = createAdminClient();

    let nextSort = sort_order;
    if (nextSort === undefined) {
      const { data: maxRow } = await admin
        .from("banners")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      nextSort = (maxRow?.sort_order ?? 0) + 1;
    }

    const { data, error } = await admin
      .from("banners")
      .insert({
        title,
        subtitle: subtitle || null,
        image_url,
        link_url: link_url || null,
        city: city || null,
        starts_at: starts_at || null,
        ends_at: ends_at || null,
        is_active,
        sort_order: nextSort,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "create", "banner", data.id, { title: data.title });
    return NextResponse.json({ banner: data });
  });

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = await parseJsonBody(request, bannerPatchSchema);
    if (!parsed.ok) return parsed.response;

    const { id, reorder, ...fields } = parsed.data;
    const admin = createAdminClient();

    if (reorder?.length) {
      for (const item of reorder) {
        await admin.from("banners").update({ sort_order: item.sort_order }).eq("id", item.id);
      }
      await logAdminAction(userId, "reorder", "banner", undefined, { count: reorder.length });
      return NextResponse.json({ success: true });
    }

    const updates: Record<string, unknown> = {};
    if (fields.title !== undefined) updates.title = fields.title;
    if (fields.subtitle !== undefined) updates.subtitle = fields.subtitle;
    if (fields.image_url !== undefined) updates.image_url = fields.image_url;
    if (fields.link_url !== undefined) updates.link_url = fields.link_url;
    if (fields.city !== undefined) updates.city = fields.city;
    if (fields.starts_at !== undefined) updates.starts_at = fields.starts_at;
    if (fields.ends_at !== undefined) updates.ends_at = fields.ends_at;
    if (fields.is_active !== undefined) updates.is_active = fields.is_active;
    if (fields.sort_order !== undefined) updates.sort_order = fields.sort_order;

    const { error } = await admin.from("banners").update(updates).eq("id", id!);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "update", "banner", id!, updates);
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
    const { error } = await admin.from("banners").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "delete", "banner", id);
    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}
