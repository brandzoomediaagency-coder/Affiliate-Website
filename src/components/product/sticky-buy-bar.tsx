"use client";

import { useEffect, useState } from "react";
import { AffiliateButton } from "./affiliate-button";
import { WishlistButton } from "./wishlist-button";
import { formatINR } from "@/lib/pricing";

/** Mobile sticky action bar shown after the main buy area scrolls away. */
export function StickyBuyBar({
  productId,
  productName,
  listing,
  listingCount,
}: {
  productId: string;
  productName: string;
  listing: { id: string; affiliateUrl: string; merchantName: string; price: number | null } | null;
  listingCount: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("buy-box");
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry!.isIntersecting && entry!.boundingClientRect.top < 0), {
      threshold: 0,
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  if (!listing) return null;
  return (
    <div
      className={`fixed inset-x-0 bottom-[3.6rem] z-30 border-t border-line bg-white/95 px-4 py-2.5 backdrop-blur transition-transform duration-200 lg:hidden ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-[200%]"
      }`}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900">{productName}</p>
          <p className="text-xs text-ink-500">
            {listing.price !== null ? `${formatINR(listing.price)} on ${listing.merchantName}` : `On ${listing.merchantName}`}
            {listingCount > 1 ? ` · ${listingCount} stores` : ""}
          </p>
        </div>
        <WishlistButton productId={productId} productName={productName} />
        <AffiliateButton
          href={listing.affiliateUrl}
          merchantName={listing.merchantName}
          listingId={listing.id}
          productId={productId}
          productName={productName}
          sourceComponent="sticky_buy_bar"
          label={listing.price !== null ? "Buy Now" : "Check Price"}
          size="sm"
        />
      </div>
    </div>
  );
}
