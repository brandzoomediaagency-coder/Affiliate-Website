import "server-only";
import type { TypedSupabaseClient } from "@/lib/supabase/clients";
import { getAdapter } from "./registry";
import { hostAllowed, parseHttpsUrl } from "./url-checks";

export type SyncReport = {
  merchant: string;
  adapter: string;
  status: "skipped" | "success" | "partial" | "error";
  message: string;
  updated: number;
  missing: number;
};

/**
 * Refreshes listing prices/availability for merchants whose default
 * programme has an official API adapter that is configured. Listings that the
 * API does not return have their price cleared (never shown stale) and
 * availability set to "unknown".
 */
export async function syncListingsFromApis(db: TypedSupabaseClient, merchantId?: string): Promise<SyncReport[]> {
  let programQuery = db
    .from("affiliate_programs")
    .select("id, merchant_id, adapter_key, status, merchant:merchants(id, name, allowed_domains, is_active)")
    .eq("is_default", true);
  if (merchantId) programQuery = programQuery.eq("merchant_id", merchantId);
  const { data: programs, error } = await programQuery;
  if (error) throw new Error(error.message);

  const reports: SyncReport[] = [];
  for (const program of programs ?? []) {
    const merchant = program.merchant;
    const adapter = getAdapter(program.adapter_key);
    const base = { merchant: merchant?.name ?? "Unknown", adapter: adapter.label, updated: 0, missing: 0 };

    if (!merchant?.is_active || !adapter.supportsApi || !adapter.fetchProducts) {
      reports.push({ ...base, status: "skipped", message: "No official API integration for this merchant." });
      continue;
    }
    if (!adapter.isConfigured()) {
      reports.push({ ...base, status: "skipped", message: `API credentials not configured (${adapter.requiredEnv.join(", ")}).` });
      continue;
    }
    if (program.status !== "approved") {
      reports.push({ ...base, status: "skipped", message: `Programme status is "${program.status}", not approved.` });
      continue;
    }

    const { data: listings, error: listingError } = await db
      .from("product_listings")
      .select("id, merchant_product_id, affiliate_url")
      .eq("merchant_id", merchant.id)
      .eq("is_active", true)
      .not("merchant_product_id", "is", null);
    if (listingError) throw new Error(listingError.message);
    if (!listings?.length) {
      reports.push({ ...base, status: "skipped", message: "No active listings with a merchant product id." });
      continue;
    }

    const now = new Date().toISOString();
    try {
      const products = await adapter.fetchProducts(listings.map((l) => l.merchant_product_id!));
      const byId = new Map(products.map((p) => [p.merchantProductId.toUpperCase(), p]));
      let updated = 0;
      let missing = 0;
      for (const listing of listings) {
        const product = byId.get(listing.merchant_product_id!.toUpperCase());
        if (!product) {
          missing++;
          await db
            .from("product_listings")
            .update({
              current_price: null,
              price_checked_at: null,
              availability: "unknown",
              last_synced_at: now,
              sync_error: "Item not returned by the merchant API.",
            })
            .eq("id", listing.id);
          continue;
        }
        const apiUrl = product.affiliateUrl ? parseHttpsUrl(product.affiliateUrl) : null;
        const useApiUrl = apiUrl && hostAllowed(apiUrl.hostname, merchant.allowed_domains);
        await db
          .from("product_listings")
          .update({
            current_price: product.price,
            previous_price: product.previousPrice,
            currency: product.currency.slice(0, 3).toUpperCase(),
            availability: product.availability,
            price_source: adapter.priceSource,
            price_checked_at: product.price !== null ? now : null,
            last_synced_at: now,
            sync_error: null,
            ...(useApiUrl ? { affiliate_url: product.affiliateUrl! } : {}),
          })
          .eq("id", listing.id);
        updated++;
      }
      const status = missing > 0 ? "partial" : "success";
      const message = `Updated ${updated} listing(s)${missing ? `, ${missing} not returned by the API` : ""}.`;
      await db
        .from("affiliate_programs")
        .update({ last_sync_at: now, last_sync_status: status, last_sync_message: message, api_status: "active" })
        .eq("id", program.id);
      reports.push({ ...base, status, message, updated, missing });
    } catch (e) {
      const message = (e as Error).message.slice(0, 500);
      await db
        .from("affiliate_programs")
        .update({ last_sync_at: now, last_sync_status: "error", last_sync_message: message, api_status: "error" })
        .eq("id", program.id);
      reports.push({ ...base, status: "error", message });
    }
  }
  return reports;
}

/**
 * Lightweight reachability check for an affiliate link. It only requests
 * headers (no page content is read or stored). Some merchants block
 * automated requests, so a non-2xx result is a prompt for manual review,
 * not proof that a link is broken.
 */
export async function checkLinkReachability(url: string): Promise<{
  status: "ok" | "redirected" | "broken" | "error";
  message: string;
}> {
  const parsed = parseHttpsUrl(url);
  if (!parsed) return { status: "error", message: "Not a valid https URL." };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(parsed, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "AffiliateLinkChecker/1.0 (+link verification; no content stored)" },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (response.status >= 200 && response.status < 300) return { status: "ok", message: `HTTP ${response.status}` };
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") ?? "";
      return { status: "redirected", message: `HTTP ${response.status} → ${location.slice(0, 200)}` };
    }
    if (response.status === 404 || response.status === 410) return { status: "broken", message: `HTTP ${response.status}` };
    return {
      status: "error",
      message: `HTTP ${response.status} — the merchant may block automated checks; verify manually.`,
    };
  } catch (e) {
    return { status: "error", message: `Request failed: ${(e as Error).message}` };
  }
}
