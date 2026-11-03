import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/clients";
import type { Database } from "@/lib/supabase/database.types";
import { siteConfig } from "@/config/site";
import { asArray } from "@/lib/utils";
import { discountPercent, displayPrice, toNumber } from "@/lib/pricing";
import { CACHE_TAGS } from "./settings";
import { getAllCategories, getDescendantIds } from "./categories";
import type { Faq, Listing, ProductCard, ProductDetail, ProductSpec, SourceRef } from "./types";

type CardRow = Database["public"]["Views"]["v_product_cards"]["Row"];
type ListingRow = Database["public"]["Views"]["v_listings"]["Row"];

export const PRODUCT_CARD_COLUMNS =
  "id, slug, name, short_description, is_featured, is_trending, trending_reason, published_at, updated_at, category_name, category_slug, brand_name, image_url, image_alt, image_source, best_listing_id, best_merchant_id, best_merchant_name, best_merchant_slug, best_affiliate_url, best_price, best_previous_price, best_price_checked_at, best_availability, listing_count, merchant_slugs, popularity_score, category_id, brand_id, status";

export function mapProductCard(row: Partial<CardRow>): ProductCard {
  const price = toNumber(row.best_price);
  const previous = toNumber(row.best_previous_price);
  return {
    id: row.id!,
    slug: row.slug!,
    name: row.name!,
    shortDescription: row.short_description ?? null,
    isFeatured: Boolean(row.is_featured),
    isTrending: Boolean(row.is_trending && row.trending_reason),
    trendingReason: row.trending_reason ?? null,
    publishedAt: row.published_at ?? null,
    updatedAt: row.updated_at ?? "",
    categoryName: row.category_name ?? null,
    categorySlug: row.category_slug ?? null,
    brandName: row.brand_name ?? null,
    imageUrl: row.image_url ?? null,
    imageAlt: row.image_alt ?? null,
    imageSource: row.image_source ?? null,
    bestListingId: row.best_listing_id ?? null,
    bestMerchantId: row.best_merchant_id ?? null,
    bestMerchantName: row.best_merchant_name ?? null,
    bestMerchantSlug: row.best_merchant_slug ?? null,
    bestAffiliateUrl: row.best_affiliate_url ?? null,
    price,
    previousPrice: previous !== null && price !== null && previous > price ? previous : null,
    discount: discountPercent(price, previous),
    priceCheckedAt: row.best_price_checked_at ?? null,
    availability: row.best_availability ?? null,
    listingCount: row.listing_count ?? 0,
    merchantSlugs: (row.merchant_slugs ?? []).filter((s): s is string => typeof s === "string"),
  };
}

export function mapListing(row: ListingRow): Listing {
  const priced = displayPrice({
    current_price: row.current_price,
    previous_price: row.previous_price,
    price_displayable: row.price_displayable,
    price_checked_at: row.price_checked_at,
  });
  return {
    id: row.id!,
    productId: row.product_id!,
    merchantId: row.merchant_id!,
    merchantSlug: row.merchant_slug!,
    merchantName: row.merchant_name!,
    merchantLogoUrl: row.merchant_logo_usage_permitted ? row.merchant_logo_url : null,
    merchantLogoUsagePermitted: Boolean(row.merchant_logo_usage_permitted),
    merchantBrandColor: row.merchant_brand_color,
    merchantDisclosureText: row.merchant_disclosure_text,
    variantLabel: row.variant_label ?? "",
    affiliateUrl: row.affiliate_url!,
    price: priced.price,
    previousPrice: priced.previousPrice,
    previousPriceType: row.previous_price_type ?? "mrp",
    discount: priced.discount,
    priceCheckedAt: priced.checkedAt,
    priceSource: row.price_source ?? "manual",
    availability: row.availability ?? "unknown",
    couponCode: row.coupon_code,
    offerDetails: row.offer_details,
    offerExpiresAt: row.offer_expires_at,
  };
}

export type ProductSort = "relevance" | "newest" | "price_asc" | "price_desc" | "popular";

