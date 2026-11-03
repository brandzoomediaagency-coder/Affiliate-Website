import "server-only";
import { serverEnv } from "@/lib/env.server";
import type { ApiProduct, ConnectionTestResult, MerchantAdapter } from "../types";
import { parseHttpsUrl } from "../url-checks";

/**
 * Amazon Creators API adapter (successor to the retired PA-API 5.0).
 *
 * - OAuth 2.0 client-credentials token from the regional token endpoint.
 *   India (www.amazon.in) is served by the EU region group.
 * - GetItems is called with the bearer token and an `x-marketplace` header.
 * - Credentials stay server-side (env vars) and are never sent to the browser.
 * - NEVER scrape Amazon pages; only data returned by this API is used.
 *
 * Endpoint and field names follow the Creators API documentation as researched
 * when this adapter was written. Because the API is new, use
 * Admin > Merchants > "Test API connection" after adding credentials to view
 * the raw response and confirm the mapping before enabling scheduled refresh.
 */

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

function isV2Credential() {
  return serverEnv.amazon.credentialVersion.trim().startsWith("2.");
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
  const { credentialId, credentialSecret, tokenUrl } = serverEnv.amazon;

  const response = isV2Credential()
    ? await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: credentialId,
          client_secret: credentialSecret,
          scope: "creatorsapi/default",
        }),
        cache: "no-store",
      })
    : await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: credentialId,
          client_secret: credentialSecret,
          scope: "creatorsapi::default",
        }),
        cache: "no-store",
      });

  const json = (await response.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string };
  if (!response.ok || !json.access_token) {
    throw new Error(`Amazon token request failed (${response.status}): ${json.error ?? "no access_token in response"}`);
  }
  tokenCache = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return json.access_token;
}

// Accept both lowerCamelCase (Creators API) and PascalCase (PA-API style) keys.
function pick(obj: unknown, ...keys: string[]): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  const record = obj as Record<string, unknown>;
  for (const key of keys) if (record[key] !== undefined) return record[key];
  return undefined;
}

function path(obj: unknown, ...segments: string[][]): unknown {
  let current: unknown = obj;
  for (const options of segments) {
    current = pick(current, ...options);
    if (current === undefined) return undefined;
  }
  return current;
}

function num(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

function mapAvailability(value: unknown): ApiProduct["availability"] {
  const v = String(value ?? "").toLowerCase();
  if (v.includes("now") || v === "in_stock" || v === "instock") return "in_stock";
  if (v.includes("preorder")) return "preorder";
  if (v.includes("limited")) return "limited_stock";
  if (v.includes("out") || v.includes("unavailable")) return "out_of_stock";
  return "unknown";
}

export function parseAmazonItems(json: unknown): ApiProduct[] {
  const items = (path(json, ["itemsResult", "ItemsResult"], ["items", "Items"]) as unknown[]) ?? [];
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const listings = (path(item, ["offersV2", "OffersV2"], ["listings", "Listings"]) as unknown[]) ?? [];
    const listing = Array.isArray(listings) ? listings[0] : undefined;
    const price = num(path(listing, ["price", "Price"], ["money", "Money"], ["amount", "Amount"]));
    const basis = num(
      path(listing, ["price", "Price"], ["savingBasis", "SavingBasis"], ["money", "Money"], ["amount", "Amount"]),
    );
    const currency = String(path(listing, ["price", "Price"], ["money", "Money"], ["currency", "Currency"]) ?? "INR");
    return {
      merchantProductId: String(pick(item, "asin", "ASIN") ?? ""),
      title: (path(item, ["itemInfo", "ItemInfo"], ["title", "Title"], ["displayValue", "DisplayValue"]) as string) ?? null,
      affiliateUrl: (pick(item, "detailPageURL", "DetailPageURL") as string) ?? null,
      imageUrl: (path(item, ["images", "Images"], ["primary", "Primary"], ["large", "Large"], ["url", "URL"]) as string) ?? null,
      price,
      previousPrice: basis,
      currency,
      availability: mapAvailability(path(listing, ["availability", "Availability"], ["type", "Type"])),
    };
  });
}

