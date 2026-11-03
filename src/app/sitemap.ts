import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/env";
import { getPublishedProductSlugs } from "@/lib/data/products";
import { getAllCategories } from "@/lib/data/categories";
import { getMerchants } from "@/lib/data/merchants";
import { getComparisons } from "@/lib/data/comparisons";
import { getBlogCategories, getPublishedPostSlugs } from "@/lib/data/blog";

/**
 * XML sitemap of indexable pages only. Internal search results, filtered
 * listing URLs, account and admin pages are intentionally excluded.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, merchants, comparisons, posts, blogCategories] = await Promise.all([
    getPublishedProductSlugs(),
    getAllCategories(),
    getMerchants(),
    getComparisons({ limit: 100 }),
    getPublishedPostSlugs(),
    getBlogCategories(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/products"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/categories"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/deals"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/stores"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/compare"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/blog"), changeFrequency: "daily", priority: 0.8 },
    ...["/about", "/how-it-works", "/contact", "/affiliate-disclosure", "/editorial-policy", "/privacy-policy", "/terms-and-conditions"].map(
      (p) => ({ url: absoluteUrl(p), changeFrequency: "yearly" as const, priority: 0.3 }),
    ),
  ];

  return [
    ...staticPages,
    ...categories.filter((c) => !c.noindex).map((c) => ({ url: absoluteUrl(`/categories/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...merchants.map((m) => ({ url: absoluteUrl(`/stores/${m.slug}`), lastModified: m.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...products.map((p) => ({ url: absoluteUrl(`/products/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...comparisons.filter((c) => c.productCount >= 2).map((c) => ({ url: absoluteUrl(`/compare/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...blogCategories.map((c) => ({ url: absoluteUrl(`/blog/category/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.5 })),
    ...posts.map((p) => ({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
