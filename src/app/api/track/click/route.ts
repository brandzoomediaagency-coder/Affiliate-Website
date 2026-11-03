import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, createSessionClient } from "@/lib/supabase/clients";
import { isSupabaseConfigured } from "@/lib/env";
import { clickEventSchema } from "@/lib/validation/schemas";
import { deviceTypeFromUA, getClientIp, hashIp, isLikelyBot, rateLimit } from "@/lib/security/request";
import { hostnameOf } from "@/lib/utils";

/**
 * Records an outbound affiliate click (analytics only — a click is NOT a sale
 * or a commission). The visitor's browser has already navigated directly to
 * the merchant; this endpoint never redirects and never blocks navigation.
 */
export async function POST(request: NextRequest) {
  const noContent = new NextResponse(null, { status: 204 });
  if (Number(request.headers.get("content-length") ?? 0) > 4096) return noContent;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noContent;
  }
  const parsed = clickEventSchema.safeParse(body);
  if (!parsed.success) return noContent;
  const event = parsed.data;
  if (!event.listingId && !event.offerId && !event.merchantId) return noContent;

  const db = createServiceClient();
  if (!db) return noContent;

  const ip = await getClientIp();
  const ipHash = hashIp(ip, "clicks");
  const ua = request.headers.get("user-agent");
  // Excess clicks from one source are dropped rather than counted.
  if (!(await rateLimit(`click:${ipHash}`, 60, 60))) return noContent;

  let productId: string | null = null;
  let merchantId: string | null = null;
  let destination: string | null = null;

  if (event.listingId) {
    const { data } = await db
      .from("product_listings")
      .select("product_id, merchant_id, affiliate_url, is_active")
      .eq("id", event.listingId)
      .maybeSingle();
    if (!data?.is_active) return noContent;
    productId = data.product_id;
    merchantId = data.merchant_id;
    destination = data.affiliate_url;
  } else if (event.offerId) {
    const { data } = await db.from("offers").select("product_id, merchant_id, offer_url, status").eq("id", event.offerId).maybeSingle();
    if (!data || data.status !== "published") return noContent;
    productId = data.product_id;
    merchantId = data.merchant_id;
    destination = data.offer_url;
  } else if (event.merchantId) {
    const { data } = await db.from("merchants").select("id, visit_url, website_url, is_active").eq("id", event.merchantId).maybeSingle();
    if (!data?.is_active) return noContent;
    merchantId = data.id;
    destination = data.visit_url || data.website_url;
  }

  let userId: string | null = null;
  if (isSupabaseConfigured()) {
    try {
      const session = await createSessionClient();
      const { data } = await session.auth.getClaims();
      userId = (data?.claims?.sub as string | undefined) ?? null;
    } catch {
      userId = null;
    }
  }

  const sourcePath = event.sourcePath?.startsWith("/") ? event.sourcePath.slice(0, 500) : null;
  const { error } = await db.from("affiliate_click_events").insert({
    listing_id: event.listingId ?? null,
    offer_id: event.offerId ?? null,
    product_id: productId,
    merchant_id: merchantId,
    destination_host: hostnameOf(destination),
    source_path: sourcePath,
    source_component: event.sourceComponent?.slice(0, 60) ?? null,
    user_id: userId,
    anon_id: event.anonId?.replace(/[^a-zA-Z0-9]/g, "").slice(0, 64) || null,
    ip_hash: ipHash,
    device_type: deviceTypeFromUA(ua),
    referrer_host: hostnameOf(event.referrer),
    utm_source: event.utm?.source ?? null,
    utm_medium: event.utm?.medium ?? null,
    utm_campaign: event.utm?.campaign ?? null,
    utm_term: event.utm?.term ?? null,
    utm_content: event.utm?.content ?? null,
    country: request.headers.get("x-vercel-ip-country")?.slice(0, 8) ?? null,
    is_suspected_bot: isLikelyBot(ua),
  });
  if (error) console.error("[track/click] insert failed:", error.message);
  return noContent;
}
