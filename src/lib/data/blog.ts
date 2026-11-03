import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/clients";
import { asArray } from "@/lib/utils";
import { CACHE_TAGS } from "./settings";
import type { BlogAuthor, BlogPostCard, BlogPostDetail, Faq, SourceRef } from "./types";

const CARD_SELECT =
  "id, slug, title, excerpt, featured_image_url, featured_image_alt, published_at, updated_at, content_updated_at, reading_time_minutes, category:blog_categories(name, slug), author:blog_authors(name, slug)";

type CardRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  published_at: string | null;
  updated_at: string;
  content_updated_at: string | null;
  reading_time_minutes: number | null;
  category: { name: string; slug: string } | null;
  author: { name: string; slug: string } | null;
};

function mapCard(r: CardRow): BlogPostCard {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    featuredImageUrl: r.featured_image_url,
    featuredImageAlt: r.featured_image_alt,
    categoryName: r.category?.name ?? null,
    categorySlug: r.category?.slug ?? null,
    authorName: r.author?.name ?? null,
    authorSlug: r.author?.slug ?? null,
    publishedAt: r.published_at,
    updatedAt: r.updated_at,
    contentUpdatedAt: r.content_updated_at,
    readingTimeMinutes: r.reading_time_minutes,
  };
}

export type PostQuery = {
  categorySlug?: string;
  authorId?: string;
  tagSlug?: string;
  productCategoryIds?: string[];
  productId?: string;
  featured?: boolean;
  excludeId?: string;
  page?: number;
  pageSize?: number;
};

export async function getPosts(query: PostQuery = {}) {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("catalog");

  const pageSize = Math.min(Math.max(query.pageSize ?? 12, 1), 50);
  const page = Math.max(1, query.page ?? 1);
  const db = createPublicClient();
  if (!db) return { items: [] as BlogPostCard[], total: 0, page, pageSize, totalPages: 0 };

  let postIds: string[] | undefined;
  if (query.tagSlug) {
    const { data: tag } = await db.from("blog_tags").select("id").eq("slug", query.tagSlug).maybeSingle();
    if (!tag) return { items: [], total: 0, page, pageSize, totalPages: 0 };
    const { data: links } = await db.from("blog_post_tags").select("post_id").eq("tag_id", tag.id);
    postIds = (links ?? []).map((l) => l.post_id);
  }
  if (query.productId) {
    const { data: links } = await db.from("blog_post_products").select("post_id").eq("product_id", query.productId);
    const ids = (links ?? []).map((l) => l.post_id);
    postIds = postIds ? postIds.filter((id) => ids.includes(id)) : ids;
  }

  let builder = db
    .from("blog_posts")
    .select(CARD_SELECT, { count: "exact" })
    .in("status", ["published", "scheduled"])
    .lte("published_at", new Date().toISOString());
  if (query.categorySlug) {
    const { data: cat } = await db.from("blog_categories").select("id").eq("slug", query.categorySlug).maybeSingle();
    if (!cat) return { items: [], total: 0, page, pageSize, totalPages: 0 };
    builder = builder.eq("category_id", cat.id);
  }
  if (query.authorId) builder = builder.eq("author_id", query.authorId);
  if (postIds) builder = builder.in("id", postIds.length ? postIds : ["00000000-0000-0000-0000-000000000000"]);
  if (query.productCategoryIds?.length) builder = builder.in("product_category_id", query.productCategoryIds);
  if (query.featured) builder = builder.eq("is_featured", true);
  if (query.excludeId) builder = builder.neq("id", query.excludeId);

  const from = (page - 1) * pageSize;
  const { data, error, count } = await builder
    .order("published_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw new Error(`Failed to load posts: ${error.message}`);
  const total = count ?? 0;
  return {
    items: ((data ?? []) as unknown as CardRow[]).map(mapCard),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  "use cache";
  cacheTag(CACHE_TAGS.blog, `post:${slug}`);
  cacheLife("content");

  const db = createPublicClient();
  if (!db) return null;
  const { data: p, error } = await db
    .from("blog_posts")
    .select(
      "*, category:blog_categories(name, slug), author:blog_authors(*), tags:blog_post_tags(tag:blog_tags(slug, name)), products:blog_post_products(product_id, sort_order)",
    )
    .eq("slug", slug)
    .in("status", ["published", "scheduled"])
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error(`Failed to load post: ${error.message}`);
  if (!p) return null;

  const author: BlogAuthor | null = p.author
    ? {
        id: p.author.id,
        slug: p.author.slug,
        name: p.author.name,
        jobTitle: p.author.job_title,
        bio: p.author.bio,
        avatarUrl: p.author.avatar_url,
        expertise: p.author.expertise,
        websiteUrl: p.author.website_url,
        socialLinks: (p.author.social_links ?? {}) as Partial<Record<string, string>>,
      }
    : null;

  return {
    ...mapCard({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      featured_image_url: p.featured_image_url,
      featured_image_alt: p.featured_image_alt,
      published_at: p.published_at,
      updated_at: p.updated_at,
      content_updated_at: p.content_updated_at,
      reading_time_minutes: p.reading_time_minutes,
      category: p.category,
      author: p.author ? { name: p.author.name, slug: p.author.slug } : null,
    }),
    content: p.content,
    answerSummary: p.answer_summary,
    seoTitle: p.seo_title,
    metaDescription: p.meta_description,
    canonicalUrl: p.canonical_url,
    primaryKeyword: p.primary_keyword,
    faqs: asArray<Faq>(p.faqs).filter((f) => f?.question && f?.answer),
    sources: asArray<SourceRef>(p.sources).filter((s) => s?.title && /^https?:\/\//.test(s?.url ?? "")),
    noindex: p.noindex,
    author,
    tags: (p.tags ?? []).map((t) => t.tag).filter((t): t is { slug: string; name: string } => Boolean(t)),
    productCategoryId: p.product_category_id,
    productIds: [...(p.products ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((x) => x.product_id),
  };
}

export async function getBlogCategories() {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("content");
  const db = createPublicClient();
  if (!db) return [] as Array<{ id: string; slug: string; name: string; description: string | null }>;
  const { data, error } = await db.from("blog_categories").select("id, slug, name, description").order("sort_order");
  if (error) throw new Error(`Failed to load blog categories: ${error.message}`);
  return data ?? [];
}

export async function getPublishedPostSlugs(): Promise<Array<{ slug: string; updatedAt: string }>> {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("catalog");
  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("blog_posts")
    .select("slug, updated_at")
    .in("status", ["published", "scheduled"])
    .lte("published_at", new Date().toISOString())
    .eq("noindex", false)
    .order("published_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(`Failed to load post slugs: ${error.message}`);
  return (data ?? []).map((r) => ({ slug: r.slug, updatedAt: r.updated_at }));
}

export async function getAuthorBySlug(slug: string): Promise<BlogAuthor | null> {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("content");
  const db = createPublicClient();
  if (!db) return null;
  const { data, error } = await db.from("blog_authors").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error) throw new Error(`Failed to load author: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    jobTitle: data.job_title,
    bio: data.bio,
    avatarUrl: data.avatar_url,
    expertise: data.expertise,
    websiteUrl: data.website_url,
    socialLinks: (data.social_links ?? {}) as Partial<Record<string, string>>,
  };
}

export async function getActiveAuthorSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("content");
  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db.from("blog_authors").select("slug").eq("is_active", true);
  if (error) throw new Error(`Failed to load authors: ${error.message}`);
  return (data ?? []).map((a) => a.slug);
}
