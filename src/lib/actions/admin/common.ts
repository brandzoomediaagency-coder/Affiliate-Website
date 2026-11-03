import "server-only";
import { updateTag } from "next/cache";
import { AuthorizationError, type SessionUser } from "@/lib/auth";
import type { TypedSupabaseClient } from "@/lib/supabase/clients";
import type { ActionResult } from "@/lib/validation/form";
import { CACHE_TAGS } from "@/lib/data/settings";

type Session = { user: SessionUser; supabase: Pick<TypedSupabaseClient, "from"> };

/** Writes an audit log entry for an admin action (best effort). */
export async function audit(
  { user, supabase }: Session,
  action: string,
  entityType: string,
  entityId: string | null,
  summary?: string,
  details?: Record<string, unknown>,
) {
  const { error } = await supabase.from("admin_audit_log").insert({
    actor_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    summary: summary?.slice(0, 500) ?? null,
    details: (details ?? null) as never,
  });
  if (error) console.warn("[audit] failed:", error.message);
}

/** Expires cached public data so admins see their changes immediately. */
export function invalidate(...tags: Array<keyof typeof CACHE_TAGS | string>) {
  for (const tag of new Set(tags)) {
    updateTag(tag in CACHE_TAGS ? CACHE_TAGS[tag as keyof typeof CACHE_TAGS] : tag);
  }
}

export function actionError(e: unknown): ActionResult {
  if (e instanceof AuthorizationError) return { ok: false, message: e.message };
  // Re-throw Next.js control-flow errors (redirect/notFound).
  if (e && typeof e === "object" && "digest" in e && typeof (e as { digest?: unknown }).digest === "string") {
    const digest = (e as { digest: string }).digest;
    if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK")) throw e;
  }
  console.error("[admin action]", e);
  return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." };
}

/** Maps common Postgres errors to friendly messages. */
export function dbError(error: { code?: string; message: string } | null, entity = "record"): ActionResult | null {
  if (!error) return null;
  if (error.code === "23505") return { ok: false, message: `A ${entity} with this slug or value already exists.`, fieldErrors: { slug: ["Already in use"] } };
  if (error.code === "23503") return { ok: false, message: `This ${entity} is referenced by other records and cannot be changed this way.` };
  if (error.code === "42501") return { ok: false, message: "You don't have permission to do that." };
  if (error.code === "23514") return { ok: false, message: `Some values are not allowed: ${error.message}` };
  return { ok: false, message: error.message };
}
