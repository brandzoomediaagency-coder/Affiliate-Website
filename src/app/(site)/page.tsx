import Link from "next/link";
import { ArrowRight, Heart, Scale, Search, ShoppingBag } from "lucide-react";
import { getBanners, getSiteSettings } from "@/lib/data/settings";
import { getHomeCategories } from "@/lib/data/categories";
import { queryProducts } from "@/lib/data/products";
import { getMerchants } from "@/lib/data/merchants";
import { getLiveOffers } from "@/lib/data/offers";
import { getComparisons } from "@/lib/data/comparisons";
import { getPosts } from "@/lib/data/blog";
import { buildMetadata } from "@/lib/seo/metadata";
import { itemListJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/json-ld";
import { Hero, defaultHero } from "@/components/home/hero";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { CategoryCard } from "@/components/category/category-card";
import { ProductGrid } from "@/components/product/product-grid";
import { StoreCard } from "@/components/store/store-card";
import { DealCard } from "@/components/deal/deal-card";
import { ComparisonCard } from "@/components/product/comparison-card";
import { BlogCard } from "@/components/blog/blog-card";
import { AffiliateDisclosure } from "@/components/shared/disclosure";
import { ViewTracker } from "@/components/shared/view-tracker";
import { EmptyState, SectionHeading } from "@/components/ui/misc";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const settings = await getSiteSettings();
  return buildMetadata({
    title: settings.seoDefaultTitle,
    absoluteTitle: true,
    description: settings.seoDefaultDescription,
    path: "/",
  });
}

async function getHomeProducts() {
  // Parallel cached reads, then choose the most relevant non-empty set.
  const [trending, featured, latest] = await Promise.all([
    queryProducts({ trending: true, pageSize: 8, sort: "popular" }),
    queryProducts({ featured: true, pageSize: 8, sort: "newest" }),
    queryProducts({ pageSize: 8, sort: "newest" }),
  ]);
  if (trending.items.length >= 4) return { title: "Trending products", eyebrow: "Popular right now", items: trending.items };
  if (featured.items.length >= 4) return { title: "Featured products", eyebrow: "Editor's picks", items: featured.items };
  return { title: "Latest products", eyebrow: "Just added", items: latest.items };
}

