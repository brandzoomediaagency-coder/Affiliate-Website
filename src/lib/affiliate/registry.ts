import "server-only";
import { genericAdapter } from "./adapters/generic";
import { meeshoAdapter } from "./adapters/meesho";
import { amazonCreatorsAdapter } from "./adapters/amazon-creators";
import { flipkartAdapter } from "./adapters/flipkart";
import { checkListingUrls } from "./url-checks";
import type { AdapterKey, MerchantAdapter, UrlCheckInput, UrlCheckResult } from "./types";

const adapters: Record<AdapterKey, MerchantAdapter> = {
  generic: genericAdapter,
  amazon_creators: amazonCreatorsAdapter,
  flipkart_affiliate: flipkartAdapter,
  meesho: meeshoAdapter,
};

export function getAdapter(key: string | null | undefined): MerchantAdapter {
  return adapters[(key ?? "generic") as AdapterKey] ?? genericAdapter;
}

export function listAdapters(): MerchantAdapter[] {
  return Object.values(adapters);
}

/** Generic + adapter-specific link validation. */
export function validateListingUrls(adapterKey: string | null | undefined, input: UrlCheckInput): UrlCheckResult {
  const generic = checkListingUrls(input);
  const specific = getAdapter(adapterKey).checkUrls(input);
  return {
    errors: [...generic.errors, ...specific.errors],
    warnings: [...generic.warnings, ...specific.warnings],
  };
}