export type ProductQuery = {
  q?: string;
  categorySlug?: string;
  merchantSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
  featured?: boolean;
  trending?: boolean;
  ids?: string[];
  excludeIds?: string[];
  categoryIds?: string[];
};

export type ProductQueryResult = {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/** Lists published products with filters, sorting and pagination. */
export async function queryProducts(query: ProductQuery = {}): Promise<ProductQueryResult> {
  "use cache";
  cacheTag(CACHE_TAGS.products);
  cacheLife("catalog");

  const pageSize = Math.min(Math.max(query.pageSize ?? siteConfig.productsPerPage, 1), 60);
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const empty: ProductQueryResult = { items: [], total: 0, page, pageSize, totalPages: 0 };
  const db = createPublicClient();
  if (!db) return empty;

  let categoryIds = query.categoryIds;
  if (query.categorySlug) {
    const all = await getAllCategories();
    const category = all.find((c) => c.slug === query.categorySlug);
    if (!category) return empty;
    categoryIds = getDescendantIds(category.id, all);
  }

  const run = async (mode: "fts" | "ilike" | "none") => {
    let builder = db
      .from("v_product_cards")
      .select(PRODUCT_CARD_COLUMNS, { count: "exact" })
      .eq("status", "published");

    const q = query.q?.trim();
    if (q && mode === "fts") builder = builder.textSearch("search_vector", q, { type: "websearch", config: "english" });
    if (q && mode === "ilike") builder = builder.ilike("name", `%${escapeLike(q)}%`);
    if (categoryIds?.length) builder = builder.in("category_id", categoryIds);
    if (query.merchantSlug) builder = builder.contains("merchant_slugs", [query.merchantSlug]);
    if (typeof query.minPrice === "number") builder = builder.gte("best_price", query.minPrice);
    if (typeof query.maxPrice === "number") builder = builder.lte("best_price", query.maxPrice);
    if (query.featured) builder = builder.eq("is_featured", true);
    if (query.trending) builder = builder.eq("is_trending", true);
    if (query.ids) builder = builder.in("id", query.ids.length ? query.ids : ["00000000-0000-0000-0000-000000000000"]);
    if (query.excludeIds?.length) builder = builder.not("id", "in", `(${query.excludeIds.join(",")})`);

    const sort = query.sort ?? (q ? "relevance" : "newest");
    switch (sort) {
      case "price_asc":
        builder = builder.order("best_price", { ascending: true, nullsFirst: false });
        break;
      case "price_desc":
        builder = builder.order("best_price", { ascending: false, nullsFirst: false });
        break;
      case "popular":
      case "relevance":
        builder = builder.order("popularity_score", { ascending: false });
        break;
      default:
        break;
    }
    builder = builder.order("published_at", { ascending: false, nullsFirst: false }).order("id");

    const from = (page - 1) * pageSize;
    return builder.range(from, from + pageSize - 1);
  };

  const q = query.q?.trim();
  let result = await run(q ? "fts" : "none");
  // Fall back to a partial-name match when full-text search finds nothing
  // (e.g. partial words such as "earb").
  if (q && !result.error && (result.count ?? 0) === 0 && q.length >= 2) {
    result = await run("ilike");
  }
  if (result.error) throw new Error(`Failed to query products: ${result.error.message}`);

  const total = result.count ?? 0;
  return {
    items: (result.data ?? []).map((row) => mapProductCard(row as Partial<CardRow>)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getProductCardsByIds(ids: string[]): Promise<ProductCard[]> {
  if (ids.length === 0) return [];
  const unique = [...new Set(ids)].slice(0, 60);
  const { items } = await queryProducts({ ids: unique, pageSize: 60, sort: "newest" });
  const order = new Map(unique.map((id, i) => [id, i]));
  return items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheTag(CACHE_TAGS.products, `product:${slug}`);
  cacheLife("catalog");

  const db = createPublicClient();
  if (!db) return null;
  const { data: p, error } = await db
    .from("products")
    .select(
      "*, brand:brands(id, name, slug, website_url), category:categories(id, name, slug, parent_id), images:product_images(*), specs:product_specs(*)",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(`Failed to load product: ${error.message}`);
  if (!p) return null;

  const { data: listingRows, error: listingError } = await db
    .from("v_listings")
    .select("*")
    .eq("product_id", p.id)
    .eq("is_active", true)
    .eq("merchant_is_active", true)
    .order("sort_order")
    .order("created_at");
  if (listingError) throw new Error(`Failed to load listings: ${listingError.message}`);

  const images = [...(p.images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const specs = [...(p.specs ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    modelNumber: p.model_number,
    shortDescription: p.short_description,
    overview: p.overview,
    description: p.description,
    keyFeatures: p.key_features,
    pros: p.pros,
    cons: p.cons,
    bestFor: p.best_for,
    notIdealFor: p.not_ideal_for,
    buyingConsiderations: p.buying_considerations,
    faqs: asArray<Faq>(p.faqs).filter((f) => f?.question && f?.answer),
    sources: asArray<SourceRef>(p.sources).filter((s) => s?.title && /^https?:\/\//.test(s?.url ?? "")),
    seoTitle: p.seo_title,
    metaDescription: p.meta_description,
    canonicalUrl: p.canonical_url,
    isTrending: p.is_trending && Boolean(p.trending_reason),
    trendingReason: p.trending_reason,
    noindex: p.noindex,
    publishedAt: p.published_at,
    updatedAt: p.updated_at,
    brand: p.brand
      ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug, websiteUrl: p.brand.website_url }
      : null,
    category: p.category
      ? { id: p.category.id, name: p.category.name, slug: p.category.slug, parentId: p.category.parent_id }
      : null,
    images: images.map((i) => ({
      id: i.id,
      url: i.url,
      altText: i.alt_text,
      source: i.source,
      credit: i.credit,
      sourceUrl: i.source_url,
      width: i.width,
      height: i.height,
    })),
    specs: specs.map(
      (s): ProductSpec => ({ id: s.id, groupName: s.group_name, label: s.label, value: s.value, sourceUrl: s.source_url }),
    ),
    listings: (listingRows ?? []).map(mapListing),
  };
}

/** Editorially chosen alternatives for a product. */
export async function getAlternativeProducts(productId: string): Promise<ProductCard[]> {
  "use cache";
  cacheTag(CACHE_TAGS.products);
  cacheLife("catalog");

  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("product_relations")
    .select("related_product_id, sort_order")
    .eq("product_id", productId)
    .eq("relation_type", "alternative")
    .order("sort_order");
  if (error) throw new Error(`Failed to load alternatives: ${error.message}`);
  const ids = (data ?? []).map((r) => r.related_product_id);
  return getProductCardsByIds(ids);
}

export async function getRelatedProducts(productId: string, categoryId: string | null, limit = 8) {
  if (!categoryId) return [];
  const { items } = await queryProducts({
    categoryIds: [categoryId],
    excludeIds: [productId],
    pageSize: limit,
    sort: "popular",
  });
  return items;
}

export async function getPublishedProductSlugs(limit = 5000): Promise<Array<{ slug: string; updatedAt: string }>> {
  "use cache";
  cacheTag(CACHE_TAGS.products);
  cacheLife("catalog");

  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("products")
    .select("slug, updated_at")
    .eq("status", "published")
    .eq("noindex", false)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load product slugs: ${error.message}`);
  return (data ?? []).map((r) => ({ slug: r.slug, updatedAt: r.updated_at }));
}

/** Distinct merchants that have at least one active listing (for filters). */
export async function getMerchantFacets(): Promise<Array<{ slug: string; name: string }>> {
  "use cache";
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.merchants);
  cacheLife("catalog");

  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db.from("merchants").select("slug, name, sort_order").eq("is_active", true).order("sort_order");
  if (error) throw new Error(`Failed to load merchants: ${error.message}`);
  return (data ?? []).map((m) => ({ slug: m.slug, name: m.name }));
}
