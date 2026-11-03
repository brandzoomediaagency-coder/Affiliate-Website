import "server-only";
import { serverEnv } from "@/lib/env.server";
import type { ApiProduct, ConnectionTestResult, MerchantAdapter } from "../types";
import { parseHttpsUrl } from "../url-checks";

/**
 * Flipkart Affiliate API adapter.
 *  - Authentication: `Fk-Affiliate-Id` and `Fk-Affiliate-Token` headers.
 *  - Product lookup: GET /affiliate/1.0/product.json?id=<productId>
 *  - Search (admin helper): GET /affiliate/1.0/search.json?query=<q>&resultCount=<n>
 *  - Product fields live under `productBaseInfoV1` (productId, title,
 *    productUrl (already carries your affiliate id), imageUrls,
 *    maximumRetailPrice, flipkartSpecialPrice / flipkartSellingPrice, inStock).
 * Respect the programme's rate limits and linking rules. Never scrape.
 */

function headers() {
  return {
    "Fk-Affiliate-Id": serverEnv.flipkart.affiliateId,
    "Fk-Affiliate-Token": serverEnv.flipkart.affiliateToken,
    Accept: "application/json",
  };
}

type Money = { amount?: number | string; currency?: string; currencyCode?: string } | undefined;

function amount(m: Money): number | null {
  const n = m?.amount !== undefined ? Number(m.amount) : NaN;
  return Number.isFinite(n) ? n : null;
}

function largestImage(imageUrls: unknown): string | null {
  if (!imageUrls || typeof imageUrls !== "object") return null;
  const entries = Object.entries(imageUrls as Record<string, string>).filter(([, v]) => typeof v === "string");
  if (entries.length === 0) return null;
  entries.sort((a, b) => (parseInt(b[0], 10) || 0) - (parseInt(a[0], 10) || 0));
  return entries[0]![1];
}

export function parseFlipkartProduct(json: unknown): ApiProduct | null {
  const base = (json as { productBaseInfoV1?: Record<string, unknown> })?.productBaseInfoV1;
  if (!base) return null;
  const special = base.flipkartSpecialPrice as Money;
  const selling = base.flipkartSellingPrice as Money;
  const mrp = base.maximumRetailPrice as Money;
  const price = amount(special) ?? amount(selling);
  return {
    merchantProductId: String(base.productId ?? ""),
    title: typeof base.title === "string" ? base.title : null,
    affiliateUrl: typeof base.productUrl === "string" ? base.productUrl : null,
    imageUrl: largestImage(base.imageUrls),
    price,
    previousPrice: amount(mrp),
    currency: special?.currency ?? selling?.currency ?? mrp?.currency ?? special?.currencyCode ?? "INR",
    availability: base.inStock === true ? "in_stock" : base.inStock === false ? "out_of_stock" : "unknown",
  };
}

async function getProduct(id: string): Promise<{ product: ApiProduct | null; raw: string }> {
  const url = `${serverEnv.flipkart.apiBaseUrl}/affiliate/1.0/product.json?id=${encodeURIComponent(id)}`;
  const response = await fetch(url, { headers: headers(), cache: "no-store" });
  const text = await response.text();
  if (response.status === 404) return { product: null, raw: text };
  if (!response.ok) throw new Error(`Flipkart product lookup failed (${response.status}): ${text.slice(0, 300)}`);
  try {
    return { product: parseFlipkartProduct(JSON.parse(text)), raw: text };
  } catch {
    throw new Error("Flipkart API returned a non-JSON response.");
  }
}

export async function flipkartSearch(query: string, resultCount = 10) {
  const url = `${serverEnv.flipkart.apiBaseUrl}/affiliate/1.0/search.json?query=${encodeURIComponent(query)}&resultCount=${Math.min(resultCount, 10)}`;
  const response = await fetch(url, { headers: headers(), cache: "no-store" });
  const text = await response.text();
  if (!response.ok) throw new Error(`Flipkart search failed (${response.status}): ${text.slice(0, 300)}`);
  const json = JSON.parse(text) as { products?: unknown[] };
  return {
    products: (json.products ?? []).map(parseFlipkartProduct).filter((p): p is ApiProduct => Boolean(p)),
    raw: text,
  };
}

export const flipkartAdapter: MerchantAdapter = {
  key: "flipkart_affiliate",
  label: "Flipkart Affiliate API",
  description:
    "Manual affiliate links work without credentials. With an affiliate id and token, product prices and stock can be refreshed from Flipkart's official Affiliate API.",
  supportsApi: true,
  requiredEnv: ["FLIPKART_AFFILIATE_ID", "FLIPKART_AFFILIATE_TOKEN"],
  priceSource: "flipkart_affiliate_api",
  isConfigured() {
    return Boolean(serverEnv.flipkart.affiliateId && serverEnv.flipkart.affiliateToken);
  },
  checkUrls({ affiliateUrl }) {
    const warnings: string[] = [];
    const url = parseHttpsUrl(affiliateUrl);
    if (url && /(^|\.)flipkart\.com$/.test(url.hostname) && !url.searchParams.get("affid")) {
      warnings.push(
        "This flipkart.com link has no affiliate id (affid=…). Use the link generated in your Flipkart Affiliate dashboard or API.",
      );
    }
    return { errors: [], warnings };
  },
  async fetchProducts(ids) {
    const results: ApiProduct[] = [];
    for (const id of [...new Set(ids.map((i) => i.trim()).filter(Boolean))]) {
      const { product } = await getProduct(id);
      if (product) results.push(product);
      await new Promise((r) => setTimeout(r, 250));
    }
    return results;
  },
  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.isConfigured()) {
      return { ok: false, message: `Missing environment variables: ${this.requiredEnv.join(", ")}` };
    }
    try {
      const { products, raw } = await flipkartSearch("earbuds", 1);
      return {
        ok: true,
        message: `Connected. Search returned ${products.length} product(s). Review the sample below to confirm field mapping.`,
        sample: raw.slice(0, 1500),
      };
    } catch (error) {
      return { ok: false, message: (error as Error).message };
    }
  },
};

export async function flipkartDebugLookup(id: string) {
  return getProduct(id);
}
