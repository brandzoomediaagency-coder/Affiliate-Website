# Affiliate integrations

The platform is fully usable with **manual affiliate links only**. Official APIs are optional and add automatic price/availability refresh. Nothing in this codebase scrapes merchant websites.

## Concepts

- **Merchant** (`merchants`) — a store: name, website, *allowed domains*, logo permission, disclosure text and pricing rules (`allow_manual_prices`, `price_max_age_hours`).
- **Affiliate programme** (`affiliate_programs`) — how you earn from a merchant: programme name, network, status, adapter, API status, non-secret tracking id reference, docs/terms URLs. One programme per merchant is the default.
- **Listing** (`product_listings`) — a product's link on one merchant: destination URL, affiliate URL, optional merchant product id, optional verified price with timestamp, availability, coupon/offer details.
- **Adapter** (`src/lib/affiliate/adapters/*`) — programme-specific link checks and, where an official API exists, `fetchProducts()` and `testConnection()`.

## Link rules (all merchants)

- Destination and affiliate URLs must be `https://` without embedded credentials.
- Both hosts must match the merchant's **allowed domains** (subdomains allowed). This blocks typos, shortened or masked links and accidental links to unrelated sites. If an approved network issues links on its own tracking domain, add that domain to the merchant first.
- Links are rendered exactly as entered (no masking/shortening), with `rel="sponsored nofollow noopener"`, and open in a new tab.
- *Verify link* performs a header-only request and records the status. Some merchants block automated requests; a non-2xx status is a prompt to check manually.

## Price display rules

A listing price is displayed only when **all** are true (`v_listings.price_displayable`):

1. It has a `price_checked_at` timestamp (the admin form requires ticking "I verified this price just now", or the price came from an API).
2. It's younger than the merchant's `price_max_age_hours` (Amazon: 23h, Flipkart/Meesho: 48h by default — editable).
3. If the merchant has `allow_manual_prices = false` (Amazon by default), the price must come from an official API (`price_source` ≠ `manual`).

Otherwise the page shows **Check Price**. Displayed prices always show "Last checked …" and a disclaimer. Discounts appear only if a verified previous price is higher than the current price. No listing is ever labelled "lowest price".

## Amazon India (Amazon Associates)

**Manual (works immediately):** use SiteStripe links (`https://amzn.to/…`) or product URLs with your tag (`https://www.amazon.in/dp/ASIN?tag=yourtag-21`). The adapter warns if a link has no `tag=` or a different tag from `AMAZON_PARTNER_TAG`.

**Creators API (optional):** PA-API 5.0 has been retired; this project integrates the **Creators API**:

- OAuth 2.0 client credentials. India (`www.amazon.in`) belongs to the **EU** region group; credential version 3.x uses the token endpoint `https://api.amazon.co.uk/auth/o2/token` with scope `creatorsapi::default` (v2.x credentials use the Cognito endpoint and `creatorsapi/default` — set `AMAZON_CREATORS_TOKEN_URL` accordingly).
- `POST https://creatorsapi.amazon/catalog/v1/getItems` with `Authorization: Bearer …` and `x-marketplace: www.amazon.in`, up to 10 ASINs per call, requesting title, primary image, `offersV2` price and availability.
- Eligibility: Amazon may require a minimum number of qualifying sales before granting API access. Check Associates Central.

Environment: `AMAZON_CREATORS_CREDENTIAL_ID`, `AMAZON_CREATORS_CREDENTIAL_SECRET`, `AMAZON_CREATORS_CREDENTIAL_VERSION`, `AMAZON_CREATORS_TOKEN_URL`, `AMAZON_CREATORS_API_BASE_URL`, `AMAZON_CREATORS_MARKETPLACE`, `AMAZON_PARTNER_TAG`.

**Activation checklist** (the API is new — verify the mapping with real credentials before relying on it):

1. Add the env vars and redeploy.
2. Admin → Merchants → Amazon → *Test API connection* (obtains a token).
3. On a listing, enter a real ASIN and click *Fetch from API*; confirm title/price/availability look right. If field names differ from the current Creators API docs, adjust `parseAmazonItems()` in `src/lib/affiliate/adapters/amazon-creators.ts` (it already accepts lowerCamelCase and PascalCase).
4. Tick *Use live data from the official API when saving* on listings, or rely on the daily cron.
5. Set the programme's API status to *active*.

Follow Amazon's rules on images (served from Amazon's URLs — the app renders merchant-API images unoptimized), pricing (refresh within 24h, show timestamp), and the exact disclosure: *"As an Amazon Associate I earn from qualifying purchases."*

## Flipkart (Flipkart Affiliate)

**Manual:** paste links generated in the Flipkart Affiliate dashboard (they include `affid=`); the adapter warns otherwise. Allowed domains include `flipkart.com`, `dl.flipkart.com` and `fkrt.it`.

**Affiliate API (optional):** headers `Fk-Affiliate-Id` / `Fk-Affiliate-Token`; product lookup `GET /affiliate/1.0/product.json?id=<productId>`; search `GET /affiliate/1.0/search.json?query=…&resultCount=…`. Fields are read from `productBaseInfoV1` (`productId`, `title`, `productUrl` (already tagged), `imageUrls`, `maximumRetailPrice`, `flipkartSpecialPrice`/`flipkartSellingPrice`, `inStock`). Set `FLIPKART_AFFILIATE_ID` and `FLIPKART_AFFILIATE_TOKEN`; use *Test API connection* to see a sample response. Respect Flipkart's rate limits and linking terms.

## Meesho

Admin-managed URLs from an approved Meesho programme or affiliate network. No public product API or feed is assumed (`supportsApi: false`). If your links use a network's tracking domain, add it to Meesho's allowed domains. If an official, authorised Meesho integration becomes available, implement `fetchProducts()` in `src/lib/affiliate/adapters/meesho.ts`.

## Adding another programme or network

1. Admin → Merchants → *Add merchant* (website, allowed domains, pricing rules, disclosure).
2. Add a programme with adapter **Generic** — manual links work immediately.
3. For an official API, create `src/lib/affiliate/adapters/<name>.ts` implementing `MerchantAdapter` (`checkUrls`, optional `fetchProducts`, `testConnection`), add its key to `ADAPTER_KEYS` and the `adapter_key` CHECK constraint (new migration), and register it in `registry.ts`. Sync, listing prefill and the admin UI pick it up automatically.

## Reporting (orders & commissions)

Click counts are engagement data, never sales. Enter programme-reported results in Admin → Analytics → *Partner-reported results*, or import a CSV:

```
merchant_slug,period_start,period_end,clicks,orders,items_shipped,revenue,commission
amazon,2026-10-01,2026-10-31,1200,35,33,52000,2100
```
