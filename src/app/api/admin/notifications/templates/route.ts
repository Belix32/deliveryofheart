import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { logAdminAction } from "@/lib/admin/audit";
import { parseJsonBody, parseQuery } from "@/lib/admin/validate";
import {
  notificationTemplateCreateSchema,
  notificationTemplatePatchSchema,
  idQuerySchema,
} from "@/lib/admin/schemas";
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
    const parsed = await parseJsonBody(request, notificationTemplateCreateSchema);
    if (!parsed.ok) return parsed.response;

    const { name, channel, subject, body: templateBody, is_active } = parsed.data;
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("notification_templates")
      .insert({
        name,
        channel,
        subject: subject || null,
        body: templateBody,
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
    const parsed = await parseJsonBody(request, notificationTemplatePatchSchema);
    if (!parsed.ok) return parsed.response;

    const { id, name, channel, subject, body: templateBody, is_active } = parsed.data;
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
    const parsed = parseQuery(new URL(request.url).searchParams, idQuerySchema);
    if (!parsed.ok) return parsed.response;

    const { id } = parsed.data;
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
