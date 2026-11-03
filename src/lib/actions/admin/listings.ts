"use server";

import { assertStaff } from "@/lib/auth";
import { listingSchema } from "@/lib/validation/schemas";
import { fromZodError, getBool, getDateTime, getNumber, getOptionalString, getString, type ActionResult } from "@/lib/validation/form";
import { getAdapter, validateListingUrls } from "@/lib/affiliate/registry";
import { checkLinkReachability } from "@/lib/affiliate/sync";
import type { ApiProduct } from "@/lib/affiliate/types";
import { actionError, audit, dbError, invalidate } from "./common";

/**
 * Creates or updates a merchant listing (affiliate link) for a product.
 * Price rules: a price can only be saved together with the time it was
 * verified; manual prices for merchants that forbid them are kept but never
 * displayed publicly.
 */
export async function saveListing(listingId: string | null, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { supabase, user } = session;
    const merchantId = getString(formData, "merchant_id");
    const { data: merchant } = await supabase
      .from("merchants")
      .select("name, allowed_domains, allow_manual_prices, affiliate_programs(id, adapter_key, is_default)")
      .eq("id", merchantId)
      .maybeSingle();
    if (!merchant) return { ok: false, message: "Choose a merchant.", fieldErrors: { merchant_id: ["Required"] } };
    const programId = getOptionalString(formData, "program_id");
    const program =
      merchant.affiliate_programs.find((p) => p.id === programId) ?? merchant.affiliate_programs.find((p) => p.is_default) ?? null;
    const adapter = getAdapter(program?.adapter_key);

    // Optional: take price/availability/link from the merchant's OFFICIAL API at save time.
    let apiData: ApiProduct | null = null;
    if (getBool(formData, "use_api")) {
      const mpid = getString(formData, "merchant_product_id");
      if (!adapter.supportsApi || !adapter.fetchProducts || !adapter.isConfigured()) {
        return { ok: false, message: `${adapter.label} API is not available or not configured.` };
      }
      if (!mpid) return { ok: false, message: "Enter the merchant product id to use API data.", fieldErrors: { merchant_product_id: ["Required for API"] } };
      [apiData] = await adapter.fetchProducts([mpid]);
      if (!apiData) return { ok: false, message: "The official API did not return this product id." };
    }

    const currentPrice = apiData ? apiData.price : getNumber(formData, "current_price");
    const previousPrice = apiData ? apiData.previousPrice : getNumber(formData, "previous_price");
    if (Number.isNaN(currentPrice) || Number.isNaN(previousPrice)) {
      return { ok: false, message: "Prices must be numbers (rupees).", fieldErrors: { current_price: ["Invalid number"] } };
    }

    let existing: { current_price: number | null; price_checked_at: string | null; price_source: string } | null = null;
    if (listingId) {
      const { data } = await supabase.from("product_listings").select("current_price, price_checked_at, price_source").eq("id", listingId).single();
      existing = data;
    }
    const verifiedNow = getBool(formData, "price_verified_now") || Boolean(apiData);
    let priceCheckedAt: string | null = null;
    if (currentPrice !== null) {
      if (verifiedNow) priceCheckedAt = new Date().toISOString();
      else if (existing && Number(existing.current_price) === currentPrice && existing.price_checked_at) priceCheckedAt = existing.price_checked_at;
      else {
        return {
          ok: false,
          message: "Tick “I verified this price on the merchant's site just now” to save a new or changed price.",
          fieldErrors: { price_checked_at: ["Confirm when the price was verified"] },
        };
      }
    }

    const parsed = listingSchema.safeParse({
      product_id: getString(formData, "product_id"),
      merchant_id: merchantId,
      program_id: programId,
      variant_label: getString(formData, "variant_label"),
      destination_url: getString(formData, "destination_url"),
      affiliate_url: apiData?.affiliateUrl || getString(formData, "affiliate_url"),
      merchant_product_id: getOptionalString(formData, "merchant_product_id"),
      current_price: currentPrice,
      previous_price: currentPrice === null ? null : previousPrice,
      previous_price_type: getString(formData, "previous_price_type") || "mrp",
      availability: apiData?.availability ?? (getString(formData, "availability") || "unknown"),
      coupon_code: getOptionalString(formData, "coupon_code"),
      offer_details: getOptionalString(formData, "offer_details"),
      offer_expires_at: getDateTime(formData, "offer_expires_at"),
      price_checked_at: priceCheckedAt,
      is_active: getBool(formData, "is_active"),
      sort_order: Number(getString(formData, "sort_order") || "0"),
      internal_notes: getOptionalString(formData, "internal_notes"),
    });
    if (!parsed.success) return fromZodError(parsed.error);
    const input = parsed.data;

    const check = validateListingUrls(program?.adapter_key, {
      destinationUrl: input.destination_url,
      affiliateUrl: input.affiliate_url,
      allowedDomains: merchant.allowed_domains,
    });
    if (check.errors.length) return { ok: false, message: check.errors.join(" "), fieldErrors: { affiliate_url: check.errors } };
    const warnings = [...check.warnings];
    if (input.current_price !== null && !merchant.allow_manual_prices && !apiData) {
      warnings.push(
        `${merchant.name} prices entered manually are stored but NOT shown publicly (programme rules). Connect the official API to display prices.`,
      );
    }
    if (input.previous_price !== null && input.current_price !== null && input.previous_price <= input.current_price) {
      warnings.push("Previous price is not higher than the current price, so no discount will be shown.");
    }

    const record = {
      ...input,
      program_id: input.program_id ?? program?.id ?? null,
      price_source: apiData
        ? adapter.priceSource
        : existing?.price_source && existing.price_source !== "manual" && currentPrice === Number(existing.current_price)
          ? existing.price_source
          : "manual",
      ...(apiData ? { last_synced_at: new Date().toISOString(), sync_error: null } : {}),
      updated_by: user.id,
    };

    let id = listingId;
    if (listingId) {
      const { error } = await supabase.from("product_listings").update(record).eq("id", listingId);
      const failure = dbError(error, "listing for this merchant/variant");
      if (failure) return failure;
    } else {
      const { data, error } = await supabase
        .from("product_listings")
        .insert({ ...record, created_by: user.id })
        .select("id")
        .single();
      const failure = dbError(error, "listing for this merchant/variant");
      if (failure) return failure;
      id = data!.id;
    }
    await audit(session, listingId ? "listing.update" : "listing.create", "listing", id, `${merchant.name} listing for product ${input.product_id}`);
    const { data: product } = await supabase.from("products").select("slug").eq("id", input.product_id).single();
    invalidate("products", "comparisons", ...(product ? [`product:${product.slug}`] : []));
    return { ok: true, message: listingId ? "Listing updated." : "Listing added.", warnings };
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteListing(listingId: string): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { data } = await session.supabase.from("product_listings").select("product_id, products(slug)").eq("id", listingId).single();
    const { error } = await session.supabase.from("product_listings").delete().eq("id", listingId);
    const failure = dbError(error, "listing");
    if (failure) return failure;
    await audit(session, "listing.delete", "listing", listingId);
    invalidate("products", "comparisons", ...(data?.products ? [`product:${data.products.slug}`] : []));
    return { ok: true, message: "Listing deleted.", redirectTo: data ? `/admin/products/${data.product_id}` : "/admin/listings" };
  } catch (e) {
    return actionError(e);
  }
}

