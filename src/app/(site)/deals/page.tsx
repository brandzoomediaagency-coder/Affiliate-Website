import { Suspense } from "react";
import Link from "next/link";
import { BadgePercent } from "lucide-react";
import { getLiveOffers } from "@/lib/data/offers";
import { getMerchants } from "@/lib/data/merchants";
import { getBanners, getSiteSettings } from "@/lib/data/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { first } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import { DealCard } from "@/components/deal/deal-card";
import { Breadcrumbs } from "@/components/shared/navigation";
import { AffiliateDisclosure } from "@/components/shared/disclosure";
import { ViewTracker } from "@/components/shared/view-tracker";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";

export async function generateMetadata({ searchParams }: PageProps<"/deals">) {
  const store = first((await searchParams).store);
  return buildMetadata({
    title: "Today's online shopping deals & offers in India",
    description:
      "Verified deals and offers from Amazon, Flipkart, Meesho and other Indian online stores. No fake countdowns — expired offers are removed automatically.",
    path: "/deals",
    noindex: Boolean(store),
  });
}

export default async function DealsPage({ searchParams }: PageProps<"/deals">) {
  const [banners, merchants] = await Promise.all([getBanners("deals_top"), getMerchants()]);
  const banner = banners[0];
  return (
    <>
      <ViewTracker type="deals" />
      <PageHeader
        title="Deals & offers"
        description="Offers we have checked with the merchant, with real start and end dates where available. Always confirm the final price on the store before you buy."
      >
        <Breadcrumbs items={[{ name: "Deals", href: "/deals" }]} />
      </PageHeader>
      <div className="container-page space-y-8 py-8">
        {banner && (
          <Link href={banner.ctaUrl || "/deals"} className="block rounded-3xl bg-saffron-100 p-6 sm:p-8">
            {banner.eyebrow && <p className="text-xs font-bold tracking-[0.14em] text-saffron-700 uppercase">{banner.eyebrow}</p>}
            <p className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">{banner.title}</p>
            {banner.subtitle && <p className="mt-1.5 text-sm text-ink-600">{banner.subtitle}</p>}
          </Link>
        )}
        <Suspense fallback={<DealsSkeleton />}>
          <DealsResults searchParams={searchParams} merchants={merchants.map((m) => ({ id: m.id, slug: m.slug, name: m.name }))} />
        </Suspense>
      </div>
    </>
  );
}

function DealsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-96 rounded-2xl" />
      ))}
    </div>
  );
}

async function DealsResults({
  searchParams,
  merchants,
}: {
  searchParams: PageProps<"/deals">["searchParams"];
  merchants: Array<{ id: string; slug: string; name: string }>;
}) {
  const storeSlug = first((await searchParams).store);
  const merchant = merchants.find((m) => m.slug === storeSlug);
  const [offers, settings, allMerchants] = await Promise.all([
    getLiveOffers({ merchantId: merchant?.id, limit: 60 }),
    getSiteSettings(),
    getMerchants(),
  ]);
  const statements = allMerchants.map((m) => m.disclosureText).filter((t): t is string => Boolean(t));

  return (
    <>
      <nav aria-label="Filter deals by store">
        <ul className="flex flex-wrap gap-2">
          {[{ slug: "", name: "All stores" }, ...merchants].map((m) => {
            const active = (merchant?.slug ?? "") === m.slug;
            return (
              <li key={m.slug || "all"}>
                <Link
                  href={m.slug ? `/deals?store=${m.slug}` : "/deals"}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-block rounded-full border px-4 py-1.5 text-sm font-semibold transition",
                    active ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-ink-700 hover:border-brand-200",
                  )}
                >
                  {m.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {offers.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <DealCard key={o.id} offer={o} />
            ))}
          </div>
          <AffiliateDisclosure text={settings.affiliateDisclosureShort} merchantStatements={statements} compact />
        </>
      ) : (
        <EmptyState
          icon={<BadgePercent />}
          title="No live deals right now"
          description="We only publish offers we can verify with the merchant, and we remove them when they expire. Please check back soon."
          action={
            <Link href="/products" className="text-sm font-semibold text-brand-700">
              Explore products →
            </Link>
          }
        />
      )}
    </>
  );
}
