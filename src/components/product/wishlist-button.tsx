"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  productName,
  variant = "icon",
  className,
}: {
  productId: string;
  productName: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { has, toggle, ready } = useWishlist();
  const saved = has(productId);
  const label = saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`;

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => toggle(productId, productName)}
        disabled={!ready}
        aria-pressed={saved}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition",
          saved
            ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            : "border-line-strong bg-white text-ink-800 hover:border-brand-300 hover:bg-brand-50",
          className,
        )}
      >
        <Heart className={cn("size-4", saved && "fill-current")} aria-hidden="true" />
        {saved ? "Saved to wishlist" : "Save to wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(productId, productName);
      }}
      disabled={!ready}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 place-items-center rounded-full border bg-white/95 shadow-sm backdrop-blur transition hover:scale-105",
        saved ? "border-rose-200 text-rose-600" : "border-line text-ink-500 hover:text-rose-600",
        className,
      )}
    >
      <Heart className={cn("size-[1.05rem]", saved && "fill-current")} aria-hidden="true" />
    </button>
  );
}
