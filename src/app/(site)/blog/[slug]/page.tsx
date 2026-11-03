import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, Clock, Lightbulb, ListTree, ShieldCheck } from "lucide-react";
import { getPostBySlug, getPosts, getPublishedPostSlugs } from "@/lib/data/blog";
import { getProductCardsByIds } from "@/lib/data/products";
import { getSiteSettings } from "@/lib/data/settings";
import { getMerchants } from "@/lib/data/merchants";
import { buildMetadata } from "@/lib/seo/metadata";
import { articleJsonLd } from "@/lib/seo/jsonld";
import { renderMarkdown } from "@/lib/markdown";
import { publicEnv } from "@/lib/env";
import { formatDate, getInitials, hostnameOf } from "@/lib/utils";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/shared/navigation";
import { AffiliateDisclosure } from "@/components/shared/disclosure";
import { FaqList, SourcesList } from "@/components/shared/content-blocks";
import { ViewTracker } from "@/components/shared/view-tracker";
import { ProductGrid } from "@/components/product/product-grid";
import { BlogCard } from "@/components/blog/blog-card";
import { Badge, Skeleton } from "@/components/ui/misc";
import { buttonVariants } from "@/components/ui/button";

export async function generateStaticParams() {
  const slugs = await getPublishedPostSlugs();
  return slugs.length ? slugs.slice(0, 200).map((s) => ({ slug: s.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Article not found", robots: { index: false, follow: true } };
  return buildMetadata({
    title: post.seoTitle || post.title,
    description: post.metaDescription || post.excerpt,
    path: `/blog/${post.slug}`,
    canonical: post.canonicalUrl,
    image: post.featuredImageUrl,
    imageAlt: post.featuredImageAlt,
    noindex: post.noindex,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.contentUpdatedAt ?? post.updatedAt,
    authors: post.author ? [post.author.name] : undefined,
  });
}

export default function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-3xl space-y-4 py-10">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <PostContent params={params} />
    </Suspense>
  );
}

async function PostContent({ params }: { params: PageProps<"/blog/[slug]">["params"] }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [settings, merchants, products, related] = await Promise.all([
    getSiteSettings(),
    getMerchants(),
    getProductCardsByIds(post.productIds),
    getPosts({ categorySlug: post.categorySlug ?? undefined, excludeId: post.id, pageSize: 3 }),
  ]);
  const affiliateHosts = merchants.flatMap((m) => m.allowedDomains);
  const { html, toc } = renderMarkdown(post.content, {
    affiliateHosts,
    siteHost: hostnameOf(publicEnv.siteUrl) ?? undefined,
  });
  const updated =
    post.contentUpdatedAt && post.publishedAt && formatDate(post.contentUpdatedAt) !== formatDate(post.publishedAt) && post.contentUpdatedAt > post.publishedAt;
  const statements = merchants.map((m) => m.disclosureText).filter((t): t is string => Boolean(t));

  return (
    <article>
      <ViewTracker type="blog_post" id={post.id} name={post.title} />
      <JsonLd data={articleJsonLd(post, settings)} />

      <header className="border-b border-line bg-white">
        <div className="container-page max-w-6xl py-8 sm:py-12">
          <div className="max-w-4xl">
          <Breadcrumbs
            items={[
              { name: "Blog", href: "/blog" },
              ...(post.categorySlug ? [{ name: post.categoryName ?? "Category", href: `/blog/category/${post.categorySlug}` }] : []),
              { name: post.title, href: `/blog/${post.slug}` },
            ]}
          />
          {post.categoryName && (
            <Badge variant="brand" className="mb-4">
              {post.categoryName}
            </Badge>
          )}
          <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-balance text-ink-900 sm:text-4xl lg:text-5xl">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-lg leading-relaxed text-ink-500">{post.excerpt}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-500">
            {post.author && (
              <Link href={`/blog/author/${post.author.slug}`} className="flex items-center gap-2 font-semibold text-ink-800 hover:text-brand-700">
                <span className="relative grid size-8 place-items-center overflow-hidden rounded-full bg-brand-600 text-xs font-bold text-white">
                  {post.author.avatarUrl ? <Image src={post.author.avatarUrl} alt="" fill sizes="32px" className="object-cover" /> : getInitials(post.author.name)}
                </span>
                {post.author.name}
              </Link>
            )}
            {post.publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden="true" /> Published <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              </span>
            )}
            {updated && (
              <span className="inline-flex items-center gap-1.5">
                Updated <time dateTime={post.contentUpdatedAt!}>{formatDate(post.contentUpdatedAt)}</time>
              </span>
            )}
            {post.readingTimeMinutes && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden="true" /> {post.readingTimeMinutes} min read
              </span>
            )}
          </div>
          </div>
        </div>
      </header>

      <div className="container-page grid max-w-6xl gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0 space-y-10">
          {post.featuredImageUrl && (
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-line bg-white">
              <Image
                src={post.featuredImageUrl}
                alt={post.featuredImageAlt || ""}
                fill
                priority
                sizes="(min-width: 1024px) 760px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          {post.answerSummary && (
            <section aria-labelledby="quick-answer" className="rounded-2xl border border-brand-100 bg-brand-50/70 p-5 sm:p-6">
              <h2 id="quick-answer" className="mb-2 flex items-center gap-2 text-base font-bold text-brand-900">
                <Lightbulb className="size-5 text-brand-600" aria-hidden="true" /> Quick answer
              </h2>
              <p className="leading-relaxed text-ink-800">{post.answerSummary}</p>
            </section>
          )}

          {toc.length >= 3 && (
            <nav aria-labelledby="toc-heading" className="rounded-2xl border border-line bg-white p-5 lg:hidden">
              <h2 id="toc-heading" className="mb-3 flex items-center gap-2 font-bold text-ink-900">
                <ListTree className="size-4" aria-hidden="true" /> In this article
              </h2>
              <TocList toc={toc} />
            </nav>
          )}

          <div className="prose-content text-[1.05rem]" dangerouslySetInnerHTML={{ __html: html }} />

          {products.length > 0 && (
            <section aria-labelledby="mentioned-products">
              <h2 id="mentioned-products" className="mb-4 text-2xl font-extrabold tracking-tight text-ink-900">
                Products mentioned in this guide
              </h2>
              <ProductGrid products={products} className="xl:grid-cols-3" sourceComponent="blog_products" />
              <AffiliateDisclosure text={settings.affiliateDisclosureShort} merchantStatements={statements} className="mt-4" compact />
            </section>
          )}

          <FaqList faqs={post.faqs} />
          <SourcesList sources={post.sources} />

          {post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-ink-700">Tags:</span>
              {post.tags.map((t) => (
                <Badge key={t.slug} variant="outline">
                  {t.name}
                </Badge>
              ))}
            </div>
          )}

          {post.author && (
            <aside aria-label="About the author" className="flex gap-4 rounded-2xl border border-line bg-white p-5">
              <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-600 font-bold text-white">
                {post.author.avatarUrl ? <Image src={post.author.avatarUrl} alt="" fill sizes="56px" className="object-cover" /> : getInitials(post.author.name)}
              </span>
              <div>
                <p className="text-xs font-semibold tracking-wide text-ink-400 uppercase">Written by</p>
                <Link href={`/blog/author/${post.author.slug}`} className="font-bold text-ink-900 hover:text-brand-700">
                  {post.author.name}
                </Link>
                {post.author.bio && <p className="mt-1 text-sm leading-relaxed text-ink-500">{post.author.bio}</p>}
                <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
                  <ShieldCheck className="size-3.5 text-emerald-600" aria-hidden="true" /> Reviewed under our{" "}
                  <Link href="/editorial-policy" className="underline">
                    editorial policy
                  </Link>
                </p>
              </div>
            </aside>
          )}

          <div className="flex flex-col items-start gap-4 rounded-3xl bg-ink-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="text-xl font-extrabold">Ready to compare products?</p>
              <p className="mt-1 text-sm text-white/70">Browse products and see which stores list them.</p>
            </div>
            <Link href="/products" className={buttonVariants({ variant: "accent" })}>
              Explore products <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>

        {toc.length >= 3 && (
          <aside className="hidden lg:block">
            <nav aria-label="Table of contents" className="sticky top-40 rounded-2xl border border-line bg-white p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-900">
                <ListTree className="size-4" aria-hidden="true" /> In this article
              </p>
              <TocList toc={toc} />
            </nav>
          </aside>
        )}
      </div>

      {related.items.length > 0 && (
        <section className="container-page max-w-6xl pb-6" aria-labelledby="related-posts">
          <h2 id="related-posts" className="mb-5 text-2xl font-extrabold tracking-tight text-ink-900">
            Keep reading
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.items.map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function TocList({ toc }: { toc: Array<{ id: string; text: string; depth: 2 | 3 }> }) {
  return (
    <ol className="space-y-1.5 text-sm">
      {toc.map((item) => (
        <li key={item.id} className={item.depth === 3 ? "pl-4" : ""}>
          <a href={`#${item.id}`} className="block text-ink-600 hover:text-brand-700">
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  );
}
