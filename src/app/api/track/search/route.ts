import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/clients";
import { searchEventSchema } from "@/lib/validation/schemas";
import { getClientIp, hashIp, isLikelyBot, rateLimit } from "@/lib/security/request";

/** Logs internal search terms (no personal data) for the admin analytics page. */
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
  const parsed = searchEventSchema.safeParse(body);
  if (!parsed.success) return noContent;

  const db = createServiceClient();
  if (!db) return noContent;
  const ip = await getClientIp();
  if (!(await rateLimit(`search:${hashIp(ip, "ratelimit")}`, 30, 60))) return noContent;

  const query = parsed.data.q.replace(/\s+/g, " ").trim().slice(0, 200);
  const normalized = query.toLowerCase();
  // Skip strings that look like emails or phone numbers (avoid storing personal data).
  if (/@/.test(normalized) || /\d{8,}/.test(normalized.replace(/[\s-]/g, ""))) return noContent;

  const { error } = await db.from("search_queries").insert({
    query,
    normalized_query: normalized,
    results_count: parsed.data.results,
  });
  if (error) console.error("[track/search] failed:", error.message);
  return noContent;
}
