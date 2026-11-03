import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/clients";
import { asArray } from "@/lib/utils";
import { CACHE_TAGS } from "./settings";
import type { Category, CategoryNode, Faq } from "./types";

export async function getAllCategories(): Promise<Category[]> {
  "use cache";
  cacheTag(CACHE_TAGS.categories);
  cacheLife("content");

  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return (data ?? []).map((c) => ({
    id: c.id,
    parentId: c.parent_id,
    slug: c.slug,
    name: c.name,
    shortDescription: c.short_description,
    description: c.description,
    icon: c.icon,
    imageUrl: c.image_url,
    imageAlt: c.image_alt,
    seoTitle: c.seo_title,
    metaDescription: c.meta_description,
    faqs: asArray<Faq>(c.faqs).filter((f) => f?.question && f?.answer),
    sortOrder: c.sort_order,
    showOnHome: c.show_on_home,
    homeSortOrder: c.home_sort_order,
    noindex: c.noindex,
    updatedAt: c.updated_at,
  }));
}

export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>();
  for (const c of categories) byId.set(c.id, { ...c, children: [] });
  const roots: CategoryNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const sort = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    nodes.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

/** Returns the category id plus all of its descendants' ids. */
export function getDescendantIds(categoryId: string, categories: Category[]): string[] {
  const ids = new Set<string>([categoryId]);
  let added = true;
  while (added) {
    added = false;
    for (const c of categories) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        added = true;
      }
    }
  }
  return [...ids];
}

/** Ancestors from the root down to (and including) the given category. */
export function getCategoryTrail(categoryId: string, categories: Category[]): Category[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const trail: Category[] = [];
  let current = byId.get(categoryId);
  let guard = 0;
  while (current && guard < 12) {
    trail.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
    guard++;
  }
  return trail;
}

export async function getCategoryBySlug(slug: string) {
  const all = await getAllCategories();
  const category = all.find((c) => c.slug === slug) ?? null;
  if (!category) return null;
  return {
    category,
    children: all.filter((c) => c.parentId === category.id),
    trail: getCategoryTrail(category.id, all),
    descendantIds: getDescendantIds(category.id, all),
  };
}

export async function getHomeCategories(): Promise<Category[]> {
  const all = await getAllCategories();
  return all.filter((c) => c.showOnHome).sort((a, b) => a.homeSortOrder - b.homeSortOrder);
}
