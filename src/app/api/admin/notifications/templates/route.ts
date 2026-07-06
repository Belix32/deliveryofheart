import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { logAdminAction } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const result = await withAdmin(async () => {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("notification_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return NextResponse.json({ templates: data || [] });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ошибка загрузки шаблонов";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });

  return result instanceof NextResponse ? result : result;
}

export async function POST(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const body = await request.json();
    const { name, channel, subject, body: templateBody, is_active = true } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Укажите название шаблона" }, { status: 400 });
    }
    if (!templateBody?.trim()) {
      return NextResponse.json({ error: "Укажите текст шаблона" }, { status: 400 });
    }
    if (!channel || !["push", "email", "sms"].includes(channel)) {
      return NextResponse.json({ error: "Укажите канал: push, email или sms" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("notification_templates")
      .insert({
        name: name.trim(),
        channel,
        subject: subject?.trim() || null,
        body: templateBody.trim(),
        is_active,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "create", "notification_template", data.id, { name: data.name });
    return NextResponse.json({ template: data });
  });

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const body = await request.json();
    const { id, name, channel, subject, body: templateBody, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "Укажите id шаблона" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (channel !== undefined) updates.channel = channel;
    if (subject !== undefined) updates.subject = subject;
    if (templateBody !== undefined) updates.body = templateBody;
    if (is_active !== undefined) updates.is_active = is_active;

    const admin = createAdminClient();
    const { error } = await admin.from("notification_templates").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "update", "notification_template", id, updates);
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
    const { error } = await admin.from("notification_templates").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "delete", "notification_template", id);
    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}
