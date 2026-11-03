import Link from "next/link";
import Image from "next/image";
import { Scale } from "lucide-react";
import type { ComparisonSummary } from "@/lib/data/types";
import { Badge } from "@/components/ui/misc";

export function ComparisonCard({ comparison }: { comparison: ComparisonSummary }) {
  return (
    <Link
      href={`/compare/${comparison.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="mb-4 flex -space-x-3">
        {comparison.imageUrls.length > 0 ? (
          comparison.imageUrls.map((url, i) => (
            <span key={url + i} className="relative size-16 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-sm">
              <Image src={url} alt="" fill sizes="64px" className="object-contain p-1.5" />
            </span>
          ))
        ) : (
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Scale className="size-6" aria-hidden="true" />
          </span>
        )}
      </div>
      {comparison.categoryName && (
        <Badge variant="brand" className="mb-2 w-fit">
          {comparison.categoryName}
        </Badge>
      )}
      <h3 className="text-lg leading-snug font-bold text-ink-900 group-hover:text-brand-700">{comparison.title}</h3>
      {comparison.summary && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-500">{comparison.summary}</p>}
      <p className="mt-auto pt-4 text-sm font-semibold text-brand-700">
        Compare {comparison.productCount} products <span aria-hidden="true">→</span>
      </p>
    </Link>
  );
}
