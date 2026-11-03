"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";

export type FilterCategoryOption = { slug: string; name: string; depth: number };
export type FilterValues = {
  q?: string;
  category?: string;
  store?: string;
  min?: string;
  max?: string;
  sort?: string;
};

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

/**
 * Product filters as a plain GET form (works without JavaScript and keeps
 * URLs shareable). With JavaScript, changes apply immediately. On mobile the
 * form opens in a slide-over sheet.
 */
export function ProductFilters({
  basePath,
  values,
  categories,
  stores,
  hideCategory = false,
  hideStore = false,
  showRelevance = false,
}: {
  basePath: string;
  values: FilterValues;
  categories: FilterCategoryOption[];
  stores: Array<{ slug: string; name: string }>;
  hideCategory?: boolean;
  hideStore?: boolean;
  showRelevance?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const activeCount = [values.category && !hideCategory, values.store && !hideStore, values.min, values.max].filter(Boolean).length;

  const apply = () => {
    const form = formRef.current;
    if (!form) return;
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form).entries()) {
      if (typeof value === "string" && value.trim() !== "") params.set(key, value.trim());
    }
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  };

  const sorts = showRelevance ? [{ value: "relevance", label: "Best match" }, ...SORTS] : SORTS;

  const fields = (
    <>
      {values.q && <input type="hidden" name="q" value={values.q} />}
      <div>
        <Label htmlFor="filter-sort">Sort by</Label>
        <Select id="filter-sort" name="sort" defaultValue={values.sort ?? (showRelevance ? "relevance" : "newest")} onChange={apply}>
          {sorts.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>
      {!hideCategory && (
        <div>
          <Label htmlFor="filter-category">Category</Label>
          <Select id="filter-category" name="category" defaultValue={values.category ?? ""} onChange={apply}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {`${" ".repeat(c.depth)}${c.name}`}
              </option>
            ))}
          </Select>
        </div>
      )}
      {!hideStore && (
        <div>
          <Label htmlFor="filter-store">Store</Label>
          <Select id="filter-store" name="store" defaultValue={values.store ?? ""} onChange={apply}>
            <option value="">All stores</option>
            {stores.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <fieldset>
        <legend className="mb-1.5 block text-sm font-semibold text-ink-800">Price (₹)</legend>
        <div className="grid grid-cols-2 gap-2">
          <Input name="min" type="number" inputMode="numeric" min={0} placeholder="Min" defaultValue={values.min} aria-label="Minimum price" />
          <Input name="max" type="number" inputMode="numeric" min={0} placeholder="Max" defaultValue={values.max} aria-label="Maximum price" />
        </div>
        <p className="mt-1.5 text-xs text-ink-500">Only products with a verified, current price match a price filter.</p>
      </fieldset>
    </>
  );

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="filter-sheet">
          <SlidersHorizontal /> Filters & sort
          {activeCount > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 text-[0.7rem] text-white">{activeCount}</span>
          )}
        </Button>
        {activeCount > 0 && (
          <button type="button" onClick={() => router.push(values.q ? `${basePath}?q=${encodeURIComponent(values.q)}` : basePath)} className="text-sm font-semibold text-brand-700">
            Clear filters
          </button>
        )}
      </div>

      <div
        id="filter-sheet"
        className={cn(
          "fixed inset-0 z-[80] lg:static lg:z-auto lg:block",
          open ? "block" : "hidden",
        )}
      >
        <div className="absolute inset-0 bg-ink-950/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
        <form
          ref={formRef}
          action={basePath}
          method="get"
          onSubmit={(e) => {
            e.preventDefault();
            apply();
            setOpen(false);
          }}
          className="absolute inset-y-0 right-0 flex w-[min(22rem,90vw)] flex-col gap-5 overflow-y-auto bg-white p-5 shadow-pop lg:static lg:w-auto lg:rounded-2xl lg:border lg:border-line lg:shadow-card"
          aria-label="Filter products"
        >
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-ink-900">Filters</p>
            <button type="button" className="rounded-lg p-1.5 text-ink-500 hover:bg-canvas lg:hidden" onClick={() => setOpen(false)} aria-label="Close filters">
              <X className="size-5" />
            </button>
          </div>
          {fields}
          <div className="mt-auto flex gap-2 lg:mt-0">
            <Button type="submit" block>
              Apply
            </Button>
            {activeCount > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  router.push(values.q ? `${basePath}?q=${encodeURIComponent(values.q)}` : basePath);
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
