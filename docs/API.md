# API reference

The app uses three kinds of server entry points:

1. **Route Handlers** (HTTP endpoints) — tracking beacons, cron, auth callback, CSV export.
2. **Server Actions** — all form submissions (public, account and admin).
3. **Supabase** — PostgREST tables/views protected by RLS, plus SQL functions.

All inputs are validated with Zod (`src/lib/validation/schemas.ts`).

## Route Handlers

### `POST /api/track/click`
Records an outbound affiliate click. Sent with `navigator.sendBeacon` from `AffiliateButton`; the browser has already navigated to the merchant, so this endpoint never redirects.

```json
{
  "listingId": "uuid?",
  "offerId": "uuid?",
  "merchantId": "uuid?",
  "sourcePath": "/products/slug",
  "sourceComponent": "product_buy_box",
  "anonId": "random local id",
  "referrer": "https://…",
  "utm": { "source": "…", "medium": "…", "campaign": "…", "term": "…", "content": "…" }
}
```

One of `listingId`, `offerId` or `merchantId` is required. The server resolves the product/merchant from the database (client values are never trusted), checks the item is active, rate-limits to 60 clicks/minute per hashed IP, flags likely bots (`is_suspected_bot`, excluded from stats) and stores the event. Always responds `204`.

`sourceComponent` values used by the UI: `product_buy_box`, `product_page`, `sticky_buy_bar`, `product_card`, `product_listing`, `search_results`, `home_products`, `related_products`, `alternatives`, `recently_viewed`, `wishlist`, `blog_products`, `comparison_table`, `deal_card`, `store_card`, `store_page`.

### `POST /api/track/view`
`{ "type": "home|product|category|store|blog_post|comparison|deals", "id": "uuid?" }` — increments the daily view aggregate (and product/post view counters). Bots skipped, 120/min per hashed IP, entity existence verified. `204`.

### `POST /api/track/search`
`{ "q": "earbuds", "results": 12 }` — logs internal search terms (strings that look like emails or phone numbers are discarded). 30/min per hashed IP. `204`.

### `GET /api/cron/refresh-listings`
Header `Authorization: Bearer $CRON_SECRET` (timing-safe comparison). Refreshes listing prices/availability from **official** merchant APIs that are configured and approved, then expires the product cache. Response:

```json
{ "ok": true, "ranAt": "…", "reports": [{ "merchant": "Amazon", "adapter": "Amazon Creators API", "status": "skipped|success|partial|error", "message": "…", "updated": 0, "missing": 0 }] }
```

`401` without/with a wrong secret.

### `GET /auth/callback`
Completes OAuth (`?code=`) and email links (`?token_hash=&type=`), then redirects to a validated internal `next` path (open-redirect safe). Recovery links land on `/reset-password`.

### `GET /admin/newsletter/export`
Admins only. CSV of currently subscribed emails with consent text/time/source and unsubscribe token (cells are protected against spreadsheet formula injection).

## Server Actions

| Module | Actions |
| --- | --- |
| `lib/actions/public.ts` | `subscribeToNewsletter`, `unsubscribeFromNewsletter`, `submitContactMessage` (rate-limited, honeypot) |
| `lib/actions/account.ts` | `fetchProductCards`, `updateProfile`, `uploadAvatar`, `removeAvatar`, `requestAccountDeletion`, `cancelAccountDeletion`, `clearRecentlyViewed` |
| `lib/actions/admin/products.ts` | `saveProduct` (publishing checklist), `deleteProduct`, `addProductImage`, `updateProductImage`, `deleteProductImage`, `saveProductSpecs`, `saveProductRelations` |
| `lib/actions/admin/listings.ts` | `saveListing` (domain validation, price-verification rules, optional official-API data), `deleteListing`, `verifyListingUrl`, `lookupListingFromApi` |
| `lib/actions/admin/merchants.ts` | `saveMerchant`, `deleteMerchant`, `saveProgram`, `deleteProgram`, `testProgramConnection`, `syncMerchantNow` (admin only) |
| `lib/actions/admin/catalog.ts` | categories, home ordering, brands, offers, comparisons, banners |
| `lib/actions/admin/blog.ts` | `savePost` (review gate, scheduling, revisions), `setPostReviewed`, `restoreRevision`, `deletePost`, authors, blog categories & tags |
| `lib/actions/admin/system.ts` | `saveSettings`, `setUserRole`, `setUserStatus` (also bans in Supabase Auth), `deleteUserAccount`, messages, subscribers, partner reports (`saveReport`, `importReportsCsv`, `deleteReport`) |
| `lib/actions/admin/media.ts` | `uploadMedia`, `previewMarkdown` |

Every admin action calls `assertStaff()` or `assertAdmin()` (server-side role check from the database), writes an audit entry for important changes and expires the relevant cache tags with `updateTag()`.

Action results use a common shape:

```ts
type ActionResult = { ok: boolean; message?: string; fieldErrors?: Record<string, string[]>; warnings?: string[]; redirectTo?: string };
```

## Supabase SQL functions

| Function | Who can call | Purpose |
| --- | --- | --- |
| `has_role(role)`, `is_admin()`, `is_staff()` | anyone (returns false for anon) | Role checks used in RLS policies |
| `check_rate_limit(key, max, window_seconds)` | service role | Fixed-window rate limiter |
| `track_content_view(type, id)` | service role | Daily view aggregation |
| `admin_overview_stats()` | staff | Dashboard counts |
| `admin_click_trend(days)` | staff | Daily outbound clicks (IST days) |
| `admin_clicks_by_merchant(days)` / `admin_clicks_by_source(days)` | staff | Click breakdowns |
| `admin_top_clicked_products(days, limit)` | staff | Most-clicked products |
| `admin_top_search_terms(days, limit)` | staff | Internal search terms |
| `admin_popular_content(type, days, limit)` | staff | Most-viewed categories/posts/products/stores |

Public read access is via RLS on tables plus the `v_listings` and `v_product_cards` views (both `security_invoker`, so RLS applies).
