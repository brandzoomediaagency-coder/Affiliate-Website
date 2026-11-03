import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/clients";
import { viewEventSchema } from "@/lib/validation/schemas";
import { getClientIp, hashIp, isLikelyBot, rateLimit } from "@/lib/security/request";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";
const TABLE_FOR_TYPE = {
  product: "products",
  category: "categories",
  store: "merchants",
  blog_post: "blog_posts",
  comparison: "comparisons",
} as const;

/** First-party, cookie-less content view counter (aggregated per day). */
export async function POST(request: NextRequest) {
  const noContent = new NextResponse(null, { status: 204 });
  if (Number(request.headers.get("content-length") ?? 0) > 1024) return noContent;
  if (isLikelyBot(request.headers.get("user-agent"))) return noContent;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noContent;
  }
  const parsed = viewEventSchema.safeParse(body);
  if (!parsed.success) return noContent;
  const { type, id } = parsed.data;

  const db = createServiceClient();
  if (!db) return noContent;
  const ip = await getClientIp();
  if (!(await rateLimit(`view:${hashIp(ip, "ratelimit")}`, 120, 60))) return noContent;

  let entityId = NIL_UUID;
  if (type !== "home" && type !== "deals") {
    if (!id) return noContent;
    const table = TABLE_FOR_TYPE[type];
    const { data } = await db.from(table).select("id").eq("id", id).maybeSingle();
    if (!data) return noContent;
    entityId = id;
  }
  const { error } = await db.rpc("track_content_view", { p_entity_type: type, p_entity_id: entityId });
  if (error) console.error("[track/view] failed:", error.message);
  return noContent;
}
