import { queryProducts, getMerchantFacets, type ProductQuery } from "@/lib/data/products";
import { getAllCategories, buildCategoryTree } from "@/lib/data/categories";
import { getSiteSettings } from "@/lib/data/settings";
import { getMerchants } from "@/lib/data/merchants";
import type { CategoryNode } from "@/lib/data/types";
import { type ProductFilterParams, toStringParams } from "@/lib/search-params";
import { pluralize } from "@/lib/utils";
import { ProductFilters, type FilterCategoryOption } from "./product-filters";
import { ProductGrid, ProductGridSkeleton } from "./product-grid";
import { Pagination } from "@/components/shared/navigation";
import { AffiliateDisclosure } from "@/components/shared/disclosure";
import { SearchLogger } from "./search-logger";

function flatten(nodes: CategoryNode[], depth = 0): FilterCategoryOption[] {
  return nodes.flatMap((n) => [{ slug: n.slug, name: n.name, depth }, ...flatten(n.children, depth + 1)]);
}

/**
 * Shared filtered product listing (used by /products, /categories/[slug],
 * /stores/[slug] and /search). Renders filters + results + pagination.
 */
export async function ProductListing({
  filters,
  basePath,
  fixed = {},
  hideCategory,
  hideStore,
  logSearch = false,
  emptyTitle,
  emptyDescription,
}: {
  filters: ProductFilterParams;
  basePath: string;
  fixed?: Pick<ProductQuery, "categorySlug" | "merchantSlug">;
  hideCategory?: boolean;
  hideStore?: boolean;
  logSearch?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const query: ProductQuery = {
    q: filters.q,
    categorySlug: fixed.categorySlug ?? filters.category,
    merchantSlug: fixed.merchantSlug ?? filters.store,
    minPrice: filters.min,
    maxPrice: filters.max,
    sort: filters.sort,
    page: filters.page,
  };
  const [result, categories, stores, settings, merchants] = await Promise.all([
    queryProducts(query),
    getAllCategories(),
    getMerchantFacets(),
    getSiteSettings(),
    getMerchants(),
  ]);
  const statements = merchants.map((m) => m.disclosureText).filter((t): t is string => Boolean(t));
  const values = {
    q: filters.q,
    category: filters.category,
    store: filters.store,
    min: filters.min?.toString(),
    max: filters.max?.toString(),
    sort: filters.sort,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-8">
      <div className="lg:sticky lg:top-36 lg:self-start">
        <ProductFilters
          key={JSON.stringify(values)}
          basePath={basePath}
          values={values}
          categories={flatten(buildCategoryTree(categories))}
          stores={stores}
          hideCategory={hideCategory}
          hideStore={hideStore}
          showRelevance={Boolean(filters.q)}
        />
      </div>
      <div className="min-w-0">
        <p className="mb-4 text-sm text-ink-500" aria-live="polite">
          {result.total > 0 ? (
            <>
              Showing {pluralize(result.total, "product")}
              {filters.q && (
                <>
                  {" "}
                  for <strong className="text-ink-800">“{filters.q}”</strong>
                </>
              )}
            </>
          ) : null}
        </p>
        <ProductGrid
          products={result.items}
          priorityCount={4}
          sourceComponent={logSearch ? "search_results" : "product_listing"}
          emptyTitle={emptyTitle ?? "No products match these filters"}
          emptyDescription={emptyDescription ?? "Try removing a filter or searching for something broader."}
        />
        <Pagination page={result.page} totalPages={result.totalPages} basePath={basePath} searchParams={toStringParams(filters)} />
        {result.items.length > 0 && (
          <AffiliateDisclosure text={settings.affiliateDisclosureShort} merchantStatements={statements} className="mt-8" compact />
        )}
        {logSearch && filters.q && <SearchLogger q={filters.q} results={result.total} />}
      </div>
    </div>
  );
}

export function ProductListingSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-8">
      <div className="hidden h-96 rounded-2xl border border-line bg-white lg:block" />
      <ProductGridSkeleton />
    </div>
  );
}
