export const ADAPTER_KEYS = ["generic", "amazon_creators", "flipkart_affiliate", "meesho"] as const;
export type AdapterKey = (typeof ADAPTER_KEYS)[number];

export type UrlCheckInput = {
  destinationUrl: string;
  affiliateUrl: string;
  allowedDomains: string[];
};

export type UrlCheckResult = { errors: string[]; warnings: string[] };

/** Normalised product data returned by an OFFICIAL merchant API. */
export type ApiProduct = {
  merchantProductId: string;
  title: string | null;
  affiliateUrl: string | null;
  imageUrl: string | null;
  price: number | null;
  previousPrice: number | null;
  currency: string;
  availability: "in_stock" | "out_of_stock" | "limited_stock" | "preorder" | "unknown";
};

export type ConnectionTestResult = {
  ok: boolean;
  message: string;
  /** Truncated raw response, shown to admins to verify field mappings. */
  sample?: string;
};

export interface MerchantAdapter {
  key: AdapterKey;
  label: string;
  description: string;
  /** Whether an official API integration exists for this adapter. */
  supportsApi: boolean;
  /** Server environment variables required for API access. */
  requiredEnv: string[];
  /** price_source value written for API-refreshed prices. */
  priceSource: "amazon_creators_api" | "flipkart_affiliate_api" | "partner_feed" | "manual";
  isConfigured(): boolean;
  /** Programme-specific link checks on top of the generic domain checks. */
  checkUrls(input: UrlCheckInput): UrlCheckResult;
  /** Fetch current product data from the official API (never scraping). */
  fetchProducts?(merchantProductIds: string[]): Promise<ApiProduct[]>;
  testConnection?(): Promise<ConnectionTestResult>;
}
