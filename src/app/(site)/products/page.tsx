import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo/metadata";
import { hasNonCanonicalFilters, parseProductFilters } from "@/lib/search-params";
import { ProductListing, ProductListingSkeleton } from "@/components/product/product-listing";
import { PageHeader } from "@/components/ui/misc";
import { Breadcrumbs } from "@/components/shared/navigation";

export async function generateMetadata({ searchParams }: PageProps<"/products">) {
  const filters = parseProductFilters(await searchParams);
  const filtered = hasNonCanonicalFilters(filters);
  return buildMetadata({
    title: filters.page > 1 && !filtered ? `All products — page ${filters.page}` : "All products — discover & compare across online stores",
    description:
      "Browse products across categories and compare listings from Amazon, Flipkart, Meesho and other Indian online stores before you buy.",
    path: filters.page > 1 && !filtered ? `/products?page=${filters.page}` : "/products",
    // Filter and sort combinations are not indexable duplicates.
    noindex: filtered,
    follow: true,
  });
}

export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <>
      <PageHeader
        title="All products"
        description="Discover products across categories and compare where they are available. Prices are shown only when we can verify them."
      >
        <Breadcrumbs items={[{ name: "Products", href: "/products" }]} />
      </PageHeader>
      <div className="container-page py-8">
        <Suspense fallback={<ProductListingSkeleton />}>
          <ProductsResults searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function ProductsResults({ searchParams }: { searchParams: PageProps<"/products">["searchParams"] }) {
  const filters = parseProductFilters(await searchParams);
  return <ProductListing filters={filters} basePath="/products" />;
}
