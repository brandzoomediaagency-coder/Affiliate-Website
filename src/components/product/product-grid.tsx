import { PackageSearch } from "lucide-react";
import type { ProductCard as ProductCardData } from "@/lib/data/types";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  emptyTitle = "No products found",
  emptyDescription,
  emptyAction,
  className,
  sourceComponent,
  priorityCount = 0,
}: {
  products: ProductCardData[];
  emptyTitle?: string;
  emptyDescription?: React.ReactNode;
  emptyAction?: React.ReactNode;
  className?: string;
  sourceComponent?: string;
  priorityCount?: number;
}) {
  if (products.length === 0) {
    return <EmptyState icon={<PackageSearch />} title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4", className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} sourceComponent={sourceComponent} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4", className)} aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-4 h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
