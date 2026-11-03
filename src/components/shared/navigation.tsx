import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { cn } from "@/lib/utils";

export type Crumb = { name: string; href: string };

/** Visible breadcrumb trail + BreadcrumbList structured data. */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const all = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("mb-4 text-sm", className)}>
        <ol className="flex flex-wrap items-center gap-1 text-ink-500">
          {all.map((item, i) => {
            const last = i === all.length - 1;
            return (
              <li key={item.href} className="flex min-w-0 items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-ink-300" aria-hidden="true" />}
                {last ? (
                  <span aria-current="page" className="truncate font-medium text-ink-800">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.href} className="truncate hover:text-brand-700">
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(all)} />
    </>
  );
}

/** Server-rendered pagination using query-string links (crawlable). */
export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v && k !== "page") params.set(k, v);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages));
  const sorted = [...pages].sort((a, b) => a - b);
  const linkCls =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition";
  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={cn(linkCls, "border-line bg-white text-ink-700 hover:border-brand-300")}>
          <ChevronLeft className="size-4" aria-hidden="true" /> <span className="sr-only sm:not-sr-only">Previous</span>
        </Link>
      ) : null}
      {sorted.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - sorted[i - 1]! > 1 && <span className="px-1 text-ink-400">…</span>}
          {p === page ? (
            <span aria-current="page" className={cn(linkCls, "border-brand-600 bg-brand-600 text-white")}>
              {p}
            </span>
          ) : (
            <Link href={hrefFor(p)} className={cn(linkCls, "border-line bg-white text-ink-700 hover:border-brand-300")}>
              {p}
            </Link>
          )}
        </span>
      ))}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={cn(linkCls, "border-line bg-white text-ink-700 hover:border-brand-300")}>
          <span className="sr-only sm:not-sr-only">Next</span> <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
