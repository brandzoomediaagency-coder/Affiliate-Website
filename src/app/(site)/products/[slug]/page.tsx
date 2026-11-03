import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, CircleMinus, Info, Sparkles, ThumbsDown, ThumbsUp, TrendingUp, UserCheck, UserX } from "lucide-react";
import {
  getAlternativeProducts,
  getProductBySlug,
  getPublishedProductSlugs,
  getRelatedProducts,
} from "@/lib/data/products";
import { getAllCategories, getCategoryTrail } from "@/lib/data/categories";
import { getComparisonsForProduct } from "@/lib/data/comparisons";
import { getPosts } from "@/lib/data/blog";
import { getSiteSettings } from "@/lib/data/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { productJsonLd } from "@/lib/seo/jsonld";
import { formatDate, stripMarkdown, truncate } from "@/lib/utils";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/shared/navigation";
import { AffiliateDisclosure } from "@/components/shared/disclosure";
import { FaqList, Markdown, SourcesList } from "@/components/shared/content-blocks";
import { ViewTracker } from "@/components/shared/view-tracker";
import { ProductGallery } from "@/components/product/product-gallery";
import { PriceComparisonTable } from "@/components/product/price-comparison-table";
import { PriceDisplay } from "@/components/product/price-display";
import { AffiliateButton } from "@/components/product/affiliate-button";
import { WishlistButton } from "@/components/product/wishlist-button";
import { ProductGrid } from "@/components/product/product-grid";
import { StickyBuyBar } from "@/components/product/sticky-buy-bar";
import { BlogCard } from "@/components/blog/blog-card";
import { Badge, Skeleton } from "@/components/ui/misc";

