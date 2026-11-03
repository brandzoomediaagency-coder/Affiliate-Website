import Link from "next/link";
import { Store, TrendingUp } from "lucide-react";
import type { ProductCard as ProductCardData } from "@/lib/data/types";
import { formatDateTime } from "@/lib/utils";
import { SmartImage } from "@/components/shared/smart-image";
import { Badge } from "@/components/ui/misc";
import { buttonVariants } from "@/components/ui/button";
import { AffiliateButton } from "./affiliate-button";
import { WishlistButton } from "./wishlist-button";
import { PriceDisplay } from "./price-display";

/** Consistent product card used across the whole site. */
export function ProductCard({
  product,
  priority = false,
  sourceComponent = "product_card",
}: {
  product: ProductCardData;
  priority?: boolean;
  sourceComponent?: string;
}) {
  const href = `/products/${product.slug}`;
  const multipleStores = product.listingCount > 1;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="relative aspect-square bg-white">
        <Link href={href} className="absolute inset-0 p-5" aria-label={product.name} tabIndex={-1}>
          <div className="relative size-full">
            <SmartImage
              src={product.imageUrl}
              alt={product.imageAlt || product.name}
              source={product.imageSource}
              sizes="(min-width: 1280px) 280px, (min-width: 768px) 30vw, 50vw"
              priority={priority}
              className="transition duration-300 group-hover:scale-[1.03]"
            />
          </div>
        </Link>
        <div className="pointer-events-none absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {product.discount !== null && <Badge variant="success">{product.discount}% off</Badge>}
          {product.isTrending && (
            <Badge variant="saffron" title={product.trendingReason ?? undefined}>
              <TrendingUp aria-hidden="true" /> Trending
            </Badge>
          )}
        </div>
        <WishlistButton productId={product.id} productName={product.name} className="absolute top-3 right-3" />
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-line/70 p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-ink-500">
          {product.categoryName && <span className="truncate">{product.categoryName}</span>}
          {product.brandName && (
            <>
              <span aria-hidden="true" className="text-ink-300">
                •
              </span>
              <span className="truncate">{product.brandName}</span>
            </>
          )}
        </div>
        <h3 className="line-clamp-2 text-[0.95rem] leading-snug font-bold text-ink-900">
          <Link href={href} className="hover:text-brand-700">
            {product.name}
          </Link>
        </h3>
        {product.shortDescription && (
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-500">{product.shortDescription}</p>
        )}

        <div className="mt-auto space-y-3 pt-1">
          {product.price !== null ? (
            <div>
              <PriceDisplay price={product.price} previousPrice={product.previousPrice} discount={null} size="md" />
              <p className="mt-0.5 text-[0.7rem] text-ink-400">
                on {product.bestMerchantName}
                {product.priceCheckedAt ? ` · checked ${formatDateTime(product.priceCheckedAt)}` : ""}
              </p>
            </div>
          ) : product.bestMerchantName ? (
            <p className="flex items-center gap-1.5 text-sm text-ink-600">
              <Store className="size-4 text-ink-400" aria-hidden="true" />
              {multipleStores ? `Available on ${product.listingCount} stores` : `Available on ${product.bestMerchantName}`}
            </p>
          ) : (
            <p className="text-sm text-ink-400">No store listing yet</p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Link href={href} className={buttonVariants({ variant: "outline", size: "sm" })}>
              {multipleStores ? "Compare" : "Details"}
            </Link>
            {product.bestAffiliateUrl && product.bestMerchantName ? (
              <AffiliateButton
                href={product.bestAffiliateUrl}
                merchantName={product.bestMerchantName}
                listingId={product.bestListingId}
                productId={product.id}
                productName={product.name}
                sourceComponent={sourceComponent}
                label={product.price !== null ? "Buy Now" : "Check Price"}
                size="sm"
              />
            ) : (
              <Link href={href} className={buttonVariants({ variant: "soft", size: "sm" })}>
                View
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
