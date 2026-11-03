import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/clients";
import { asArray } from "@/lib/utils";
import { CACHE_TAGS } from "./settings";
import { getProductCardsByIds, mapListing } from "./products";
import type { ComparisonDetail, ComparisonSummary, Faq, ProductSpec } from "./types";

export async function getComparisons(options: { featured?: boolean; limit?: number; categoryIds?: string[] } = {}) {
  "use cache";
  cacheTag(CACHE_TAGS.comparisons, CACHE_TAGS.products);
  cacheLife("catalog");

  const db = createPublicClient();
  if (!db) return [] as ComparisonSummary[];
  let builder = db
    .from("comparisons")
    .select("id, slug, title, summary, updated_at, is_featured, category:categories(name), items:comparison_items(product_id, sort_order)")
    .eq("status", "published");
  if (options.featured) builder = builder.eq("is_featured", true);
  if (options.categoryIds?.length) builder = builder.in("category_id", options.categoryIds);
  const { data, error } = await builder
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(Math.min(options.limit ?? 24, 100));
  if (error) throw new Error(`Failed to load comparisons: ${error.message}`);

  const rows = data ?? [];
  const allIds = rows.flatMap((r) => (r.items ?? []).map((i) => i.product_id));
  const cards = await getProductCardsByIds(allIds);
  const cardById = new Map(cards.map((c) => [c.id, c]));

  return rows.map((r): ComparisonSummary => {
    const items = [...(r.items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const visible = items.map((i) => cardById.get(i.product_id)).filter(Boolean);
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      categoryName: r.category?.name ?? null,
      productCount: visible.length,
      imageUrls: visible
        .map((c) => c!.imageUrl)
        .filter((u): u is string => Boolean(u))
        .slice(0, 3),
      updatedAt: r.updated_at,
    };
  });
}

export async function getComparisonBySlug(slug: string): Promise<ComparisonDetail | null> {
  "use cache";
  cacheTag(CACHE_TAGS.comparisons, CACHE_TAGS.products, `comparison:${slug}`);
  cacheLife("catalog");

  const db = createPublicClient();
  if (!db) return null;
  const { data: c, error } = await db
    .from("comparisons")
    .select("*, category:categories(name, slug), items:comparison_items(product_id, sort_order, highlight, note)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(`Failed to load comparison: ${error.message}`);
  if (!c) return null;

  const items = [...(c.items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const ids = items.map((i) => i.product_id);
  const [cards, specsRes, listingsRes, productsRes] = await Promise.all([
    getProductCardsByIds(ids),
    db.from("product_specs").select("*").in("product_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]).order("sort_order"),
    db
      .from("v_listings")
      .select("*")
      .in("product_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
      .eq("is_active", true)
      .eq("merchant_is_active", true)
      .order("sort_order"),
    db.from("products").select("id, pros, cons").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
  ]);
  if (specsRes.error) throw new Error(specsRes.error.message);
  if (listingsRes.error) throw new Error(listingsRes.error.message);
  if (productsRes.error) throw new Error(productsRes.error.message);

  const cardById = new Map(cards.map((card) => [card.id, card]));
  const prosCons = new Map((productsRes.data ?? []).map((p) => [p.id, p]));

  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    summary: c.summary,
    intro: c.intro,
    verdict: c.verdict,
    specLabels: c.spec_labels,
    faqs: asArray<Faq>(c.faqs).filter((f) => f?.question && f?.answer),
    seoTitle: c.seo_title,
    metaDescription: c.meta_description,
    publishedAt: c.published_at,
    updatedAt: c.updated_at,
    category: c.category ? { name: c.category.name, slug: c.category.slug } : null,
    items: items
      .filter((i) => cardById.has(i.product_id))
      .map((i) => ({
        product: cardById.get(i.product_id)!,
        highlight: i.highlight,
        note: i.note,
        specs: (specsRes.data ?? [])
          .filter((s) => s.product_id === i.product_id)
          .map(
            (s): ProductSpec => ({
              id: s.id,
              groupName: s.group_name,
              label: s.label,
              value: s.value,
              sourceUrl: s.source_url,
            }),
          ),
        pros: prosCons.get(i.product_id)?.pros ?? [],
        cons: prosCons.get(i.product_id)?.cons ?? [],
        listings: (listingsRes.data ?? []).filter((l) => l.product_id === i.product_id).map(mapListing),
      })),
  };
}

export async function getComparisonsForProduct(productId: string) {
  "use cache";
  cacheTag(CACHE_TAGS.comparisons);
  cacheLife("catalog");

  const db = createPublicClient();
  if (!db) return [] as Array<{ slug: string; title: string }>;
  const { data, error } = await db
    .from("comparison_items")
    .select("comparison:comparisons(slug, title, status)")
    .eq("product_id", productId);
  if (error) throw new Error(`Failed to load product comparisons: ${error.message}`);
  return (data ?? [])
    .map((r) => r.comparison)
    .filter((c): c is { slug: string; title: string; status: string } => Boolean(c && c.status === "published"))
    .map(({ slug, title }) => ({ slug, title }));
}