export async function generateStaticParams() {
  const slugs = await getPublishedProductSlugs(100);
  // Cache Components requires at least one param; unknown slugs render on demand.
  return slugs.length ? slugs.map((s) => ({ slug: s.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found", robots: { index: false, follow: true } };
  const description =
    product.metaDescription ||
    product.shortDescription ||
    truncate(stripMarkdown(product.overview || product.description), 155) ||
    `Explore ${product.name}: key features, specifications and where to buy online in India.`;
  return buildMetadata({
    title: product.seoTitle || `${product.name}: specs, features & where to buy`,
    description,
    path: `/products/${product.slug}`,
    canonical: product.canonicalUrl,
    image: product.images[0]?.url,
    imageAlt: product.images[0]?.altText,
    noindex: product.noindex,
  });
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-page grid gap-10 py-8 lg:grid-cols-2">
      <Skeleton className="aspect-square rounded-3xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  );
}

async function ProductContent({ params }: { params: PageProps<"/products/[slug]">["params"] }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [settings, categories, alternatives, related, comparisons, guidesByProduct] = await Promise.all([
    getSiteSettings(),
    getAllCategories(),
    getAlternativeProducts(product.id),
    getRelatedProducts(product.id, product.category?.id ?? null, 8),
    getComparisonsForProduct(product.id),
    getPosts({ productId: product.id, pageSize: 3 }),
  ]);
  const trail = product.category ? getCategoryTrail(product.category.id, categories) : [];
  const guides =
    guidesByProduct.items.length > 0
      ? guidesByProduct.items
      : trail.length
        ? (await getPosts({ productCategoryIds: trail.map((c) => c.id), pageSize: 3 })).items
        : [];

  const firstPriced = product.listings.find((l) => l.price !== null) ?? null;
  const primary = firstPriced ?? product.listings[0] ?? null;
  const merchantStatements = product.listings.map((l) => l.merchantDisclosureText).filter((t): t is string => Boolean(t));
  const specGroups = product.specs.reduce<Record<string, typeof product.specs>>((acc, s) => {
    (acc[s.groupName] ??= []).push(s);
    return acc;
  }, {});
  const sections = [
    { id: "where-to-buy", label: "Where to buy" },
    product.overview || product.description ? { id: "overview", label: "Overview" } : null,
    product.specs.length ? { id: "specifications", label: "Specifications" } : null,
    product.pros.length || product.cons.length ? { id: "pros-cons", label: "Pros & cons" } : null,
    product.faqs.length ? { id: "faqs", label: "FAQs" } : null,
  ].filter((s): s is { id: string; label: string } => s !== null);

  return (
    <>
      <ViewTracker type="product" id={product.id} name={product.name} />
      <JsonLd data={productJsonLd(product)} />

      <div className="border-b border-line bg-white">
        <div className="container-page py-6 lg:py-10">
          <Breadcrumbs
            items={[
              { name: "Products", href: "/products" },
              ...trail.map((c) => ({ name: c.name, href: `/categories/${c.slug}` })),
              { name: product.name, href: `/products/${product.slug}` },
            ]}
          />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
            <ProductGallery images={product.images} productName={product.name} />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {product.brand && <Badge variant="outline">{product.brand.name}</Badge>}
                {product.category && (
                  <Link href={`/categories/${product.category.slug}`}>
                    <Badge variant="brand">{product.category.name}</Badge>
                  </Link>
                )}
                {product.isTrending && (
                  <Badge variant="saffron" title={product.trendingReason ?? undefined}>
                    <TrendingUp aria-hidden="true" /> Trending
                  </Badge>
                )}
              </div>
              <h1 className="mt-3 text-2xl leading-tight font-extrabold tracking-tight text-ink-900 sm:text-3xl lg:text-4xl">{product.name}</h1>
              {product.modelNumber && <p className="mt-2 text-sm text-ink-500">Model: {product.modelNumber}</p>}
              {product.shortDescription && <p className="mt-4 text-lg leading-relaxed text-ink-600">{product.shortDescription}</p>}
              {product.isTrending && product.trendingReason && (
                <p className="mt-3 flex items-start gap-2 text-sm text-saffron-700">
                  <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {product.trendingReason}
                </p>
              )}

              <div id="buy-box" className="mt-6 rounded-2xl border border-line bg-canvas/60 p-5">
                {primary ? (
                  <>
                    {firstPriced ? (
                      <>
                        <PriceDisplay
                          price={firstPriced.price}
                          previousPrice={firstPriced.previousPrice}
                          previousPriceType={firstPriced.previousPriceType}
                          discount={firstPriced.discount}
                          size="lg"
                        />
                        <p className="mt-1 text-xs text-ink-500">on {firstPriced.merchantName} · last checked {formatDate(firstPriced.priceCheckedAt)}</p>
                      </>
                    ) : (
                      <p className="flex items-center gap-2 text-sm text-ink-600">
                        <Info className="size-4 text-brand-500" aria-hidden="true" />
                        Prices change often — check the current price on the store.
                      </p>
                    )}
                    <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <AffiliateButton
                        href={primary.affiliateUrl}
                        merchantName={primary.merchantName}
                        listingId={primary.id}
                        productId={product.id}
                        productName={product.name}
                        sourceComponent="product_buy_box"
                        label={primary.price !== null ? `Buy on ${primary.merchantName}` : `Check Price on ${primary.merchantName}`}
                        size="lg"
                        block
                      />
                      <WishlistButton productId={product.id} productName={product.name} variant="full" className="h-12" />
                    </div>
                    {product.listings.length > 1 && (
                      <a href="#where-to-buy" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
                        Compare {product.listings.length} store listings ↓
                      </a>
                    )}
                    <p className="mt-3 text-xs text-ink-500">
                      You&apos;ll complete your purchase on {primary.merchantName}&apos;s website. The store handles payment,
                      delivery and returns.
                    </p>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-ink-600">No active store listing right now.</p>
                    <WishlistButton productId={product.id} productName={product.name} variant="full" />
                  </div>
                )}
              </div>

              {product.keyFeatures.length > 0 && (
                <div className="mt-6">
                  <h2 className="mb-3 text-base font-bold text-ink-900">Key features</h2>
                  <ul className="space-y-2">
                    {product.keyFeatures.map((f) => (
                      <li key={f} className="flex gap-2.5 text-[0.95rem] text-ink-700">
                        <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <AffiliateDisclosure text={settings.affiliateDisclosureShort} merchantStatements={merchantStatements} className="mt-6" compact />
            </div>
          </div>
        </div>
      </div>

      {sections.length > 1 && (
        <nav aria-label="On this page" className="sticky top-16 z-20 border-b border-line bg-white/95 backdrop-blur md:top-[4.5rem] lg:top-[7.5rem]">
          <ul className="container-page flex gap-1 overflow-x-auto py-2 scrollbar-none">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-ink-600 hover:bg-canvas hover:text-ink-900">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="container-page grid gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-12">
          <section id="where-to-buy" aria-labelledby="where-to-buy-heading" className="scroll-mt-40">
            <h2 id="where-to-buy-heading" className="mb-1 text-2xl font-extrabold tracking-tight text-ink-900">
              Where to buy {product.name}
            </h2>
            <p className="mb-4 text-sm text-ink-500">
              Each store listing has its own button. Compare seller, delivery, returns and warranty on the store before buying.
            </p>
            <PriceComparisonTable listings={product.listings} productId={product.id} productName={product.name} />
          </section>

          {(product.overview || product.description) && (
            <section id="overview" aria-labelledby="overview-heading" className="scroll-mt-40">
              <h2 id="overview-heading" className="mb-4 text-2xl font-extrabold tracking-tight text-ink-900">
                Overview
              </h2>
              <Markdown content={product.overview} />
              {product.description && <Markdown content={product.description} className="mt-6" />}
            </section>
          )}

          {product.specs.length > 0 && (
            <section id="specifications" aria-labelledby="specs-heading" className="scroll-mt-40">
              <h2 id="specs-heading" className="mb-4 text-2xl font-extrabold tracking-tight text-ink-900">
                Specifications
              </h2>
              <div className="space-y-6">
                {Object.entries(specGroups).map(([group, specs]) => (
                  <div key={group} className="overflow-hidden rounded-2xl border border-line bg-white">
                    <h3 className="bg-brand-50/60 px-4 py-2.5 text-sm font-bold text-ink-900">{group}</h3>
                    <dl className="divide-y divide-line">
                      {specs.map((s) => (
                        <div key={s.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-4 py-3 text-sm">
                          <dt className="font-medium text-ink-500">{s.label}</dt>
                          <dd className="text-ink-900">
                            {s.value}
                            {s.sourceUrl && (
                              <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-1.5 text-xs text-brand-700 underline">
                                source
                              </a>
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink-500">
                Specifications are taken from the manufacturer or official sources where cited. Always confirm details on the store listing before buying.
              </p>
            </section>
          )}

          {(product.pros.length > 0 || product.cons.length > 0) && (
            <section id="pros-cons" aria-labelledby="pros-heading" className="scroll-mt-40">
              <h2 id="pros-heading" className="mb-4 text-2xl font-extrabold tracking-tight text-ink-900">
                Advantages & limitations
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-emerald-800">
                    <ThumbsUp className="size-4" aria-hidden="true" /> Advantages
                  </h3>
                  <ul className="space-y-2 text-[0.95rem] text-ink-700">
                    {product.pros.map((p) => (
                      <li key={p} className="flex gap-2">
                        <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5">
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-rose-800">
                    <ThumbsDown className="size-4" aria-hidden="true" /> Limitations
                  </h3>
                  <ul className="space-y-2 text-[0.95rem] text-ink-700">
                    {product.cons.map((c) => (
                      <li key={c} className="flex gap-2">
                        <CircleMinus className="mt-0.5 size-4 shrink-0 text-rose-500" aria-hidden="true" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {(product.bestFor || product.notIdealFor) && (
            <section aria-labelledby="who-heading">
              <h2 id="who-heading" className="mb-4 text-2xl font-extrabold tracking-tight text-ink-900">
                Who should consider it?
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {product.bestFor && (
                  <div className="rounded-2xl border border-line bg-white p-5">
                    <h3 className="mb-2 flex items-center gap-2 font-bold text-ink-900">
                      <UserCheck className="size-4 text-brand-600" aria-hidden="true" /> A good fit if…
                    </h3>
                    <Markdown content={product.bestFor} />
                  </div>
                )}
                {product.notIdealFor && (
                  <div className="rounded-2xl border border-line bg-white p-5">
                    <h3 className="mb-2 flex items-center gap-2 font-bold text-ink-900">
                      <UserX className="size-4 text-ink-400" aria-hidden="true" /> Consider an alternative if…
                    </h3>
                    <Markdown content={product.notIdealFor} />
                  </div>
                )}
              </div>
            </section>
          )}

          {product.buyingConsiderations && (
            <section aria-labelledby="consider-heading">
              <h2 id="consider-heading" className="mb-4 text-2xl font-extrabold tracking-tight text-ink-900">
                Things to check before buying
              </h2>
              <Markdown content={product.buyingConsiderations} />
            </section>
          )}

          {alternatives.length > 0 && (
            <section aria-labelledby="alternatives-heading">
              <h2 id="alternatives-heading" className="mb-4 text-2xl font-extrabold tracking-tight text-ink-900">
                Alternatives to consider
              </h2>
              <ProductGrid products={alternatives.slice(0, 4)} className="xl:grid-cols-3" sourceComponent="alternatives" />
            </section>
          )}

          <FaqList faqs={product.faqs} />
          <SourcesList sources={product.sources} />
          <p className="text-xs text-ink-400">
            Page last updated {formatDate(product.updatedAt)}. Read our{" "}
            <Link href="/editorial-policy" className="underline">
              editorial policy
            </Link>
            .
          </p>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-44 lg:self-start">
          {comparisons.length > 0 && (
            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="mb-3 font-bold text-ink-900">Compare side by side</h2>
              <ul className="space-y-2 text-sm">
                {comparisons.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/compare/${c.slug}`} className="font-medium text-brand-700 hover:underline">
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {guides.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-bold text-ink-900">Related buying guides</h2>
              {guides.map((g) => (
                <BlogCard key={g.id} post={g} />
              ))}
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="container-page pb-6" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-5 text-2xl font-extrabold tracking-tight text-ink-900">
            More in {product.category?.name ?? "this category"}
          </h2>
          <ProductGrid products={related} sourceComponent="related_products" />
        </section>
      )}

      <StickyBuyBar
        productId={product.id}
        productName={product.name}
        listing={primary ? { id: primary.id, affiliateUrl: primary.affiliateUrl, merchantName: primary.merchantName, price: primary.price } : null}
        listingCount={product.listings.length}
      />
    </>
  );
}
