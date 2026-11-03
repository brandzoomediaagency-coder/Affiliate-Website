"use server";

import { assertStaff } from "@/lib/auth";
import { productSchema, specsSchema } from "@/lib/validation/schemas";
import { fromZodError, getBool, getJson, getLines, getOptionalString, getString, type ActionResult } from "@/lib/validation/form";
import { assessProductQuality } from "@/lib/product-quality";
import { validateImageUpload } from "@/lib/security/uploads";
import { slugify } from "@/lib/utils";
import { actionError, audit, dbError, invalidate } from "./common";

function readProduct(fd: FormData) {
  return {
    name: getString(fd, "name"),
    slug: getString(fd, "slug"),
    brand_id: getOptionalString(fd, "brand_id"),
    category_id: getOptionalString(fd, "category_id"),
    model_number: getOptionalString(fd, "model_number"),
    short_description: getOptionalString(fd, "short_description"),
    overview: getOptionalString(fd, "overview"),
    description: getOptionalString(fd, "description"),
    key_features: getLines(fd, "key_features"),
    pros: getLines(fd, "pros"),
    cons: getLines(fd, "cons"),
    best_for: getOptionalString(fd, "best_for"),
    not_ideal_for: getOptionalString(fd, "not_ideal_for"),
    buying_considerations: getOptionalString(fd, "buying_considerations"),
    faqs: getJson(fd, "faqs", []),
    sources: getJson(fd, "sources", []),
    search_keywords: getOptionalString(fd, "search_keywords"),
    seo_title: getOptionalString(fd, "seo_title"),
    meta_description: getOptionalString(fd, "meta_description"),
    canonical_url: getOptionalString(fd, "canonical_url"),
    status: getString(fd, "status") || "draft",
    is_featured: getBool(fd, "is_featured"),
    is_trending: getBool(fd, "is_trending"),
    trending_reason: getOptionalString(fd, "trending_reason"),
    noindex: getBool(fd, "noindex"),
  };
}

export async function saveProduct(productId: string | null, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { supabase, user } = session;
    const parsed = productSchema.safeParse(readProduct(formData));
    if (!parsed.success) return fromZodError(parsed.error);
    const input = parsed.data;

    let previousSlug: string | null = null;
    if (input.status === "published") {
      if (!productId) {
        return { ok: false, message: "Save the product as a draft first, then add images and listings before publishing.", fieldErrors: { status: ["Save as draft first"] } };
      }
      const [{ count: images }, { count: listings }, { count: specs }] = await Promise.all([
        supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId),
        supabase.from("product_listings").select("id", { count: "exact", head: true }).eq("product_id", productId).eq("is_active", true),
        supabase.from("product_specs").select("id", { count: "exact", head: true }).eq("product_id", productId),
      ]);
      const quality = assessProductQuality({
        ...input,
        categoryId: input.category_id,
        imageCount: images ?? 0,
        activeListingCount: listings ?? 0,
        specCount: specs ?? 0,
      });
      if (!quality.ok) {
        return {
          ok: false,
          message: `This product isn't ready to publish yet. Missing: ${quality.issues.join("; ")}.`,
          fieldErrors: { status: ["Complete the publishing checklist first"] },
        };
      }
    }

    if (productId) {
      const { data: existing } = await supabase.from("products").select("slug").eq("id", productId).single();
      previousSlug = existing?.slug ?? null;
      const { error } = await supabase
        .from("products")
        .update({ ...input, updated_by: user.id, content_reviewed_at: new Date().toISOString() })
        .eq("id", productId);
      const failure = dbError(error, "product");
      if (failure) return failure;
      await audit(session, "product.update", "product", productId, `Updated ${input.name} (${input.status})`);
      invalidate("products", "comparisons", `product:${input.slug}`, ...(previousSlug && previousSlug !== input.slug ? [`product:${previousSlug}`] : []));
      return { ok: true, message: "Product saved." };
    }

    const { data, error } = await supabase
      .from("products")
      .insert({ ...input, created_by: user.id, updated_by: user.id })
      .select("id")
      .single();
    const failure = dbError(error, "product");
    if (failure) return failure;
    await audit(session, "product.create", "product", data!.id, `Created ${input.name}`);
    invalidate("products");
    return { ok: true, message: "Product created. Now add images and merchant listings.", redirectTo: `/admin/products/${data!.id}` };
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { data: product } = await session.supabase.from("products").select("name, slug").eq("id", productId).single();
    const { data: images } = await session.supabase.from("product_images").select("storage_path").eq("product_id", productId);
    const { error } = await session.supabase.from("products").delete().eq("id", productId);
    const failure = dbError(error, "product");
    if (failure) return failure;
    const paths = (images ?? []).map((i) => i.storage_path).filter((p): p is string => Boolean(p));
    if (paths.length) await session.supabase.storage.from("media").remove(paths);
    await audit(session, "product.delete", "product", productId, `Deleted ${product?.name ?? productId}`);
    invalidate("products", "comparisons", "offers", ...(product ? [`product:${product.slug}`] : []));
    return { ok: true, message: "Product deleted.", redirectTo: "/admin/products" };
  } catch (e) {
    return actionError(e);
  }
}

async function productSlug(supabase: Awaited<ReturnType<typeof assertStaff>>["supabase"], productId: string) {
  const { data } = await supabase.from("products").select("slug").eq("id", productId).single();
  return data?.slug ?? null;
}

