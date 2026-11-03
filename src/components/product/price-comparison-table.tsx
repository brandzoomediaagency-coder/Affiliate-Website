import { Clock, Ticket } from "lucide-react";
import type { Listing } from "@/lib/data/types";
import { availabilityLabels } from "@/lib/pricing";
import { formatDateTime } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { MerchantMark } from "@/components/shared/merchant-mark";
import { Badge } from "@/components/ui/misc";
import { HideAfter } from "@/components/shared/hide-after";
import { AffiliateButton } from "./affiliate-button";
import { PriceDisplay } from "./price-display";

/**
 * Lists every active merchant listing for a product, each with its own
 * Buy Now button. We deliberately never label a listing as "lowest price"
 * or "best deal": prices from different stores may have been checked at
 * different times and may not be directly comparable.
 */
export function PriceComparisonTable({
  listings,
  productId,
  productName,
  sourceComponent = "product_page",
}: {
  listings: Listing[];
  productId: string;
  productName: string;
  sourceComponent?: string;
}) {
  if (listings.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line-strong bg-white p-5 text-sm text-ink-500">
        We don&apos;t have an active store listing for this product right now. Please check back later.
      </p>
    );
  }
  const anyPrice = listings.some((l) => l.price !== null);

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {listings.map((listing) => {
          return (
            <li key={listing.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <MerchantMark
                  name={listing.merchantName}
                  logoUrl={listing.merchantLogoUrl}
                  logoUsagePermitted={listing.merchantLogoUsagePermitted}
                  brandColor={listing.merchantBrandColor}
                />
                <div className="min-w-0">
                  <p className="font-bold text-ink-900">
                    {listing.merchantName}
                    {listing.variantLabel && (
                      <span className="ml-2 text-sm font-medium text-ink-500">({listing.variantLabel})</span>
                    )}
                  </p>
                  <p className="text-xs text-ink-500">{availabilityLabels[listing.availability] ?? "Check availability on store"}</p>
                </div>
              </div>

              <div className="sm:w-56">
                {listing.price !== null ? (
                  <>
                    <PriceDisplay
                      price={listing.price}
                      previousPrice={listing.previousPrice}
                      previousPriceType={listing.previousPriceType}
                      discount={listing.discount}
                    />
                    <p className="mt-0.5 flex items-center gap-1 text-[0.7rem] text-ink-400">
                      <Clock className="size-3" aria-hidden="true" /> Last checked {formatDateTime(listing.priceCheckedAt)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-ink-500">Price shown on {listing.merchantName}</p>
                )}
                {(listing.couponCode || listing.offerDetails) && (
                  <HideAfter expiresAt={listing.offerExpiresAt}>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {listing.couponCode && (
                      <Badge variant="saffron">
                        <Ticket aria-hidden="true" /> Code: {listing.couponCode}
                      </Badge>
                    )}
                    {listing.offerDetails && <span className="text-xs text-ink-600">{listing.offerDetails}</span>}
                  </div>
                  </HideAfter>
                )}
              </div>

              <AffiliateButton
                href={listing.affiliateUrl}
                merchantName={listing.merchantName}
                listingId={listing.id}
                productId={productId}
                productName={productName}
                sourceComponent={sourceComponent}
                label={listing.price !== null ? `Buy on ${listing.merchantName}` : "Check Price"}
                className="sm:w-48"
              />
            </li>
          );
        })}
      </ul>
      {anyPrice && <p className="text-xs leading-relaxed text-ink-500">{siteConfig.priceDisclaimer}</p>}
    </div>
  );
}
