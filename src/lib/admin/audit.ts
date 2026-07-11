import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/database.types";

export async function logAdminAction(
  actorId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  const admin = createAdminClient();
  await admin.from("admin_audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    metadata: (metadata ?? null) as Json,
  });
}