export async function addProductImage(productId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { supabase } = session;
    const alt = getString(formData, "alt_text");
    if (alt.length < 3) return { ok: false, message: "Describe the image in the alt text (at least 3 characters).", fieldErrors: { alt_text: ["Required"] } };
    const source = getString(formData, "source") || "upload";
    if (!["upload", "merchant_api", "licensed", "brand_press_kit", "own_photo", "other"].includes(source)) return { ok: false, message: "Invalid image source." };
    const file = formData.get("file");
    let url = getString(formData, "url");
    let storagePath: string | null = null;

    if (file instanceof File && file.size > 0) {
      const checked = await validateImageUpload(file, { maxBytes: 5 * 1024 * 1024 });
      if (!checked.ok) return { ok: false, message: checked.error };
      storagePath = `products/${productId}/${slugify(alt).slice(0, 40) || "image"}-${crypto.randomUUID().slice(0, 8)}.${checked.value.extension}`;
      const { error } = await supabase.storage
        .from("media")
        .upload(storagePath, checked.value.bytes, { contentType: checked.value.mime, cacheControl: "31536000" });
      if (error) return { ok: false, message: `Upload failed: ${error.message}` };
      url = supabase.storage.from("media").getPublicUrl(storagePath).data.publicUrl;
    } else if (!/^https:\/\/[^\s]+$/i.test(url)) {
      return { ok: false, message: "Upload a file or enter an https:// image URL you have the rights to use." };
    }

    const { count } = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId);
    const { error } = await supabase.from("product_images").insert({
      product_id: productId,
      url,
      storage_path: storagePath,
      alt_text: alt.slice(0, 250),
      source,
      credit: getOptionalString(formData, "credit"),
      source_url: getOptionalString(formData, "source_url"),
      sort_order: (count ?? 0) * 10,
    });
    const failure = dbError(error, "image");
    if (failure) return failure;
    await audit(session, "product.image.add", "product", productId, `Added image (${source})`);
    const slug = await productSlug(supabase, productId);
    invalidate("products", ...(slug ? [`product:${slug}`] : []));
    return { ok: true, message: "Image added." };
  } catch (e) {
    return actionError(e);
  }
}

export async function updateProductImage(imageId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const alt = getString(formData, "alt_text");
    if (alt.length < 3) return { ok: false, message: "Alt text must be at least 3 characters." };
    const sort = Number(getString(formData, "sort_order") || "0");
    const { data, error } = await session.supabase
      .from("product_images")
      .update({ alt_text: alt.slice(0, 250), sort_order: Number.isFinite(sort) ? Math.trunc(sort) : 0, credit: getOptionalString(formData, "credit") })
      .eq("id", imageId)
      .select("product_id")
      .single();
    const failure = dbError(error, "image");
    if (failure) return failure;
    const slug = await productSlug(session.supabase, data!.product_id);
    invalidate("products", ...(slug ? [`product:${slug}`] : []));
    return { ok: true, message: "Image updated." };
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteProductImage(imageId: string): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { data } = await session.supabase.from("product_images").select("product_id, storage_path").eq("id", imageId).single();
    const { error } = await session.supabase.from("product_images").delete().eq("id", imageId);
    const failure = dbError(error, "image");
    if (failure) return failure;
    if (data?.storage_path) await session.supabase.storage.from("media").remove([data.storage_path]);
    if (data) {
      const slug = await productSlug(session.supabase, data.product_id);
      invalidate("products", ...(slug ? [`product:${slug}`] : []));
    }
    return { ok: true, message: "Image removed." };
  } catch (e) {
    return actionError(e);
  }
}

export async function saveProductSpecs(productId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const parsed = specsSchema.safeParse(getJson(formData, "specs", []));
    if (!parsed.success) return fromZodError(parsed.error);
    const seen = new Set<string>();
    for (const s of parsed.data) {
      const key = `${s.group_name}::${s.label}`.toLowerCase();
      if (seen.has(key)) return { ok: false, message: `Duplicate specification "${s.label}" in group "${s.group_name}".` };
      seen.add(key);
    }
    const { supabase } = session;
    const { error: delError } = await supabase.from("product_specs").delete().eq("product_id", productId);
    if (delError) return dbError(delError, "specification")!;
    if (parsed.data.length) {
      const { error } = await supabase
        .from("product_specs")
        .insert(parsed.data.map((s, i) => ({ ...s, product_id: productId, sort_order: i * 10 })));
      const failure = dbError(error, "specification");
      if (failure) return failure;
    }
    await audit(session, "product.specs", "product", productId, `Saved ${parsed.data.length} specifications`);
    const slug = await productSlug(supabase, productId);
    invalidate("products", "comparisons", ...(slug ? [`product:${slug}`] : []));
    return { ok: true, message: "Specifications saved." };
  } catch (e) {
    return actionError(e);
  }
}

export async function saveProductRelations(productId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const ids = formData
      .getAll("alternatives")
      .map(String)
      .filter((id) => /^[0-9a-f-]{36}$/i.test(id) && id !== productId)
      .slice(0, 12);
    const { supabase } = session;
    await supabase.from("product_relations").delete().eq("product_id", productId).eq("relation_type", "alternative");
    if (ids.length) {
      const { error } = await supabase
        .from("product_relations")
        .insert(ids.map((id, i) => ({ product_id: productId, related_product_id: id, relation_type: "alternative", sort_order: i })));
      const failure = dbError(error, "relation");
      if (failure) return failure;
    }
    const slug = await productSlug(supabase, productId);
    invalidate("products", ...(slug ? [`product:${slug}`] : []));
    return { ok: true, message: "Alternatives saved." };
  } catch (e) {
    return actionError(e);
  }
}
