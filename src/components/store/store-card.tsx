import Link from "next/link";
import type { Merchant } from "@/lib/data/types";
import { MerchantMark } from "@/components/shared/merchant-mark";
import { AffiliateButton } from "@/components/product/affiliate-button";
import { buttonVariants } from "@/components/ui/button";

export function StoreCard({ merchant, offerCount }: { merchant: Merchant; offerCount?: number }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-center gap-3">
        <MerchantMark
          name={merchant.name}
          logoUrl={merchant.logoUrl}
          logoUsagePermitted={merchant.logoUsagePermitted}
          brandColor={merchant.brandColor}
          size="lg"
        />
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-ink-900">
            <Link href={`/stores/${merchant.slug}`} className="hover:text-brand-700">
              {merchant.name}
            </Link>
          </h3>
          {typeof offerCount === "number" && offerCount > 0 && (
            <p className="text-xs font-semibold text-emerald-600">
              {offerCount} live {offerCount === 1 ? "offer" : "offers"}
            </p>
          )}
        </div>
      </div>
      {merchant.shortDescription && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-500">{merchant.shortDescription}</p>
      )}
      <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
        <Link href={`/stores/${merchant.slug}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Explore
        </Link>
        <AffiliateButton
          href={merchant.visitUrl}
          merchantName={merchant.name}
          merchantId={merchant.id}
          sourceComponent="store_card"
          label="Visit Store"
          variant="soft"
          size="sm"
        />
      </div>
    </article>
  );
}
