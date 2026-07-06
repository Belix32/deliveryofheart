import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { logAdminAction } from "@/lib/admin/audit";
import { parseJsonBody } from "@/lib/admin/validate";
import {
  notificationCampaignCreateSchema,
  notificationCampaignPatchSchema,
} from "@/lib/admin/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const result = await withAdmin(async () => {
    try {
      const admin = createAdminClient();

      const [
        { data: campaigns, error: campaignsError },
        { count: templatesCount },
        { count: activeTemplatesCount },
        { count: sentCampaignsCount },
        { data: sentStats },
      ] = await Promise.all([
        admin
          .from("notification_campaigns")
          .select("*, notification_templates(name, channel)")
          .order("created_at", { ascending: false }),
        admin.from("notification_templates").select("*", { count: "exact", head: true }),
        admin
          .from("notification_templates")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true),
        admin
          .from("notification_campaigns")
          .select("*", { count: "exact", head: true })
          .in("status", ["sent", "sent_manual"]),
        admin
          .from("notification_campaigns")
          .select("sent_count, open_count")
          .in("status", ["sent", "sent_manual"]),
      ]);

      if (campaignsError) throw campaignsError;

      const totalSent = (sentStats || []).reduce((sum, c) => sum + (c.sent_count || 0), 0);
      const totalOpens = (sentStats || []).reduce((sum, c) => sum + (c.open_count || 0), 0);
      const openRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0;

      return NextResponse.json({
        campaigns: campaigns || [],
        stats: {
          total_sent: totalSent,
          open_rate: openRate,
          active_templates: activeTemplatesCount ?? 0,
          templates_count: templatesCount ?? 0,
          sent_campaigns_count: sentCampaignsCount ?? 0,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ошибка загрузки кампаний";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });

  return result instanceof NextResponse ? result : result;
}

export async function POST(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = await parseJsonBody(request, notificationCampaignCreateSchema);
    if (!parsed.ok) return parsed.response;

    const { template_id, title, status } = parsed.data;
    const admin = createAdminClient();
    const insert: Record<string, unknown> = {
      title,
      status,
      template_id: template_id || null,
    };

    if (status === "sent_manual") {
      insert.sent_at = new Date().toISOString();
      insert.sent_count = 0;
      insert.open_count = 0;
    }

    const { data, error } = await admin
      .from("notification_campaigns")
      .insert(insert)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "create", "notification_campaign", data.id, {
      title: data.title,
      status: data.status,
    });
    return NextResponse.json({ campaign: data });
  });

  return result instanceof NextResponse ? result : result;
}

export async function PATCH(request: NextRequest) {
  const result = await withAdmin(async (userId) => {
    const parsed = await parseJsonBody(request, notificationCampaignPatchSchema);
    if (!parsed.ok) return parsed.response;

    const { id, status } = parsed.data;
    const updates: Record<string, unknown> = {};
    if (status === "sent_manual") {
      updates.status = "sent_manual";
      updates.sent_at = new Date().toISOString();
    } else if (status) {
      updates.status = status;
    }

    const admin = createAdminClient();
    const { error } = await admin.from("notification_campaigns").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAdminAction(userId, "update", "notification_campaign", id, updates);
    return NextResponse.json({ success: true });
  });

  return result instanceof NextResponse ? result : result;
}
