import type { ProductSort } from "@/lib/data/products";

type RawParams = Record<string, string | string[] | undefined>;

export function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v === undefined ? undefined : v.slice(0, 200);
}

const SORTS: ProductSort[] = ["relevance", "newest", "price_asc", "price_desc", "popular"];

export type ProductFilterParams = {
  q?: string;
  category?: string;
  store?: string;
  min?: number;
  max?: number;
  sort?: ProductSort;
  page: number;
};

export function parseProductFilters(params: RawParams): ProductFilterParams {
  const num = (v: string | undefined) => {
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n < 100_000_000 ? Math.floor(n) : undefined;
  };
  const slug = (v: string | undefined) => (v && /^[a-z0-9-]{1,120}$/.test(v) ? v : undefined);
  const sort = first(params.sort) as ProductSort | undefined;
  const page = Number(first(params.page) ?? "1");
  return {
    q: first(params.q)?.trim() || undefined,
    category: slug(first(params.category)),
    store: slug(first(params.store)),
    min: num(first(params.min)),
    max: num(first(params.max)),
    sort: sort && SORTS.includes(sort) ? sort : undefined,
    page: Number.isInteger(page) && page > 0 && page < 1000 ? page : 1,
  };
}

/** True if the URL has filters that should not create indexable duplicates. */
export function hasNonCanonicalFilters(f: ProductFilterParams): boolean {
  return Boolean(f.q || f.category || f.store || f.min !== undefined || f.max !== undefined || f.sort);
}

export function toStringParams(f: ProductFilterParams): Record<string, string | undefined> {
  return {
    q: f.q,
    category: f.category,
    store: f.store,
    min: f.min?.toString(),
    max: f.max?.toString(),
    sort: f.sort,
  };
}
