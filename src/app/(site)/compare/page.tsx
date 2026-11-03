import { Scale } from "lucide-react";
import { getComparisons } from "@/lib/data/comparisons";
import { buildMetadata } from "@/lib/seo/metadata";
import { ComparisonCard } from "@/components/product/comparison-card";
import { Breadcrumbs } from "@/components/shared/navigation";
import { EmptyState, PageHeader } from "@/components/ui/misc";

export async function generateMetadata() {
  return buildMetadata({
    title: "Product comparisons — compare specs side by side",
    description:
      "Side-by-side product comparisons for smartphones, earbuds, laptops, kitchen appliances and more, with specifications, strengths and trade-offs.",
    path: "/compare",
  });
}

export default async function CompareIndexPage() {
  const comparisons = await getComparisons({ limit: 60 });
  return (
    <>
      <PageHeader
        title="Product comparisons"
        description="Editorial shortlists that put specifications, strengths and limitations side by side so you can choose with confidence."
      >
        <Breadcrumbs items={[{ name: "Comparisons", href: "/compare" }]} />
      </PageHeader>
      <div className="container-page py-10">
        {comparisons.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {comparisons.map((c) => (
              <ComparisonCard key={c.id} comparison={c} />
            ))}
          </div>
        ) : (
          <EmptyState icon={<Scale />} title="Comparisons are being prepared" description="Our editors are building side-by-side comparisons. Check back soon." />
        )}
      </div>
    </>
  );
}
