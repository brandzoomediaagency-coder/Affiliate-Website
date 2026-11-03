"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { fetchProductCards } from "@/lib/actions/account";
import type { ProductCard as ProductCardData } from "@/lib/data/types";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/product/product-grid";
import { EmptyState, Notice } from "@/components/ui/misc";
import { buttonVariants } from "@/components/ui/button";

/**
 * Wishlist grid for guests (device storage) and signed-in users (database).
 * Items update instantly when removed with the heart button.
 */
export function WishlistView() {
  const { ids, ready } = useWishlist();
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductCardData[] | null>(null);
  const [, startTransition] = useTransition();
  const key = [...ids].sort().join(",");

  useEffect(() => {
    if (!ready || !key) return;
    startTransition(async () => {
      const cards = await fetchProductCards(key.split(","));
      setProducts(cards);
    });
  }, [key, ready]);

  if (!ready || (key && products === null)) return <ProductGridSkeleton count={4} />;

  const visible = (products ?? []).filter((p) => ids.has(p.id));
  const unavailable = ids.size - visible.length;

  return (
    <div className="space-y-5">
      {!user && visible.length > 0 && (
        <Notice tone="info">
          Your wishlist is saved on this device only.{" "}
          <Link href="/signup?next=/wishlist" className="font-semibold underline">
            Create a free account
          </Link>{" "}
          to keep it across devices — your saved items will be merged automatically.
        </Notice>
      )}
      {visible.length === 0 ? (
        <EmptyState
          icon={<Heart />}
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here for later."
          action={
            <Link href="/products" className={buttonVariants()}>
              Discover products
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} sourceComponent="wishlist" />
          ))}
        </div>
      )}
      {unavailable > 0 && visible.length > 0 && (
        <p className="text-sm text-ink-500">
          {unavailable} saved {unavailable === 1 ? "item is" : "items are"} no longer listed.
        </p>
      )}
    </div>
  );
}
