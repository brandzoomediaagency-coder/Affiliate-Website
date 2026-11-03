import Link from "next/link";
import { Newspaper } from "lucide-react";
import { getBlogCategories, getPosts, type PostQuery } from "@/lib/data/blog";
import { BlogCard } from "./blog-card";
import { Pagination } from "@/components/shared/navigation";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export async function BlogCategoryNav({ active }: { active?: string }) {
  const categories = await getBlogCategories();
  return (
    <nav aria-label="Blog categories" className="mb-8">
      <ul className="flex flex-wrap gap-2">
        {[{ slug: "", name: "All articles" }, ...categories].map((c) => {
          const isActive = (active ?? "") === c.slug;
          return (
            <li key={c.slug || "all"}>
              <Link
                href={c.slug ? `/blog/category/${c.slug}` : "/blog"}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-block rounded-full border px-4 py-1.5 text-sm font-semibold transition",
                  isActive ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-ink-700 hover:border-brand-200",
                )}
              >
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export async function BlogList({ query, basePath }: { query: PostQuery; basePath: string }) {
  const result = await getPosts({ pageSize: 12, ...query });
  if (result.items.length === 0) {
    return (
      <EmptyState
        icon={<Newspaper />}
        title="No articles published yet"
        description="Our editors are reviewing the first buying guides. Please check back soon."
      />
    );
  }
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((p, i) => (
          <BlogCard key={p.id} post={p} priority={i < 3} />
        ))}
      </div>
      <Pagination page={result.page} totalPages={result.totalPages} basePath={basePath} />
    </>
  );
}

export function BlogListSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-96 rounded-2xl" />
      ))}
    </div>
  );
}
