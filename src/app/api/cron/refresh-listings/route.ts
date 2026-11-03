import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";
import { revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/clients";
import { serverEnv } from "@/lib/env.server";
import { syncListingsFromApis } from "@/lib/affiliate/sync";
import { CACHE_TAGS } from "@/lib/data/settings";

function authorised(request: NextRequest): boolean {
  const secret = serverEnv.cronSecret;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * Scheduled refresh of listing prices/availability from OFFICIAL merchant
 * APIs (Amazon Creators API, Flipkart Affiliate API) when configured.
 * Protected by CRON_SECRET (Vercel Cron sends it as a Bearer token).
 */
export async function GET(request: NextRequest) {
  await connection();
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: "SUPABASE_SECRET_KEY is not configured" }, { status: 500 });

  try {
    const reports = await syncListingsFromApis(db);
    if (reports.some((r) => r.updated > 0 || r.missing > 0)) revalidateTag(CACHE_TAGS.products, "max");
    return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), reports });
  } catch (error) {
    console.error("[cron/refresh-listings]", error);
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