/** Checks that the affiliate link resolves (headers only, nothing scraped). */
export async function verifyListingUrl(listingId: string): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { data } = await session.supabase.from("product_listings").select("affiliate_url").eq("id", listingId).single();
    if (!data) return { ok: false, message: "Listing not found." };
    const result = await checkLinkReachability(data.affiliate_url);
    await session.supabase
      .from("product_listings")
      .update({ url_status: result.status, url_checked_at: new Date().toISOString(), url_check_message: result.message })
      .eq("id", listingId);
    return { ok: result.status === "ok" || result.status === "redirected", message: `Link check: ${result.status} — ${result.message}` };
  } catch (e) {
    return actionError(e);
  }
}

/** Looks up a product through the merchant's OFFICIAL API to prefill a listing. */
export async function lookupListingFromApi(
  merchantId: string,
  merchantProductId: string,
): Promise<{ ok: boolean; message: string; product?: ApiProduct }> {
  try {
    const { supabase } = await assertStaff();
    const { data: program } = await supabase
      .from("affiliate_programs")
      .select("adapter_key")
      .eq("merchant_id", merchantId)
      .eq("is_default", true)
      .maybeSingle();
    const adapter = getAdapter(program?.adapter_key);
    if (!adapter.supportsApi || !adapter.fetchProducts) {
      return { ok: false, message: `${adapter.label}: no official product API — enter details manually.` };
    }
    if (!adapter.isConfigured()) {
      return { ok: false, message: `API credentials are not configured. Set: ${adapter.requiredEnv.join(", ")}` };
    }
    const id = merchantProductId.trim();
    if (!id) return { ok: false, message: "Enter the merchant product id (e.g. ASIN or Flipkart product id) first." };
    const [product] = await adapter.fetchProducts([id]);
    if (!product) return { ok: false, message: "The API did not return this product. Check the id." };
    return { ok: true, message: "Fetched from the official API. Review the values, then save.", product };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
