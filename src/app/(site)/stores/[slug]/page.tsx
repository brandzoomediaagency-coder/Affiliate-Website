import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CircleCheck, ExternalLink } from "lucide-react";
import { getMerchantBySlug, getMerchants } from "@/lib/data/merchants";
import { getLiveOffers } from "@/lib/data/offers";
import { getSiteSettings } from "@/lib/data/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { hasNonCanonicalFilters, parseProductFilters } from "@/lib/search-params";
import { stripMarkdown, truncate } from "@/lib/utils";
import { ProductListing, ProductListingSkeleton } from "@/components/product/product-listing";
import { AffiliateButton } from "@/components/product/affiliate-button";
import { DealCard } from "@/components/deal/deal-card";
import { MerchantMark } from "@/components/shared/merchant-mark";
import { Breadcrumbs } from "@/components/shared/navigation";
import { AffiliateDisclosure } from "@/components/shared/disclosure";
import { Markdown } from "@/components/shared/content-blocks";
import { ViewTracker } from "@/components/shared/view-tracker";
import { Skeleton } from "@/components/ui/misc";

export async function generateStaticParams() {
  const merchants = await getMerchants();
  return merchants.length ? merchants.map((m) => ({ slug: m.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params, searchParams }: PageProps<"/stores/[slug]">) {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug);
  // Resolve the entity before reading searchParams, so unknown slugs stay fully static.
  if (!merchant) return { title: "Store not found", robots: { index: false, follow: true } };
  const filters = parseProductFilters(await searchParams);
  return buildMetadata({
    title: merchant.seoTitle || `${merchant.name} — products, offers & shopping tips`,
    description:
      merchant.metaDescription ||
      merchant.shortDescription ||
      truncate(stripMarkdown(merchant.description), 155) ||
      `Discover products and offers available on ${merchant.name}.`,
    path: `/stores/${merchant.slug}`,
    noindex: hasNonCanonicalFilters(filters) || filters.page > 1,
  });
}

export default function StorePage(props: PageProps<"/stores/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="container-page space-y-6 py-10">
          <Skeleton className="h-24 w-full rounded-3xl" />
          <ProductListingSkeleton />
        </div>
      }
    >
      <StoreContent {...props} />
    </Suspense>
  );
}

async function StoreContent({ params, searchParams }: PageProps<"/stores/[slug]">) {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug);
  if (!merchant) notFound();
  const [offers, settings] = await Promise.all([getLiveOffers({ merchantId: merchant.id, limit: 6 }), getSiteSettings()]);

  return (
    <>
      <ViewTracker type="store" id={merchant.id} name={merchant.name} />
      <div className="border-b border-line bg-white">
        <div className="container-page py-8 sm:py-10">
          <Breadcrumbs items={[{ name: "Stores", href: "/stores" }, { name: merchant.name, href: `/stores/${merchant.slug}` }]} />
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <MerchantMark
                name={merchant.name}
                logoUrl={merchant.logoUrl}
                logoUsagePermitted={merchant.logoUsagePermitted}
                brandColor={merchant.brandColor}
                size="lg"
              />
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{merchant.name}</h1>
                {merchant.shortDescription && <p className="mt-1.5 max-w-2xl text-ink-500">{merchant.shortDescription}</p>}
              </div>
            </div>
            <div id="visit" className="w-full scroll-mt-40 md:w-auto">
              <AffiliateButton
                href={merchant.visitUrl}
                merchantName={merchant.name}
                merchantId={merchant.id}
                sourceComponent="store_page"
                label={`Visit ${merchant.name}`}
                size="lg"
                block
              />
            </div>
          </div>
          <AffiliateDisclosure
            text={settings.affiliateDisclosureShort}
            merchantStatements={merchant.disclosureText ? [merchant.disclosureText] : []}
            className="mt-6"
            compact
          />
        </div>
      </div>

      <div className="container-page space-y-14 py-8">
        {(merchant.highlights.length > 0 || merchant.description) && (
          <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]" aria-labelledby="about-store">
            <div>
              <h2 id="about-store" className="mb-4 text-2xl font-extrabold tracking-tight text-ink-900">
                About shopping on {merchant.name}
              </h2>
              <Markdown content={merchant.description} />
            </div>
            <div className="space-y-4">
              {merchant.highlights.length > 0 && (
                <div className="rounded-2xl border border-line bg-white p-5">
                  <h3 className="mb-3 font-bold text-ink-900">Good to know</h3>
                  <ul className="space-y-2.5 text-sm text-ink-600">
                    {merchant.highlights.map((h) => (
                      <li key={h} className="flex gap-2">
                        <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden="true" /> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {merchant.policyLinks.length > 0 && (
                <div className="rounded-2xl border border-line bg-white p-5">
                  <h3 className="mb-3 font-bold text-ink-900">Official {merchant.name} policies</h3>
                  <ul className="space-y-2 text-sm">
                    {merchant.policyLinks.map((l) => (
                      <li key={l.url}>
                        <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
                          {l.label} <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {offers.length > 0 && (
          <section aria-labelledby="store-offers">
            <h2 id="store-offers" className="mb-5 text-2xl font-extrabold tracking-tight text-ink-900">
              Live offers on {merchant.name}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((o) => (
                <DealCard key={o.id} offer={o} />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="store-products">
          <h2 id="store-products" className="mb-5 text-2xl font-extrabold tracking-tight text-ink-900">
            Products available on {merchant.name}
          </h2>
          <Suspense fallback={<ProductListingSkeleton />}>
            <StoreProducts slug={merchant.slug} name={merchant.name} searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </>
  );
}

async function StoreProducts({
  slug,
  name,
  searchParams,
}: {
  slug: string;
  name: string;
  searchParams: PageProps<"/stores/[slug]">["searchParams"];
}) {
  const filters = parseProductFilters(await searchParams);
  return (
    <ProductListing
      filters={{ ...filters, store: undefined }}
      basePath={`/stores/${slug}`}
      fixed={{ merchantSlug: slug }}
      hideStore
      emptyTitle={`No ${name} listings yet`}
      emptyDescription="Our editors are adding products. Please check back soon."
    />
  );
}
