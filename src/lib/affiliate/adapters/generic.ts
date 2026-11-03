import type { MerchantAdapter } from "../types";

/**
 * Generic adapter for any additional merchant or affiliate network.
 * Listings are managed manually in the admin (affiliate URLs supplied by the
 * programme/network). To add an API integration for a new programme, create
 * a new adapter implementing `fetchProducts` / `testConnection` and register
 * it in `../registry.ts` — no other application code needs to change.
 */
export const genericAdapter: MerchantAdapter = {
  key: "generic",
  label: "Generic / manual",
  description: "Manually managed affiliate links for any merchant or affiliate network.",
  supportsApi: false,
  requiredEnv: [],
  priceSource: "manual",
  isConfigured: () => false,
  checkUrls: () => ({ errors: [], warnings: [] }),
};
