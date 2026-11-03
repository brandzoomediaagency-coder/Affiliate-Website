import { getMerchants } from "@/lib/data/merchants";
import { getLiveOffers } from "@/lib/data/offers";
import { buildMetadata } from "@/lib/seo/metadata";
import { StoreCard } from "@/components/store/store-card";
import { Breadcrumbs } from "@/components/shared/navigation";
import { EmptyState, Notice, PageHeader } from "@/components/ui/misc";

export async function generateMetadata() {
  return buildMetadata({
    title: "Online shopping stores — Amazon, Flipkart, Meesho & more",
    description:
      "Explore the Indian online stores we cover, learn what to check when buying from each, and discover their products and verified offers.",
    path: "/stores",
  });
}

export default async function StoresPage() {
  const [merchants, offers] = await Promise.all([getMerchants(), getLiveOffers({ limit: 100 })]);
  const counts = new Map<string, number>();
  for (const o of offers) counts.set(o.merchantId, (counts.get(o.merchantId) ?? 0) + 1);

  return (
    <>
      <PageHeader title="Stores" description="Shopping platforms we cover. When you click through, you shop and pay on the store's own website.">
        <Breadcrumbs items={[{ name: "Stores", href: "/stores" }]} />
      </PageHeader>
      <div className="container-page space-y-6 py-10">
        {merchants.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {merchants.map((m) => (
              <StoreCard key={m.id} merchant={m} offerCount={counts.get(m.id)} />
            ))}
          </div>
        ) : (
          <EmptyState title="No stores yet" />
        )}
        <Notice tone="info">
          Store names are shown only to identify where products are available. We are an independent website and not an official
          representative of any store.
        </Notice>
      </div>
    </>
  );
}
