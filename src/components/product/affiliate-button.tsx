"use client";

import { ExternalLink } from "lucide-react";
import { trackOutboundClick } from "@/lib/analytics/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

/**
 * Outbound affiliate link.
 *
 * - Links DIRECTLY to the approved affiliate URL (no masking, shortening or
 *   intermediate redirect), opening the merchant's site in a new tab.
 * - `rel="sponsored nofollow"` marks it as a paid/affiliate link.
 * - The click is logged with sendBeacon, so tracking never delays or blocks
 *   navigation, and guests are never asked to log in.
 * - The label always names the destination merchant.
 */
export function AffiliateButton({
  href,
  merchantName,
  listingId,
  offerId,
  merchantId,
  productId,
  productName,
  sourceComponent,
  label,
  className,
  variant = "primary",
  size = "md",
  block,
}: {
  href: string;
  merchantName: string;
  listingId?: string | null;
  offerId?: string | null;
  merchantId?: string | null;
  productId?: string | null;
  productName?: string | null;
  sourceComponent: string;
  label?: string;
  className?: string;
  block?: boolean;
} & Pick<VariantProps<typeof buttonVariants>, "variant" | "size">) {
  const text = label ?? `Buy on ${merchantName}`;
  const track = () =>
    trackOutboundClick({
      listingId: listingId ?? undefined,
      offerId: offerId ?? undefined,
      merchantId: merchantId ?? undefined,
      productId: productId ?? undefined,
      productName: productName ?? undefined,
      merchantName,
      sourceComponent,
    });

  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener"
      onClick={track}
      onAuxClick={(e) => {
        if (e.button === 1) track();
      }}
      aria-label={`${text} (opens ${merchantName} in a new tab)`}
      className={cn(buttonVariants({ variant, size, block }), className)}
    >
      <span className="truncate">{text}</span>
      <ExternalLink aria-hidden="true" />
    </a>
  );
}
