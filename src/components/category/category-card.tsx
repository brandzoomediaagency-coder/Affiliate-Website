import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/data/types";
import { CategoryIcon } from "@/components/shared/icons";
import { cn } from "@/lib/utils";

const tints = [
  "from-brand-50 to-white text-brand-600",
  "from-saffron-50 to-white text-saffron-600",
  "from-emerald-50 to-white text-emerald-600",
  "from-rose-50 to-white text-rose-600",
  "from-sky-50 to-white text-sky-600",
];

export function CategoryCard({
  category,
  index = 0,
  variant = "tile",
}: {
  category: Pick<Category, "slug" | "name" | "icon" | "imageUrl" | "imageAlt" | "shortDescription">;
  index?: number;
  variant?: "tile" | "row";
}) {
  const tint = tints[index % tints.length];
  if (variant === "row") {
    return (
      <Link
        href={`/categories/${category.slug}`}
        className="group flex items-start gap-4 rounded-2xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
      >
        <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br", tint)}>
          <CategoryIcon name={category.icon} className="size-6" />
        </span>
        <span className="min-w-0">
          <span className="block font-bold text-ink-900 group-hover:text-brand-700">{category.name}</span>
          {category.shortDescription && (
            <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-ink-500">{category.shortDescription}</span>
          )}
        </span>
      </Link>
    );
  }
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-line bg-white p-4 text-center shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
    >
      <span className={cn("relative grid size-16 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br sm:size-[4.5rem]", tint)}>
        {category.imageUrl ? (
          <Image src={category.imageUrl} alt={category.imageAlt || ""} fill sizes="72px" className="object-cover" />
        ) : (
          <CategoryIcon name={category.icon} className="size-7 transition group-hover:scale-110 sm:size-8" />
        )}
      </span>
      <span className="text-sm leading-tight font-semibold text-ink-800 group-hover:text-brand-700">{category.name}</span>
    </Link>
  );
}
