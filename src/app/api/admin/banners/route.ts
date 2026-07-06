import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { logAdminAction } from "@/lib/admin/audit";
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
    const body = await request.json();
    const {
      title,
      subtitle,
      image_url,
      link_url,
      city,
      starts_at,
      ends_at,
      is_active = true,
      sort_order,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Укажите заголовок" }, { status: 400 });
    }
    if (!image_url?.trim()) {
      return NextResponse.json({ error: "Укажите URL изображения" }, { status: 400 });
    }

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
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        image_url: image_url.trim(),
        link_url: link_url?.trim() || null,
        city: city?.trim() || null,
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
    const body = await request.json();
    const { id, reorder, ...fields } = body;

    const admin = createAdminClient();

    if (reorder && Array.isArray(reorder)) {
      for (const item of reorder as { id: string; sort_order: number }[]) {
        if (!item.id || item.sort_order === undefined) continue;
        await admin.from("banners").update({ sort_order: item.sort_order }).eq("id", item.id);
      }
      await logAdminAction(userId, "reorder", "banner", undefined, { count: reorder.length });
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: "Укажите id баннера" }, { status: 400 });
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

    const { error } = await admin.from("banners").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "update", "banner", id, updates);
    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}

export async function DELETE(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Укажите id" }, { status: 400 });
    }

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
