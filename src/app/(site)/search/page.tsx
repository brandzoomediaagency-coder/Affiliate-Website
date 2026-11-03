import { Suspense } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { getHomeCategories } from "@/lib/data/categories";
import { parseProductFilters } from "@/lib/search-params";
import { ProductListing, ProductListingSkeleton } from "@/components/product/product-listing";
import { ProductSearch } from "@/components/product/product-search";
import { EmptyState } from "@/components/ui/misc";

export async function generateMetadata({ searchParams }: PageProps<"/search">) {
  const q = parseProductFilters(await searchParams).q;
  // Internal search result pages are never indexed.
  return buildMetadata({
    title: q ? `Search results for “${q}”` : "Search products",
    description: "Search products across categories and online stores.",
    path: "/search",
    noindex: true,
    follow: true,
  });
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="container-page py-8">
      <Suspense fallback={<ProductListingSkeleton />}>
        <SearchContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchContent({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const filters = parseProductFilters(await searchParams);
  const categories = await getHomeCategories();

  return (
    <>
      <div className="mb-8 max-w-3xl">
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-ink-900">
          {filters.q ? (
            <>
              Results for <span className="text-brand-700">“{filters.q}”</span>
            </>
          ) : (
            "Search products"
          )}
        </h1>
        <ProductSearch key={filters.q ?? ""} defaultValue={filters.q} size="lg" autoFocus={!filters.q} />
      </div>
      {filters.q ? (
        <ProductListing
          filters={filters}
          basePath="/search"
          logSearch
          emptyTitle={`No products found for “${filters.q}”`}
          emptyDescription="Check the spelling, try a more general term, or browse a category."
        />
      ) : (
        <EmptyState
          icon={<Search />}
          title="What are you looking for?"
          description="Search by product name, brand or model number — or start with a popular category."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {categories.slice(0, 8).map((c) => (
                <Link key={c.id} href={`/categories/${c.slug}`} className="rounded-full border border-line bg-white px-3 py-1 text-sm font-medium text-ink-700 hover:border-brand-200">
                  {c.name}
                </Link>
              ))}
            </div>
          }
        />
      )}
    </>
  );
}