async function getItems(asins: string[]): Promise<{ products: ApiProduct[]; raw: string }> {
  const { apiBaseUrl, marketplace, partnerTag } = serverEnv.amazon;
  const token = await getAccessToken();
  const authorization = isV2Credential()
    ? `Bearer ${token}, Version ${serverEnv.amazon.credentialVersion}`
    : `Bearer ${token}`;

  const response = await fetch(`${apiBaseUrl}/catalog/v1/getItems`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      "x-marketplace": marketplace,
    },
    body: JSON.stringify({
      itemIds: asins,
      itemIdType: "ASIN",
      partnerTag,
      partnerType: "Associates",
      marketplace,
      resources: [
        "itemInfo.title",
        "images.primary.large",
        "offersV2.listings.price",
        "offersV2.listings.availability",
      ],
    }),
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Amazon GetItems failed (${response.status}): ${text.slice(0, 300)}`);
  let json: unknown = {};
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Amazon GetItems returned a non-JSON response.");
  }
  return { products: parseAmazonItems(json), raw: text };
}

export const amazonCreatorsAdapter: MerchantAdapter = {
  key: "amazon_creators",
  label: "Amazon Creators API",
  description:
    "Manual Associates links work without credentials. With Creators API credentials, prices and availability can be refreshed from Amazon's official API (prices are only displayed when sourced from the API and refreshed within 24 hours).",
  supportsApi: true,
  requiredEnv: [
    "AMAZON_CREATORS_CREDENTIAL_ID",
    "AMAZON_CREATORS_CREDENTIAL_SECRET",
    "AMAZON_CREATORS_CREDENTIAL_VERSION",
    "AMAZON_PARTNER_TAG",
  ],
  priceSource: "amazon_creators_api",
  isConfigured() {
    const a = serverEnv.amazon;
    return Boolean(a.credentialId && a.credentialSecret && a.partnerTag);
  },
  checkUrls({ affiliateUrl }) {
    const warnings: string[] = [];
    const url = parseHttpsUrl(affiliateUrl);
    if (url && /(^|\.)amazon\.in$/.test(url.hostname)) {
      const tag = url.searchParams.get("tag");
      if (!tag) {
        warnings.push(
          "This amazon.in link has no Associates tag (tag=…). Use a SiteStripe link or append your tracking id, otherwise purchases will not be attributed.",
        );
      } else if (serverEnv.amazon.partnerTag && tag !== serverEnv.amazon.partnerTag) {
        warnings.push(`The link's tag "${tag}" differs from AMAZON_PARTNER_TAG ("${serverEnv.amazon.partnerTag}").`);
      }
    }
    return { errors: [], warnings };
  },
  async fetchProducts(asins) {
    const unique = [...new Set(asins.map((a) => a.trim().toUpperCase()).filter((a) => /^[A-Z0-9]{10}$/.test(a)))];
    const results: ApiProduct[] = [];
    // GetItems accepts up to 10 item ids per request.
    for (let i = 0; i < unique.length; i += 10) {
      const { products } = await getItems(unique.slice(i, i + 10));
      results.push(...products);
      // Be gentle with request-rate limits between batches.
      if (i + 10 < unique.length) await new Promise((r) => setTimeout(r, 1100));
    }
    return results;
  },
  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.isConfigured()) {
      return { ok: false, message: `Missing environment variables: ${this.requiredEnv.join(", ")}` };
    }
    try {
      await getAccessToken();
    } catch (error) {
      return { ok: false, message: (error as Error).message };
    }
    return {
      ok: true,
      message:
        "Access token obtained successfully. Use 'Fetch from API' on a listing with a real ASIN to verify the response mapping.",
    };
  },
};

/** Fetch one ASIN and return the raw JSON too (admin verification tool). */
export async function amazonDebugLookup(asin: string) {
  return getItems([asin]);
}
