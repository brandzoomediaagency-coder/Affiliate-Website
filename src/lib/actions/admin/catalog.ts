"use server";

import { assertStaff } from "@/lib/auth";
import { bannerSchema, brandSchema, categorySchema, comparisonSchema, offerSchema } from "@/lib/validation/schemas";
import { fromZodError, getBool, getDateTime, getJson, getLines, getOptionalString, getString, type ActionResult } from "@/lib/validation/form";
import { hostAllowed, parseHttpsUrl } from "@/lib/affiliate/url-checks";
import { actionError, audit, dbError, invalidate } from "./common";

/* ----------------------------- Categories ----------------------------- */

export async function saveCategory(categoryId: string | null, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const parsed = categorySchema.safeParse({
      name: getString(formData, "name"),
      slug: getString(formData, "slug"),
      parent_id: getOptionalString(formData, "parent_id"),
      short_description: getOptionalString(formData, "short_description"),
      description: getOptionalString(formData, "description"),
      icon: getOptionalString(formData, "icon"),
      image_url: getOptionalString(formData, "image_url"),
      image_alt: getOptionalString(formData, "image_alt"),
      seo_title: getOptionalString(formData, "seo_title"),
      meta_description: getOptionalString(formData, "meta_description"),
      faqs: getJson(formData, "faqs", []),
      sort_order: Number(getString(formData, "sort_order") || "0"),
      show_on_home: getBool(formData, "show_on_home"),
      home_sort_order: Number(getString(formData, "home_sort_order") || "0"),
      is_active: getBool(formData, "is_active"),
      noindex: getBool(formData, "noindex"),
    });
    if (!parsed.success) return fromZodError(parsed.error);
    if (categoryId && parsed.data.parent_id === categoryId) return { ok: false, message: "A category cannot be its own parent." };
    const { error, data } = categoryId
      ? await session.supabase.from("categories").update(parsed.data).eq("id", categoryId).select("id").single()
      : await session.supabase.from("categories").insert(parsed.data).select("id").single();
    const failure = dbError(error, "category");
    if (failure) return failure.message?.includes("cycle") ? { ok: false, message: "That parent would create a loop in the category tree." } : failure;
    await audit(session, categoryId ? "category.update" : "category.create", "category", data!.id, parsed.data.name);
    invalidate("categories", "products");
    return { ok: true, message: "Category saved.", redirectTo: categoryId ? undefined : `/admin/categories/${data!.id}` };
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { count } = await session.supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", categoryId);
    if ((count ?? 0) > 0) return { ok: false, message: `Move or delete the ${count} product(s) in this category first, or deactivate it instead.` };
    const { error } = await session.supabase.from("categories").delete().eq("id", categoryId);
    const failure = dbError(error, "category");
    if (failure) return failure;
    await audit(session, "category.delete", "category", categoryId);
    invalidate("categories");
    return { ok: true, message: "Category deleted.", redirectTo: "/admin/categories" };
  } catch (e) {
    return actionError(e);
  }
}

/** Saves homepage order/visibility for many categories at once. */
export async function saveHomeCategoryOrder(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const ids = formData.getAll("category_id").map(String);
    for (const id of ids) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) continue;
      const order = Number(getString(formData, `order_${id}`) || "0");
      await session.supabase
        .from("categories")
        .update({ home_sort_order: Number.isFinite(order) ? Math.trunc(order) : 0, show_on_home: getBool(formData, `home_${id}`) })
        .eq("id", id);
    }
    await audit(session, "category.reorder", "category", null, `Updated homepage order for ${ids.length} categories`);
    invalidate("categories");
    return { ok: true, message: "Homepage categories updated." };
  } catch (e) {
    return actionError(e);
  }
}

/* ------------------------------- Brands ------------------------------- */

export async function saveBrand(brandId: string | null, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const parsed = brandSchema.safeParse({
      name: getString(formData, "name"),
      slug: getString(formData, "slug"),
      description: getOptionalString(formData, "description"),
      website_url: getOptionalString(formData, "website_url"),
    });
    if (!parsed.success) return fromZodError(parsed.error);
    const { error } = brandId
      ? await session.supabase.from("brands").update(parsed.data).eq("id", brandId)
      : await session.supabase.from("brands").insert(parsed.data);
    const failure = dbError(error, "brand");
    if (failure) return failure;
    await audit(session, brandId ? "brand.update" : "brand.create", "brand", brandId, parsed.data.name);
    invalidate("products");
    return { ok: true, message: "Brand saved." };
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteBrand(brandId: string): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { error } = await session.supabase.from("brands").delete().eq("id", brandId);
    const failure = dbError(error, "brand");
    if (failure) return failure;
    invalidate("products");
    return { ok: true, message: "Brand deleted." };
  } catch (e) {
    return actionError(e);
  }
}