export default async function HomePage() {
  const [settings, heroBanners, promoBanners, categories, products, merchants, offers, comparisons, posts] = await Promise.all([
    getSiteSettings(),
    getBanners("home_hero"),
    getBanners("home_promo"),
    getHomeCategories(),
    getHomeProducts(),
    getMerchants(),
    getLiveOffers({ limit: 6 }),
    getComparisons({ featured: false, limit: 4 }),
    getPosts({ pageSize: 3 }),
  ]);
  const hero = heroBanners[0] ?? defaultHero;
  const offerCounts = new Map<string, number>();
  for (const o of offers) offerCounts.set(o.merchantId, (offerCounts.get(o.merchantId) ?? 0) + 1);
  const merchantStatements = merchants.map((m) => m.disclosureText).filter((t): t is string => Boolean(t));

  return (
    <>
      <ViewTracker type="home" />
      <Hero banner={hero} />

      <div className="space-y-16 py-12 sm:space-y-20 sm:py-16">
        {/* Popular categories */}
        <section className="container-page" aria-label="Popular categories">
          <SectionHeading
            eyebrow="Shop by category"
            title="Popular categories"
            description="Jump straight into the products you care about."
            href="/categories"
            hrefLabel="All categories"
          />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8">
            {categories.map((c, i) => (
              <CategoryCard key={c.id} category={c} index={i} />
            ))}
          </div>
        </section>

        {/* Trending / featured products */}
        <section className="container-page" aria-label={products.title}>
          <SectionHeading eyebrow={products.eyebrow} title={products.title} href="/products" hrefLabel="All products" />
          <ProductGrid
            products={products.items}
            sourceComponent="home_products"
            emptyTitle="New picks are on the way"
            emptyDescription="Our editors are adding products. In the meantime, explore categories or read our buying guides."
            emptyAction={
              <Link href="/blog" className={buttonVariants({ variant: "soft" })}>
                Read buying guides
              </Link>
            }
          />
          {products.items.length > 0 && (
            <>
              <AffiliateDisclosure text={settings.affiliateDisclosureShort} merchantStatements={merchantStatements} className="mt-6" compact />
              <JsonLd data={itemListJsonLd(products.title, products.items)} />
            </>
          )}
        </section>

        {/* How it works */}
        <section className="container-page" aria-labelledby="how-heading">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-1.5 text-xs font-bold tracking-[0.14em] text-brand-600 uppercase">How it works</p>
                <h2 id="how-heading" className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-[1.75rem]">
                  Discover here. Buy directly from the store.
                </h2>
              </div>
              <Link href="/how-it-works" className="text-sm font-semibold text-brand-700">
                Learn more →
              </Link>
            </div>
            <ol className="mt-8 grid gap-6 md:grid-cols-4">
              {[
                { Icon: Search, title: "Discover", text: "Search or browse categories to find products worth considering." },
                { Icon: Scale, title: "Compare", text: "See which stores list a product, with prices when we can verify them." },
                { Icon: Heart, title: "Save", text: "Keep a wishlist on this device, or sign in to sync it across devices." },
                { Icon: ShoppingBag, title: "Buy on the store", text: "Click Buy Now to check out on the merchant's own website." },
              ].map(({ Icon, title, text }, i) => (
                <li key={title} className="relative">
                  <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <p className="font-bold text-ink-900">
                    <span className="mr-1.5 text-brand-500">{i + 1}.</span>
                    {title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Stores */}
        <section className="container-page" aria-label="Popular shopping platforms">
          <SectionHeading
            eyebrow="Stores"
            title="Popular shopping platforms"
            description="Explore products and offers from the online stores we cover."
            href="/stores"
            hrefLabel="All stores"
          />
          {merchants.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {merchants.slice(0, 6).map((m) => (
                <StoreCard key={m.id} merchant={m} offerCount={offerCounts.get(m.id)} />
              ))}
            </div>
          ) : (
            <EmptyState title="Stores coming soon" />
          )}
        </section>

        {/* Promo banners */}
        {promoBanners.length > 0 && (
          <section className="container-page grid gap-4 md:grid-cols-2" aria-label="Highlights">
            {promoBanners.slice(0, 2).map((b) => (
              <Link
                key={b.id}
                href={b.ctaUrl || "/"}
                className={cn(
                  "group relative overflow-hidden rounded-3xl p-7 transition hover:-translate-y-0.5",
                  b.theme === "saffron" ? "bg-saffron-100 text-ink-900" : b.theme === "navy" ? "bg-ink-900 text-white" : "bg-brand-100 text-ink-900",
                )}
              >
                {b.eyebrow && <p className="text-xs font-bold tracking-[0.14em] uppercase opacity-70">{b.eyebrow}</p>}
                <p className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">{b.title}</p>
                {b.subtitle && <p className="mt-2 max-w-md text-sm leading-relaxed opacity-80">{b.subtitle}</p>}
                {b.ctaLabel && (
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold">
                    {b.ctaLabel} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                )}
              </Link>
            ))}
          </section>
        )}

        {/* Deals */}
        <section className="container-page" aria-label="Latest deals">
          <SectionHeading
            eyebrow="Deals & offers"
            title="Latest deals"
            description="Offers verified with the merchant. Expired offers are removed automatically."
            href="/deals"
            hrefLabel="All deals"
          />
          {offers.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((o) => (
                <DealCard key={o.id} offer={o} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No live deals right now"
              description="We only list offers we can verify with the merchant. Check back soon or explore products."
              action={
                <Link href="/products" className={buttonVariants({ variant: "soft" })}>
                  Explore products
                </Link>
              }
            />
          )}
        </section>

        {/* Comparisons */}
        {comparisons.length > 0 && (
          <section className="container-page" aria-label="Featured comparisons">
            <SectionHeading
              eyebrow="Side by side"
              title="Featured product comparisons"
              description="Shortlists that help you weigh specifications, strengths and trade-offs."
              href="/compare"
              hrefLabel="All comparisons"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {comparisons.map((c) => (
                <ComparisonCard key={c.id} comparison={c} />
              ))}
            </div>
          </section>
        )}

        {/* Blog */}
        <section className="container-page" aria-label="Latest buying guides">
          <SectionHeading
            eyebrow="Buying guides"
            title="Latest guides & articles"
            description="Practical, plain-English advice before you spend."
            href="/blog"
            hrefLabel="All articles"
          />
          {posts.items.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.items.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="Guides are being written" description="Our first buying guides are in editorial review." />
          )}
        </section>

        {settings.newsletterEnabled && (
          <NewsletterForm
            heading={settings.newsletterHeading}
            subheading={settings.newsletterSubheading}
            consentText={settings.newsletterConsentText}
          />
        )}
      </div>
    </>
  );
}
