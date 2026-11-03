import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCategories, getCategoryBySlug } from "@/lib/data/categories";
import { getPosts } from "@/lib/data/blog";
import { getComparisons } from "@/lib/data/comparisons";
import { getLiveOffers } from "@/lib/data/offers";
import { buildMetadata } from "@/lib/seo/metadata";
import { hasNonCanonicalFilters, parseProductFilters } from "@/lib/search-params";
import { truncate, stripMarkdown } from "@/lib/utils";
import { ProductListing, ProductListingSkeleton } from "@/components/product/product-listing";
import { ComparisonCard } from "@/components/product/comparison-card";
import { DealCard } from "@/components/deal/deal-card";
import { BlogCard } from "@/components/blog/blog-card";
import { Breadcrumbs } from "@/components/shared/navigation";
import { FaqList, Markdown } from "@/components/shared/content-blocks";
import { CategoryIcon } from "@/components/shared/icons";
import { ViewTracker } from "@/components/shared/view-tracker";
import { Skeleton } from "@/components/ui/misc";

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.length ? categories.map((c) => ({ slug: c.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params, searchParams }: PageProps<"/categories/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const data = await getCategoryBySlug(slug);
  if (!data) return { title: "Category not found", robots: { index: false, follow: true } };
  const { category } = data;
  const filters = parseProductFilters(sp);
  const filtered = hasNonCanonicalFilters(filters) || filters.page > 1;
  return buildMetadata({
    title: category.seoTitle || `${category.name} — compare products & buying guides`,
    description:
      category.metaDescription ||
      category.shortDescription ||
      truncate(stripMarkdown(category.description), 155) ||
      `Explore ${category.name} products, buying guides and comparisons across Indian online stores.`,
    path: `/categories/${category.slug}`,
    image: category.imageUrl,
    noindex: category.noindex || filtered,
  });
}

export default function CategoryPage(props: PageProps<"/categories/[slug]">) {
  return (
    <Suspense fallback={<CategorySkeleton />}>
      <CategoryContent {...props} />
    </Suspense>
  );
}

function CategorySkeleton() {
  return (
    <div className="container-page space-y-6 py-10">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-5 w-full max-w-2xl" />
      <ProductListingSkeleton />
    </div>
  );
}

async function CategoryContent({ params, searchParams }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);
  if (!data) notFound();
  const { category, children, trail, descendantIds } = data;

  const [guides, comparisons, offers] = await Promise.all([
    getPosts({ productCategoryIds: descendantIds, pageSize: 3 }),
    getComparisons({ categoryIds: descendantIds, limit: 4 }),
    getLiveOffers({ categoryIds: descendantIds, limit: 3 }),
  ]);

  return (
    <>
      <ViewTracker type="category" id={category.id} name={category.name} />
      <div className="border-b border-line bg-white">
        <div className="container-page py-8 sm:py-10">
          <Breadcrumbs
            items={[{ name: "Categories", href: "/categories" }, ...trail.map((c) => ({ name: c.name, href: `/categories/${c.slug}` }))]}
          />
          <div className="flex items-start gap-4">
            <span className="hidden size-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 sm:grid">
              <CategoryIcon name={category.icon} className="size-7" />
            </span>
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{category.name}</h1>
              {category.shortDescription && <p className="mt-2 max-w-3xl text-lg leading-relaxed text-ink-500">{category.shortDescription}</p>}
            </div>
          </div>
          {children.length > 0 && (
            <nav aria-label={`${category.name} subcategories`} className="mt-6">
              <ul className="flex flex-wrap gap-2">
                {children.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/categories/${c.slug}`}
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3.5 py-1.5 text-sm font-semibold text-ink-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                    >
                      <CategoryIcon name={c.icon} className="size-4" /> {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>

      <div className="container-page space-y-14 py-8">
        <Suspense fallback={<ProductListingSkeleton />}>
          <CategoryProducts slug={category.slug} searchParams={searchParams} name={category.name} />
        </Suspense>

        {offers.length > 0 && (
          <section aria-labelledby="cat-deals">
            <h2 id="cat-deals" className="mb-5 text-2xl font-extrabold tracking-tight text-ink-900">
              Live offers in {category.name}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((o) => (
                <DealCard key={o.id} offer={o} />
              ))}
            </div>
          </section>
        )}

        {comparisons.length > 0 && (
          <section aria-labelledby="cat-compare">
            <h2 id="cat-compare" className="mb-5 text-2xl font-extrabold tracking-tight text-ink-900">
              {category.name} comparisons
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {comparisons.map((c) => (
                <ComparisonCard key={c.id} comparison={c} />
              ))}
            </div>
          </section>
        )}

        {category.description && (
          <section aria-labelledby="cat-about" className="max-w-3xl">
            <h2 id="cat-about" className="mb-4 text-2xl font-extrabold tracking-tight text-ink-900">
              Buying {category.name.toLowerCase()} online: what to know
            </h2>
            <Markdown content={category.description} />
          </section>
        )}

        {guides.items.length > 0 && (
          <section aria-labelledby="cat-guides">
            <h2 id="cat-guides" className="mb-5 text-2xl font-extrabold tracking-tight text-ink-900">
              Buying guides
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.items.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}

        <div className="max-w-3xl">
          <FaqList faqs={category.faqs} />
        </div>
      </div>
    </>
  );
}

async function CategoryProducts({
  slug,
  name,
  searchParams,
}: {
  slug: string;
  name: string;
  searchParams: PageProps<"/categories/[slug]">["searchParams"];
}) {
  const filters = parseProductFilters(await searchParams);
  return (
    <section aria-label={`${name} products`}>
      <ProductListing
        filters={{ ...filters, category: undefined }}
        basePath={`/categories/${slug}`}
        fixed={{ categorySlug: slug }}
        hideCategory
        emptyTitle={`No ${name.toLowerCase()} products yet`}
        emptyDescription="Our editors are adding products to this category. Explore the buying guides below in the meantime."
      />
    </section>
  );
}