/* ------------------------------- Offers ------------------------------- */

export async function saveOffer(offerId: string | null, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const parsed = offerSchema.safeParse({
      title: getString(formData, "title"),
      slug: getString(formData, "slug"),
      description: getOptionalString(formData, "description"),
      merchant_id: getString(formData, "merchant_id"),
      product_id: getOptionalString(formData, "product_id"),
      category_id: getOptionalString(formData, "category_id"),
      offer_url: getString(formData, "offer_url"),
      image_url: getOptionalString(formData, "image_url"),
      image_alt: getOptionalString(formData, "image_alt"),
      coupon_code: getOptionalString(formData, "coupon_code"),
      discount_text: getOptionalString(formData, "discount_text"),
      terms: getOptionalString(formData, "terms"),
      source_url: getOptionalString(formData, "source_url"),
      verified_at: getBool(formData, "verified_now") ? new Date().toISOString() : getDateTime(formData, "verified_at"),
      starts_at: getDateTime(formData, "starts_at"),
      expires_at: getDateTime(formData, "expires_at"),
      status: getString(formData, "status") || "draft",
      is_featured: getBool(formData, "is_featured"),
      sort_order: Number(getString(formData, "sort_order") || "0"),
    });
    if (!parsed.success) return fromZodError(parsed.error);
    const input = parsed.data;

    const { data: merchant } = await session.supabase.from("merchants").select("allowed_domains").eq("id", input.merchant_id).single();
    const url = parseHttpsUrl(input.offer_url);
    if (!url) return { ok: false, message: "Offer URL must be a valid https:// link.", fieldErrors: { offer_url: ["Invalid URL"] } };
    if (merchant && merchant.allowed_domains.length && !hostAllowed(url.hostname, merchant.allowed_domains)) {
      return {
        ok: false,
        message: `Offer URL host "${url.hostname}" is not an allowed domain for this merchant.`,
        fieldErrors: { offer_url: ["Domain not allowed for this merchant"] },
      };
    }
    const warnings: string[] = [];
    if (input.status === "published" && input.expires_at && new Date(input.expires_at) < new Date()) {
      warnings.push("This offer has already expired, so it won't be shown publicly.");
    }

    const { data, error } = offerId
      ? await session.supabase.from("offers").update({ ...input, updated_by: session.user.id }).eq("id", offerId).select("id").single()
      : await session.supabase
          .from("offers")
          .insert({ ...input, created_by: session.user.id, updated_by: session.user.id })
          .select("id")
          .single();
    const failure = dbError(error, "offer");
    if (failure) return failure;
    await audit(session, offerId ? "offer.update" : "offer.create", "offer", data!.id, input.title);
    invalidate("offers");
    return { ok: true, message: "Offer saved.", warnings, redirectTo: offerId ? undefined : `/admin/deals/${data!.id}` };
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteOffer(offerId: string): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { error } = await session.supabase.from("offers").delete().eq("id", offerId);
    const failure = dbError(error, "offer");
    if (failure) return failure;
    await audit(session, "offer.delete", "offer", offerId);
    invalidate("offers");
    return { ok: true, message: "Offer deleted.", redirectTo: "/admin/deals" };
  } catch (e) {
    return actionError(e);
  }
}

/* ----------------------------- Comparisons ---------------------------- */

