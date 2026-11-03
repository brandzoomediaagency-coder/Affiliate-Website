import type { MerchantAdapter } from "../types";

/**
 * Meesho: admin-managed affiliate URLs supplied through an approved Meesho
 * programme or affiliate network. No public product feed or API is assumed.
 * If an official, authorised integration becomes available, implement
 * `fetchProducts` here and set `supportsApi: true`.
 */
export const meeshoAdapter: MerchantAdapter = {
  key: "meesho",
  label: "Meesho (manual links)",
  description:
    "Affiliate URLs from your approved Meesho programme or network are added manually. No public Meesho product API is assumed.",
  supportsApi: false,
  requiredEnv: [],
  priceSource: "manual",
  isConfigured: () => false,
  checkUrls: ({ affiliateUrl, destinationUrl }) => {
    const warnings: string[] = [];
    if (affiliateUrl.trim() === destinationUrl.trim()) {
      warnings.push(
        "The affiliate URL is identical to the destination URL. Make sure you pasted the tracking link issued by your approved programme or network.",
      );
    }
    return { errors: [], warnings };
  },
};
