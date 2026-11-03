import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, CircleMinus } from "lucide-react";
import { getComparisonBySlug, getComparisons } from "@/lib/data/comparisons";
import { getSiteSettings } from "@/lib/data/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { itemListJsonLd } from "@/lib/seo/jsonld";
import { formatDate, formatDateTime, stripMarkdown, truncate } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/shared/navigation";
import { AffiliateDisclosure } from "@/components/shared/disclosure";
import { FaqList, Markdown } from "@/components/shared/content-blocks";
import { SmartImage } from "@/components/shared/smart-image";
import { ViewTracker } from "@/components/shared/view-tracker";
import { AffiliateButton } from "@/components/product/affiliate-button";
import { PriceDisplay } from "@/components/product/price-display";
import { Badge, Skeleton } from "@/components/ui/misc";

export async function generateStaticParams() {
  const all = await getComparisons({ limit: 100 });
  return all.length ? all.map((c) => ({ slug: c.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/compare/[slug]">) {
  const { slug } = await params;
  const c = await getComparisonBySlug(slug);
  if (!c) return { title: "Comparison not found", robots: { index: false, follow: true } };
  return buildMetadata({
    title: c.seoTitle || c.title,
    description: c.metaDescription || c.summary || truncate(stripMarkdown(c.intro), 155),
    path: `/compare/${c.slug}`,
    image: c.items[0]?.product.imageUrl,
    noindex: c.items.length < 2,
  });
}

export default function ComparisonPage({ params }: PageProps<"/compare/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="container-page space-y-4 py-10">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <ComparisonContent params={params} />
    </Suspense>
  );
}

async function ComparisonContent({ params }: { params: PageProps<"/compare/[slug]">["params"] }) {
  const { slug } = await params;
  const comparison = await getComparisonBySlug(slug);
  if (!comparison) notFound();
  const settings = await getSiteSettings();
  const items = comparison.items;

  // Rows: chosen spec labels, or every label present for at least two products.
  const labelCounts = new Map<string, number>();
  for (const item of items) for (const label of new Set(item.specs.map((s) => s.label))) labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
  const rows =
    comparison.specLabels.length > 0
      ? comparison.specLabels
      : [...labelCounts.entries()].filter(([, n]) => n >= Math.min(2, items.length)).map(([label]) => label);

  const statements = items.flatMap((i) => i.listings.map((l) => l.merchantDisclosureText)).filter((t): t is string => Boolean(t));
  const anyPrice = items.some((i) => i.listings.some((l) => l.price !== null));
  const cellCls = "min-w-[13rem] border-b border-line p-4 align-top";

  return (
    <>
      <ViewTracker type="comparison" id={comparison.id} name={comparison.title} />
      <JsonLd data={itemListJsonLd(comparison.title, items.map((i) => i.product))} />
      <div className="border-b border-line bg-white">
        <div className="container-page py-8 sm:py-10">
          <Breadcrumbs
            items={[
              { name: "Comparisons", href: "/compare" },
              { name: comparison.title, href: `/compare/${comparison.slug}` },
            ]}
          />
          {comparison.category && (
            <Link href={`/categories/${comparison.category.slug}`}>
              <Badge variant="brand" className="mb-3">
                {comparison.category.name}
              </Badge>
            </Link>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{comparison.title}</h1>
          {comparison.summary && <p className="mt-3 max-w-3xl text-lg leading-relaxed text-ink-500">{comparison.summary}</p>}
          <p className="mt-3 text-sm text-ink-400">Updated {formatDate(comparison.updatedAt)}</p>
        </div>
      </div>

      <div className="container-page space-y-12 py-8">
        {comparison.intro && <Markdown content={comparison.intro} className="max-w-3xl" />}

        <section aria-labelledby="compare-table">
          <h2 id="compare-table" className="mb-4 text-2xl font-extrabold tracking-tight text-ink-900">
            Side-by-side comparison
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-line bg-white" role="region" aria-label="Comparison table" tabIndex={0}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 min-w-[9rem] border-b border-line bg-white p-4 text-left text-xs font-bold tracking-wide text-ink-400 uppercase">
                    Product
                  </th>
                  {items.map(({ product, highlight }) => (
                    <th key={product.id} scope="col" className={`${cellCls} text-left`}>
                      <div className="relative mb-3 aspect-square w-28 rounded-xl border border-line bg-white p-2">
                        <SmartImage src={product.imageUrl} alt={product.imageAlt || product.name} source={product.imageSource} sizes="112px" />
                      </div>
                      {highlight && (
                        <Badge variant="saffron" className="mb-2">
                          {highlight}
                        </Badge>
                      )}
                      <Link href={`/products/${product.slug}`} className="block font-bold text-ink-900 hover:text-brand-700">
                        {product.name}
                      </Link>
                      {product.brandName && <p className="mt-0.5 text-xs font-normal text-ink-500">{product.brandName}</p>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((label) => (
                  <tr key={label}>
                    <th scope="row" className="sticky left-0 z-10 border-b border-line bg-canvas p-4 text-left font-semibold text-ink-700">
                      {label}
                    </th>
                    {items.map(({ product, specs }) => (
                      <td key={product.id} className={`${cellCls} text-ink-800`}>
                        {specs.find((s) => s.label === label)?.value ?? <span className="text-ink-300">Not stated</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="sticky left-0 z-10 border-b border-line bg-canvas p-4 text-left font-semibold text-ink-700">
                    Strengths
                  </th>
                  {items.map(({ product, pros }) => (
                    <td key={product.id} className={cellCls}>
                      <ul className="space-y-1.5">
                        {pros.slice(0, 4).map((p) => (
                          <li key={p} className="flex gap-1.5 text-ink-700">
                            <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> {p}
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="sticky left-0 z-10 border-b border-line bg-canvas p-4 text-left font-semibold text-ink-700">
                    Limitations
                  </th>
                  {items.map(({ product, cons }) => (
                    <td key={product.id} className={cellCls}>
                      <ul className="space-y-1.5">
                        {cons.slice(0, 4).map((c) => (
                          <li key={c} className="flex gap-1.5 text-ink-700">
                            <CircleMinus className="mt-0.5 size-3.5 shrink-0 text-rose-500" aria-hidden="true" /> {c}
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="sticky left-0 z-10 bg-canvas p-4 text-left font-semibold text-ink-700">
                    Where to buy
                  </th>
                  {items.map(({ product, listings, note }) => (
                    <td key={product.id} className="min-w-[13rem] p-4 align-top">
                      <div className="space-y-3">
                        {listings.length === 0 && <p className="text-ink-400">No active listing</p>}
                        {listings.map((l) => (
                          <div key={l.id} className="space-y-1.5">
                            {l.price !== null && (
                              <>
                                <PriceDisplay price={l.price} previousPrice={l.previousPrice} discount={l.discount} size="sm" />
                                <p className="text-[0.7rem] text-ink-400">checked {formatDateTime(l.priceCheckedAt)}</p>
                              </>
                            )}
                            <AffiliateButton
                              href={l.affiliateUrl}
                              merchantName={l.merchantName}
                              listingId={l.id}
                              productId={product.id}
                              productName={product.name}
                              sourceComponent="comparison_table"
                              size="sm"
                              block
                              label={l.price !== null ? `Buy on ${l.merchantName}` : `Check on ${l.merchantName}`}
                            />
                          </div>
                        ))}
                        {note && <p className="text-xs text-ink-500">{note}</p>}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {anyPrice && <p className="mt-2 text-xs text-ink-500">{siteConfig.priceDisclaimer}</p>}
          <AffiliateDisclosure text={settings.affiliateDisclosureShort} merchantStatements={statements} className="mt-4" compact />
        </section>

        {comparison.verdict && (
          <section aria-labelledby="verdict" className="max-w-3xl">
            <h2 id="verdict" className="mb-4 text-2xl font-extrabold tracking-tight text-ink-900">
              Our take
            </h2>
            <Markdown content={comparison.verdict} />
          </section>
        )}

        <div className="max-w-3xl">
          <FaqList faqs={comparison.faqs} />
        </div>
      </div>
    </>
  );
}
