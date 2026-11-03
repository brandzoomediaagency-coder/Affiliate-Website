import Link from "next/link";
import { BadgePercent, CalendarClock, ShieldCheck, Ticket } from "lucide-react";
import type { Offer } from "@/lib/data/types";
import { formatDate } from "@/lib/utils";
import { SmartImage } from "@/components/shared/smart-image";
import { HideAfter } from "@/components/shared/hide-after";
import { AffiliateButton } from "@/components/product/affiliate-button";
import { Badge } from "@/components/ui/misc";

/**
 * Deal card. Shows only merchant-verified discount text and real start/end
 * dates — never countdown timers or artificial urgency. Hidden automatically
 * once the offer expires.
 */
export function DealCard({ offer }: { offer: Offer }) {
  return (
    <HideAfter expiresAt={offer.expiresAt}>
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition hover:shadow-card-hover">
        <div className="relative aspect-[16/9] bg-gradient-to-br from-saffron-50 via-white to-brand-50">
          {offer.imageUrl ? (
            <SmartImage src={offer.imageUrl} alt={offer.imageAlt || offer.title} sizes="(min-width: 1024px) 380px, 90vw" className="p-4" />
          ) : (
            <div className="grid size-full place-items-center">
              <BadgePercent className="size-12 text-saffron-500" aria-hidden="true" />
            </div>
          )}
          <Badge variant="dark" className="absolute top-3 left-3">
            {offer.merchantName}
          </Badge>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          {offer.discountText && <p className="text-lg font-extrabold text-emerald-600">{offer.discountText}</p>}
          <h3 className="line-clamp-2 font-bold text-ink-900">
            {offer.productSlug ? (
              <Link href={`/products/${offer.productSlug}`} className="hover:text-brand-700">
                {offer.title}
              </Link>
            ) : (
              offer.title
            )}
          </h3>
          {offer.description && <p className="line-clamp-2 text-sm text-ink-500">{offer.description}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
            {(offer.startsAt || offer.expiresAt) && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-3.5" aria-hidden="true" />
                {offer.startsAt && `From ${formatDate(offer.startsAt)}`}
                {offer.startsAt && offer.expiresAt && " · "}
                {offer.expiresAt && `Valid till ${formatDate(offer.expiresAt)}`}
              </span>
            )}
            {offer.verifiedAt && (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-emerald-600" aria-hidden="true" /> Verified {formatDate(offer.verifiedAt)}
              </span>
            )}
          </div>
          {offer.couponCode && (
            <p className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-saffron-400 bg-saffron-50 px-2.5 py-1 font-mono text-sm font-bold text-saffron-700">
              <Ticket className="size-4" aria-hidden="true" /> {offer.couponCode}
            </p>
          )}
          {offer.terms && (
            <details className="text-xs text-ink-500">
              <summary className="cursor-pointer font-semibold text-ink-600">Terms</summary>
              <p className="mt-1 leading-relaxed">{offer.terms}</p>
            </details>
          )}
          <div className="mt-auto pt-3">
            <AffiliateButton
              href={offer.offerUrl}
              merchantName={offer.merchantName}
              offerId={offer.id}
              productId={offer.productId}
              productName={offer.title}
              sourceComponent="deal_card"
              label={`Shop Now on ${offer.merchantName}`}
              block
              variant="accent"
            />
          </div>
        </div>
      </article>
    </HideAfter>
  );
}
