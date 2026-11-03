import { formatINR, previousPriceLabels } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/**
 * Shows a verified price, previous price and mathematically valid discount.
 * Renders nothing when no verified price is available (callers then show a
 * "Check price" call to action instead).
 */
export function PriceDisplay({
  price,
  previousPrice,
  previousPriceType = "mrp",
  discount,
  size = "md",
  className,
}: {
  price: number | null;
  previousPrice: number | null;
  previousPriceType?: string;
  discount: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (price === null) return null;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "font-extrabold tracking-tight text-ink-900",
          size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-lg",
        )}
      >
        {formatINR(price)}
      </span>
      {previousPrice !== null && (
        <span className={cn("text-ink-400", size === "lg" ? "text-base" : "text-sm")}>
          <span className="sr-only">{previousPriceLabels[previousPriceType] ?? "Previous price"}: </span>
          <span aria-hidden="true">{previousPriceLabels[previousPriceType] ?? ""} </span>
          <s>{formatINR(previousPrice)}</s>
        </span>
      )}
      {discount !== null && (
        <span className={cn("font-bold text-emerald-600", size === "lg" ? "text-base" : "text-sm")}>{discount}% off</span>
      )}
    </div>
  );
}
