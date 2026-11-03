import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/clients";
import { CACHE_TAGS } from "./settings";
import type { Offer } from "./types";

type OfferQuery = {
  merchantId?: string;
  categoryIds?: string[];
  productId?: string;
  featured?: boolean;
  limit?: number;
};

/**
 * Live (published, started, not expired) offers. RLS enforces the live
 * window; DealCard additionally hides offers that expire while a cached page
 * is being served.
 */
export async function getLiveOffers(query: OfferQuery = {}): Promise<Offer[]> {
  "use cache";
  cacheTag(CACHE_TAGS.offers);
  cacheLife("catalog");

  const db = createPublicClient();
  if (!db) return [];
  let builder = db
    .from("offers")
    .select("*, merchant:merchants(name, slug), product:products(slug)")
    .eq("status", "published");
  if (query.merchantId) builder = builder.eq("merchant_id", query.merchantId);
  if (query.categoryIds?.length) builder = builder.in("category_id", query.categoryIds);
  if (query.productId) builder = builder.eq("product_id", query.productId);
  if (query.featured) builder = builder.eq("is_featured", true);
  const { data, error } = await builder
    .order("is_featured", { ascending: false })
    .order("sort_order")
    .order("created_at", { ascending: false })
    .limit(Math.min(query.limit ?? 24, 100));
  if (error) throw new Error(`Failed to load offers: ${error.message}`);

  return (data ?? [])
    .filter((o) => o.merchant)
    .map((o) => ({
      id: o.id,
      slug: o.slug,
      title: o.title,
      description: o.description,
      merchantId: o.merchant_id,
      merchantName: o.merchant!.name,
      merchantSlug: o.merchant!.slug,
      productId: o.product_id,
      productSlug: o.product?.slug ?? null,
      listingId: o.listing_id,
      categoryId: o.category_id,
      offerUrl: o.offer_url,
      imageUrl: o.image_url,
      imageAlt: o.image_alt,
      couponCode: o.coupon_code,
      discountText: o.discount_text,
      terms: o.terms,
      sourceUrl: o.source_url,
      verifiedAt: o.verified_at,
      startsAt: o.starts_at,
      expiresAt: o.expires_at,
      isFeatured: o.is_featured,
    }));
}
