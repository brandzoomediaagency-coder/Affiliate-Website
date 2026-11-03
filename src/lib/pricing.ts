/**
 * Price display helpers.
 *
 * Rules (never invent pricing):
 *  - A price is displayed only if the database marks it displayable
 *    (verified timestamp, fresh enough for the merchant's policy and, for
 *    merchants that forbid manual prices, sourced from an approved API).
 *  - A discount is shown only when a verified previous price is strictly
 *    greater than the verified current price, and the result is a sensible
 *    whole percentage.
 */

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrFormatterPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatINR(value: number | string | null | undefined): string | null {
  const n = toNumber(value);
  if (n === null) return null;
  return Number.isInteger(n) ? inrFormatter.format(n) : inrFormatterPaise.format(n);
}

/**
 * Returns a whole-number discount percentage or null when it cannot be
 * justified mathematically from the two verified prices.
 */
export function discountPercent(
  current: number | string | null | undefined,
  previous: number | string | null | undefined,
): number | null {
  const c = toNumber(current);
  const p = toNumber(previous);
  if (c === null || p === null) return null;
  if (c <= 0 || p <= 0 || p <= c) return null;
  const pct = Math.floor(((p - c) / p) * 100);
  if (pct < 1 || pct > 95) return null;
  return pct;
}

export type PricedListing = {
  current_price: number | string | null;
  previous_price: number | string | null;
  price_displayable: boolean | null;
  price_checked_at: string | null;
};

export function displayPrice(listing: PricedListing) {
  if (!listing.price_displayable) {
    return { price: null, previousPrice: null, discount: null, checkedAt: null } as const;
  }
  const price = toNumber(listing.current_price);
  const previousPrice = toNumber(listing.previous_price);
  return {
    price,
    previousPrice: previousPrice !== null && price !== null && previousPrice > price ? previousPrice : null,
    discount: discountPercent(price, previousPrice),
    checkedAt: listing.price_checked_at,
  } as const;
}

export const previousPriceLabels: Record<string, string> = {
  mrp: "M.R.P.",
  list_price: "List price",
  was_price: "Was",
};

export const availabilityLabels: Record<string, string> = {
  in_stock: "In stock",
  out_of_stock: "Out of stock",
  limited_stock: "Limited stock",
  preorder: "Pre-order",
  unknown: "Check availability on store",
};
