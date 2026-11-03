import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/clients";
import { asArray } from "@/lib/utils";
import { CACHE_TAGS } from "./settings";
import type { LinkRef, Merchant } from "./types";

export async function getMerchants(): Promise<Merchant[]> {
  "use cache";
  cacheTag(CACHE_TAGS.merchants);
  cacheLife("content");

  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("merchants")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (error) throw new Error(`Failed to load merchants: ${error.message}`);
  return (data ?? []).map((m) => ({
    id: m.id,
    slug: m.slug,
    name: m.name,
    shortDescription: m.short_description,
    description: m.description,
    websiteUrl: m.website_url,
    visitUrl: m.visit_url || m.website_url,
    allowedDomains: m.allowed_domains,
    logoUrl: m.logo_url,
    logoUsagePermitted: m.logo_usage_permitted,
    brandColor: m.brand_color,
    disclosureText: m.disclosure_text,
    highlights: asArray<string>(m.highlights).filter((h) => typeof h === "string"),
    policyLinks: asArray<LinkRef>(m.policy_links).filter((l) => l?.label && /^https:\/\//.test(l?.url ?? "")),
    seoTitle: m.seo_title,
    metaDescription: m.meta_description,
    isFeatured: m.is_featured,
    updatedAt: m.updated_at,
  }));
}

export async function getMerchantBySlug(slug: string): Promise<Merchant | null> {
  const merchants = await getMerchants();
  return merchants.find((m) => m.slug === slug) ?? null;
}
