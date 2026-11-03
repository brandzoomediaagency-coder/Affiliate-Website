"use server";

import { assertAdmin } from "@/lib/auth";
import { merchantSchema, programSchema } from "@/lib/validation/schemas";
import { fromZodError, getBool, getJson, getLines, getOptionalString, getString, type ActionResult } from "@/lib/validation/form";
import { getAdapter } from "@/lib/affiliate/registry";
import { syncListingsFromApis } from "@/lib/affiliate/sync";
import { actionError, audit, dbError, invalidate } from "./common";

export async function saveMerchant(merchantId: string | null, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const maxAge = getString(formData, "price_max_age_hours");
    const parsed = merchantSchema.safeParse({
      name: getString(formData, "name"),
      slug: getString(formData, "slug"),
      short_description: getOptionalString(formData, "short_description"),
      description: getOptionalString(formData, "description"),
      website_url: getString(formData, "website_url"),
      visit_url: getOptionalString(formData, "visit_url"),
      allowed_domains: getString(formData, "allowed_domains")
        .split(/[\s,]+/)
        .map((d) => d.trim())
        .filter(Boolean),
      logo_url: getOptionalString(formData, "logo_url"),
      logo_usage_permitted: getBool(formData, "logo_usage_permitted"),
      brand_color: getOptionalString(formData, "brand_color"),
      disclosure_text: getOptionalString(formData, "disclosure_text"),
      allow_manual_prices: getBool(formData, "allow_manual_prices"),
      price_max_age_hours: maxAge ? Number(maxAge) : null,
      highlights: getLines(formData, "highlights"),
      policy_links: getJson(formData, "policy_links", []),
      seo_title: getOptionalString(formData, "seo_title"),
      meta_description: getOptionalString(formData, "meta_description"),
      is_active: getBool(formData, "is_active"),
      is_featured: getBool(formData, "is_featured"),
      sort_order: Number(getString(formData, "sort_order") || "0"),
    });
    if (!parsed.success) return fromZodError(parsed.error);
    const input = parsed.data;
    const warnings: string[] = [];
    if (input.allowed_domains.length === 0) warnings.push("Add allowed domains so affiliate links can be validated.");

    if (merchantId) {
      const { error } = await session.supabase.from("merchants").update(input).eq("id", merchantId);
      const failure = dbError(error, "merchant");
      if (failure) return failure;
      await audit(session, "merchant.update", "merchant", merchantId, `Updated ${input.name}`);
      invalidate("merchants", "products", "offers");
      return { ok: true, message: "Merchant saved.", warnings };
    }
    const { data, error } = await session.supabase.from("merchants").insert(input).select("id").single();
    const failure = dbError(error, "merchant");
    if (failure) return failure;
    await session.supabase.from("affiliate_programs").insert({
      merchant_id: data!.id,
      name: `${input.name} affiliate programme`,
      adapter_key: "generic",
      is_default: true,
    });
    await audit(session, "merchant.create", "merchant", data!.id, `Created ${input.name}`);
    invalidate("merchants");
    return { ok: true, message: "Merchant created.", redirectTo: `/admin/merchants/${data!.id}` };
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteMerchant(merchantId: string): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const { count } = await session.supabase.from("product_listings").select("id", { count: "exact", head: true }).eq("merchant_id", merchantId);
    if ((count ?? 0) > 0) {
      return { ok: false, message: `This merchant still has ${count} listing(s). Deactivate it instead, or delete its listings first.` };
    }
    const { error } = await session.supabase.from("merchants").delete().eq("id", merchantId);
    const failure = dbError(error, "merchant");
    if (failure) return failure;
    await audit(session, "merchant.delete", "merchant", merchantId);
    invalidate("merchants", "offers");
    return { ok: true, message: "Merchant deleted.", redirectTo: "/admin/merchants" };
  } catch (e) {
    return actionError(e);
  }
}

export async function saveProgram(programId: string | null, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const parsed = programSchema.safeParse({
      merchant_id: getString(formData, "merchant_id"),
      name: getString(formData, "name"),
      network: getOptionalString(formData, "network"),
      status: getString(formData, "status"),
      integration_type: getString(formData, "integration_type"),
      adapter_key: getString(formData, "adapter_key"),
      api_status: getString(formData, "api_status") || "not_configured",
      tracking_id_ref: getOptionalString(formData, "tracking_id_ref"),
      documentation_url: getOptionalString(formData, "documentation_url"),
      terms_url: getOptionalString(formData, "terms_url"),
      notes: getOptionalString(formData, "notes"),
      is_default: getBool(formData, "is_default"),
    });
    if (!parsed.success) return fromZodError(parsed.error);
    const input = parsed.data;
    const adapter = getAdapter(input.adapter_key);
    // API status is derived from real configuration — never claim "active" without credentials.
    if (input.api_status === "active" && !adapter.isConfigured()) {
      return { ok: false, message: `Cannot mark the API as active: credentials are not configured (${adapter.requiredEnv.join(", ") || "no API"}).` };
    }
    if (input.is_default) {
      await session.supabase.from("affiliate_programs").update({ is_default: false }).eq("merchant_id", input.merchant_id).neq("id", programId ?? "00000000-0000-0000-0000-000000000000");
    }
    const { error } = programId
      ? await session.supabase.from("affiliate_programs").update(input).eq("id", programId)
      : await session.supabase.from("affiliate_programs").insert(input);
    const failure = dbError(error, "programme");
    if (failure) return failure;
    await audit(session, programId ? "program.update" : "program.create", "affiliate_program", programId, input.name);
    return { ok: true, message: "Programme saved." };
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteProgram(programId: string): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const { error } = await session.supabase.from("affiliate_programs").delete().eq("id", programId);
    const failure = dbError(error, "programme");
    if (failure) return failure;
    await audit(session, "program.delete", "affiliate_program", programId);
    return { ok: true, message: "Programme deleted." };
  } catch (e) {
    return actionError(e);
  }
}

export async function testProgramConnection(programId: string): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const { data: program } = await session.supabase.from("affiliate_programs").select("adapter_key").eq("id", programId).single();
    const adapter = getAdapter(program?.adapter_key);
    if (!adapter.testConnection) return { ok: false, message: `${adapter.label} has no API integration. Manual links are fully supported.` };
    const result = await adapter.testConnection();
    await session.supabase
      .from("affiliate_programs")
      .update({ api_status: result.ok ? "credentials_added" : adapter.isConfigured() ? "error" : "not_configured", last_sync_message: result.message.slice(0, 500) })
      .eq("id", programId);
    return { ok: result.ok, message: result.sample ? `${result.message}\n\nSample: ${result.sample.slice(0, 600)}` : result.message };
  } catch (e) {
    return actionError(e);
  }
}

export async function syncMerchantNow(merchantId: string): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const reports = await syncListingsFromApis(session.supabase, merchantId);
    invalidate("products", "comparisons");
    const r = reports[0];
    if (!r) return { ok: false, message: "No default programme found for this merchant." };
    return { ok: r.status === "success" || r.status === "partial", message: `${r.status.toUpperCase()}: ${r.message}` };
  } catch (e) {
    return actionError(e);
  }
}
