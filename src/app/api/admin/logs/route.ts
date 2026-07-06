import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const result = await withAdmin(async () => {
    try {
      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
      const action = searchParams.get("action");
      const entityType = searchParams.get("entity_type");
      const dateFrom = searchParams.get("date_from");
      const dateTo = searchParams.get("date_to");

      const admin = createAdminClient();
      let query = admin
        .from("admin_audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (action) query = query.eq("action", action);
      if (entityType) query = query.eq("entity_type", entityType);
      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      const actorIds = Array.from(new Set((data || []).map((l) => l.actor_id).filter(Boolean))) as string[];
      let emailMap: Record<string, string> = {};

      if (actorIds.length > 0) {
        const { data: users } = await admin.from("users").select("id, email").in("id", actorIds);
        emailMap = Object.fromEntries((users || []).map((u) => [u.id, u.email]));
      }

      const logs = (data || []).map((log) => ({
        ...log,
        actor_email: log.actor_id ? emailMap[log.actor_id] ?? "—" : "—",
      }));

      return NextResponse.json({
        logs,
        pagination: {
          page,
          pageSize,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / pageSize),
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ошибка загрузки логов";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });

  return result instanceof NextResponse ? result : result;
}