export async function saveComparison(comparisonId: string | null, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const productIds = formData.getAll("item_product_id").map(String);
    const parsed = comparisonSchema.safeParse({
      title: getString(formData, "title"),
      slug: getString(formData, "slug"),
      summary: getOptionalString(formData, "summary"),
      intro: getOptionalString(formData, "intro"),
      verdict: getOptionalString(formData, "verdict"),
      category_id: getOptionalString(formData, "category_id"),
      spec_labels: getLines(formData, "spec_labels"),
      faqs: getJson(formData, "faqs", []),
      seo_title: getOptionalString(formData, "seo_title"),
      meta_description: getOptionalString(formData, "meta_description"),
      status: getString(formData, "status") || "draft",
      is_featured: getBool(formData, "is_featured"),
      items: productIds
        .filter((id) => id)
        .map((id) => ({
          product_id: id,
          highlight: getOptionalString(formData, `highlight_${id}`),
          note: getOptionalString(formData, `note_${id}`),
        })),
    });
    if (!parsed.success) return fromZodError(parsed.error);
    const { items, ...input } = parsed.data;
    if (new Set(items.map((i) => i.product_id)).size !== items.length) return { ok: false, message: "Each product can only appear once." };
    if (input.status === "published" && items.length < 2) {
      return { ok: false, message: "Add at least two products before publishing a comparison." };
    }
    const record = { ...input, published_at: input.status === "published" ? new Date().toISOString() : null };
    if (comparisonId && input.status === "published") {
      const { data: existing } = await session.supabase.from("comparisons").select("published_at").eq("id", comparisonId).single();
      if (existing?.published_at) record.published_at = existing.published_at;
    }
    const { data, error } = comparisonId
      ? await session.supabase.from("comparisons").update(record).eq("id", comparisonId).select("id").single()
      : await session.supabase.from("comparisons").insert(record).select("id").single();
    const failure = dbError(error, "comparison");
    if (failure) return failure;
    const id = data!.id;
    await session.supabase.from("comparison_items").delete().eq("comparison_id", id);
    if (items.length) {
      const { error: itemError } = await session.supabase
        .from("comparison_items")
        .insert(items.map((it, i) => ({ ...it, comparison_id: id, sort_order: i })));
      const itemFailure = dbError(itemError, "comparison item");
      if (itemFailure) return itemFailure;
    }
    await audit(session, comparisonId ? "comparison.update" : "comparison.create", "comparison", id, input.title);
    invalidate("comparisons", `comparison:${input.slug}`);
    return { ok: true, message: "Comparison saved.", redirectTo: comparisonId ? undefined : `/admin/comparisons/${id}` };
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteComparison(comparisonId: string): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { error } = await session.supabase.from("comparisons").delete().eq("id", comparisonId);
    const failure = dbError(error, "comparison");
    if (failure) return failure;
    await audit(session, "comparison.delete", "comparison", comparisonId);
    invalidate("comparisons");
    return { ok: true, message: "Comparison deleted.", redirectTo: "/admin/comparisons" };
  } catch (e) {
    return actionError(e);
  }
}

/* ------------------------------- Banners ------------------------------ */

export async function saveBanner(bannerId: string | null, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const parsed = bannerSchema.safeParse({
      placement: getString(formData, "placement"),
      eyebrow: getOptionalString(formData, "eyebrow"),
      title: getString(formData, "title"),
      subtitle: getOptionalString(formData, "subtitle"),
      cta_label: getOptionalString(formData, "cta_label"),
      cta_url: getOptionalString(formData, "cta_url"),
      secondary_cta_label: getOptionalString(formData, "secondary_cta_label"),
      secondary_cta_url: getOptionalString(formData, "secondary_cta_url"),
      image_url: getOptionalString(formData, "image_url"),
      image_alt: getOptionalString(formData, "image_alt"),
      theme: getString(formData, "theme") || "violet",
      starts_at: getDateTime(formData, "starts_at"),
      ends_at: getDateTime(formData, "ends_at"),
      is_active: getBool(formData, "is_active"),
      sort_order: Number(getString(formData, "sort_order") || "0"),
    });
    if (!parsed.success) return fromZodError(parsed.error);
    const { data, error } = bannerId
      ? await session.supabase.from("banners").update(parsed.data).eq("id", bannerId).select("id").single()
      : await session.supabase.from("banners").insert(parsed.data).select("id").single();
    const failure = dbError(error, "banner");
    if (failure) return failure;
    await audit(session, bannerId ? "banner.update" : "banner.create", "banner", data!.id, parsed.data.title);
    invalidate("banners");
    return { ok: true, message: "Banner saved.", redirectTo: bannerId ? undefined : "/admin/banners" };
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteBanner(bannerId: string): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { error } = await session.supabase.from("banners").delete().eq("id", bannerId);
    const failure = dbError(error, "banner");
    if (failure) return failure;
    invalidate("banners");
    return { ok: true, message: "Banner deleted.", redirectTo: "/admin/banners" };
  } catch (e) {
    return actionError(e);
  }
}
