# Kartwise — multi-store affiliate product discovery platform (India)

A production-ready product discovery and comparison website for Indian shoppers. Visitors discover products, compare listings across Amazon, Flipkart, Meesho and other stores, read buying guides, keep a wishlist — and click **Buy Now** to purchase directly on the merchant's website through your approved affiliate links.

> **Business model:** Discover products → Explore deals → Click Buy Now → Visit the store → Purchase from the merchant.
> There is deliberately **no cashback, wallet, reward points, coins, referral earnings or withdrawals** anywhere in the codebase.

The brand name **Kartwise** is a placeholder. Change it in **Admin → Site settings** (it's stored in the database and used everywhere) and in `src/config/site.ts` (fallback). Check trademark availability before launch.

---

## Contents

1. [Tech stack](#tech-stack)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Database schema](#database-schema)
5. [Local development](#local-development)
6. [Environment variables](#environment-variables)
7. [Supabase configuration (hosted)](#supabase-configuration-hosted)
8. [Create the first admin](#create-the-first-admin)
9. [Affiliate setup: Amazon, Flipkart, Meesho & others](#affiliate-setup)
10. [Adding products and publishing blogs](#adding-products-and-publishing-blogs)
11. [SEO, AEO & GEO configuration](#seo-aeo--geo)
12. [Analytics](#analytics)
13. [Deployment (Vercel)](#deployment-vercel)
14. [Testing](#testing)
15. [Security & compliance notes](#security--compliance-notes)
16. [Troubleshooting](#troubleshooting)

More detail: [`docs/API.md`](docs/API.md) · [`docs/AFFILIATE_INTEGRATIONS.md`](docs/AFFILIATE_INTEGRATIONS.md) · [`docs/SEO_STRATEGY.md`](docs/SEO_STRATEGY.md)

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 16.4** (App Router, React 19, Turbopack, **Cache Components** + Partial Prefetching) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, shadcn-style primitives (`cva` + `tailwind-merge`), Lucide icons |
| Database | PostgreSQL on **Supabase** (migrations in `supabase/migrations`) |
| Auth | Supabase Auth (email/password, optional Google), `@supabase/ssr` cookies |
| Storage | Supabase Storage (`media` and `avatars` buckets) |
| Validation | Zod v4 on every Server Action and API route |
| Content | Markdown CMS rendered with `marked` + `sanitize-html` |
| Analytics | First-party click/view/search tracking + optional GA4 (consent-gated) |
| Tests | Vitest (unit), Playwright scripts (end-to-end & permissions) |
| Hosting | Vercel (cron for listing refresh) |

No heavy UI, chart or animation libraries — charts are lightweight CSS/SVG.

## Features

**Public site** — homepage (editable hero, categories, trending/featured products, stores, deals, comparisons, guides, newsletter), product listing with filters (category, store, price, sort) and pagination, product detail (gallery, overview, specs, pros/cons, who it suits, alternatives, multi-merchant comparison with one Buy button per store, FAQs, sources, related guides), categories & subcategories, deals (auto-hide on expiry, no countdowns), stores, side-by-side comparisons, search, blog (categories, authors, TOC, quick answers, FAQs, sources), and About / Contact / How it works / Affiliate disclosure / Privacy / Terms / Editorial policy pages. Mobile-first with bottom navigation and a sticky mobile buy bar.

**Accounts** — sign up, log in, Google login (optional), forgot/reset password, logout, profile & photo, email preferences, privacy (recently-viewed on/off), account deletion request. **Login is never required to browse or buy.**

**Wishlist** — works for guests (device storage) and members (database); guest items merge automatically after sign-in. Recently viewed products for members.

**Admin (`/admin`)** — role-based (admin / editor) dashboard with metrics and click trends; products (images, specs, alternatives, publishing checklist); affiliate listings (URL domain validation, programme-specific warnings, verified-price rules, link verification, optional official-API prefill); merchants & affiliate programmes (integration status, test connection, sync now); categories & brands (homepage ordering); deals; comparisons; blog CMS (Markdown editor with preview & image upload, SEO fields, FAQs, sources, tags, scheduling, revisions & restore, mandatory editorial review for AI-assisted drafts); banners & hero; users & roles (disable, delete, deletion requests); newsletter (CSV export); contact messages; analytics (clicks by merchant/product/placement, popular categories/posts/stores, search terms, partner-reported orders & commissions); site settings; audit log.

## Architecture

```
src/
  app/
    (site)/            Public site + account pages (shared header/footer layout)
    admin/             Admin panel (separate layout, server-side role gate)
    api/track/*        First-party click / view / search beacons (POST)
    api/cron/*         Scheduled listing refresh (CRON_SECRET protected)
    auth/callback      OAuth + email-link (PKCE / token_hash) completion
    sitemap.ts robots.ts manifest.ts opengraph-image.tsx icon.svg apple-icon.tsx
  components/          ui/ (primitives), product/, store/, deal/, category/, blog/,
                       home/, layout/, account/, auth/, admin/, shared/, providers/
  config/site.ts       Code-level defaults (brand fallback, nav)
  content/pages.ts     Copy for info/legal pages (brand injected from settings)
  lib/
    supabase/          Typed clients: public (cookie-less, cacheable), session, service
    data/              Cached public queries ('use cache' + cacheTag)
    actions/           Server Actions (public, account, admin/*)
    affiliate/         Adapter registry, URL checks, Amazon/Flipkart/Meesho/generic, sync
    seo/               Metadata builder + JSON-LD builders
    security/          Rate limiting, IP hashing, bot detection, upload validation
    validation/        Zod schemas + form helpers
  proxy.ts             (Next 16 "middleware") session refresh + /account,/admin gate
supabase/migrations    Schema, RLS & functions, storage buckets
supabase/seed.sql      Roles, settings, categories, merchants, programmes, banners, blog taxonomy
content/blog/*.md      10 editorial drafts (loaded by `npm run seed:content`)
scripts/               grant-admin, seed-content, seed-demo
tests/unit, tests/e2e  Vitest unit tests; Playwright acceptance & RLS scripts
```

**Rendering & caching.** Public data is read with a cookie-less Supabase client inside `'use cache'` functions tagged by entity (`products`, `blog`, `settings`…). Admin Server Actions call `updateTag()` so edits appear immediately. Session-dependent UI (header account menu, wishlist hearts) is client-side, so public pages prerender into a static shell; account/admin pages are request-time and gated in the server. The build succeeds even before Supabase is configured (public pages render empty states).

**Affiliate click flow.** Buy buttons are plain `<a href="{approved affiliate URL}" target="_blank" rel="sponsored nofollow noopener">`. On click, the browser sends a `navigator.sendBeacon` to `/api/track/click` (never blocking or redirecting), which validates the listing/offer/merchant, rate-limits, hashes the IP (salted, rotating daily), flags bots and stores the event. There is no redirect masking or URL shortening.

**Price rules.** A price is shown only if it has a verification timestamp, is within the merchant's maximum age, and — for merchants that forbid manual prices (Amazon by default) — came from the official API. Discounts are shown only when mathematically valid. The page never labels a store "lowest price".

## Database schema

All tables have Row Level Security. Key entities:

| Area | Tables |
| --- | --- |
| Users & roles | `profiles`, `roles`, `user_roles` |
| Catalogue | `brands`, `categories` (unlimited nesting), `products`, `product_images`, `product_specs`, `product_relations` |
| Affiliate | `merchants`, `affiliate_programs`, `product_listings`, `offers`, `affiliate_performance_reports` |
| Comparisons | `comparisons`, `comparison_items` |
| Members | `wishlists`, `wishlist_items`, `recently_viewed` |
| Analytics | `affiliate_click_events`, `content_views_daily`, `search_queries` |
| Blog | `blog_posts`, `blog_authors`, `blog_categories`, `blog_tags`, `blog_post_tags`, `blog_post_products`, `blog_revisions` |
| Site | `site_settings`, `banners`, `newsletter_subscribers`, `contact_messages`, `admin_audit_log`, `rate_limits` |
| Views | `v_listings` (adds `price_displayable`), `v_product_cards` |

Highlights: slugs validated by a domain type; category cycle prevention; `products.popularity_score` generated from real views/clicks; full-text `search_vector`; trigger-maintained counters; a CHECK constraint that **prevents AI-assisted posts from being published without a recorded editorial review**; listings cannot store a price without a verification timestamp. Staff analytics are exposed through `admin_*` SQL functions that verify the caller's role; tracking/rate-limit functions are callable only with the service role.

## Local development

Prerequisites: Node.js ≥ 20.12, Docker (for the local Supabase stack).

```bash
npm install
```

```bash
npx supabase start
```

Copy the API URL, publishable key and secret key printed by `supabase start` (or run `npx supabase status`) into `.env.local`:

```bash
cp .env.example .env.local
```

Apply migrations + seed, then load the editorial blog drafts:

```bash
npx supabase db reset
```

```bash
npm run seed:content
```

Start the app:

```bash
npm run dev
```

Open http://localhost:3000, sign up, then [grant yourself admin](#create-the-first-admin). Local emails (confirmations, password resets) appear in Mailpit at http://127.0.0.1:54324.

Optional — preview the product UI with clearly-labelled demo products (no prices, noindex, merchant search links). **Remove before launch:**

```bash
npm run seed:demo
```

```bash
npm run seed:demo -- --remove
```

Useful scripts: `npm run check` (typecheck + lint + unit tests), `npm run db:types` (regenerate DB types after schema changes).

## Environment variables

See [`.env.example`](.env.example) for the full annotated list.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site URL (canonicals, sitemap, OG, auth redirects) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Publishable/anon key (browser-safe; RLS enforced) |
| `SUPABASE_SECRET_KEY` | Yes | Secret/service-role key — **server only** (tracking, rate limits, newsletter/contact, user admin) |
| `IP_HASH_SALT` | Yes | Random 32+ char salt for privacy-preserving IP hashes |
| `CRON_SECRET` | Yes (prod) | Protects `/api/cron/refresh-listings` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | GA4 (loaded only after cookie consent) |
| `GOOGLE_SITE_VERIFICATION` | Optional | Search Console meta-tag token (or set it in Admin → Settings) |
| `AMAZON_CREATORS_*`, `AMAZON_PARTNER_TAG` | Optional | Amazon Creators API (price/availability refresh) |
| `FLIPKART_AFFILIATE_ID`, `FLIPKART_AFFILIATE_TOKEN` | Optional | Flipkart Affiliate API |
| `NEWSLETTER_PROVIDER` + provider keys | Optional | `none` (default) / `brevo` / `mailchimp` |
| `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED` | Optional | Show "Continue with Google" after enabling it in Supabase |

Never commit `.env.local`. Only `NEXT_PUBLIC_*` values reach the browser.

## Supabase configuration (hosted)

1. Create a project at supabase.com (choose the Mumbai region for Indian users).
2. Link and push the schema:

   ```bash
   npx supabase login
   ```

   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

   ```bash
   npx supabase db push --include-seed
   ```

   (Alternatively run the files in `supabase/migrations/` and then `supabase/seed.sql` in the SQL editor, in order.)
3. **Auth → URL configuration:** set *Site URL* to your domain and add `https://your-domain/auth/callback` (and `http://localhost:3000/**` for development) to *Redirect URLs*.
4. **Auth → Email:** configure custom SMTP for production email delivery; keep "Confirm email" enabled.
5. **Google login (optional):** enable the Google provider with your Google Cloud OAuth client, then set `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`.
6. Storage buckets (`media`, `avatars`) and their policies are created by the migrations.
7. Load the blog drafts against the hosted project (with the hosted URL/secret key in `.env.local`): `npm run seed:content`.

## Create the first admin

1. Sign up on the website with your email (confirm it if confirmations are on).
2. Run, with the project's URL and secret key in `.env.local`:

   ```bash
   npm run admin:grant -- you@example.com
   ```

3. Reload — **Admin dashboard** appears in your account menu (`/admin`).

Use `npm run admin:grant -- editor@example.com editor` for editors, or manage roles later in **Admin → Users & roles**. SQL alternative (Supabase SQL editor):

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from public.profiles where email = 'you@example.com';
```

## Affiliate setup

Amazon, Flipkart and Meesho are pre-configured as merchants with default programmes (status *approved*, API *not configured*). Everything works with **manual affiliate URLs**; APIs are optional add-ons. Full details: [`docs/AFFILIATE_INTEGRATIONS.md`](docs/AFFILIATE_INTEGRATIONS.md).

**Adding a listing (any store):** Admin → Products → open a product → *Add listing* → choose the merchant → paste the product page URL (destination) and your **affiliate URL** → optionally enter a price and tick "I verified this price just now" → Save. The URL host must be in the merchant's *allowed domains*; programme-specific warnings appear after saving.

- **Amazon India** — paste a SiteStripe link (`amzn.to/…`) or a product URL with your tag (`…?tag=yourtag-21`). Manually entered Amazon prices are stored but **never shown** (Amazon only allows API-sourced prices refreshed within 24 hours); shoppers see **Check Price**. To show prices, add Creators API credentials (`AMAZON_CREATORS_*`, `AMAZON_PARTNER_TAG`), click *Test API connection* on the Amazon merchant page, enter ASINs on listings and use *Fetch from API* / *Use live data from the official API*. The daily cron refreshes them. PA-API 5.0 is retired and not used.
- **Flipkart** — paste the affiliate link from your Flipkart Affiliate dashboard (contains `affid=`). Optional API: add `FLIPKART_AFFILIATE_ID` / `FLIPKART_AFFILIATE_TOKEN`, then use product ids on listings for automatic refresh.
- **Meesho** — paste the tracking link issued by your approved Meesho programme or network. If links come from a network (for example a network tracking domain), add that domain to Meesho's *allowed domains* first. No public Meesho API is assumed.
- **Other stores/networks** — Admin → Merchants → *Add merchant* (set allowed domains, pricing rules, disclosure), then add a programme (adapter: *Generic*). New API adapters plug into `src/lib/affiliate/registry.ts` without changing the rest of the app.
- **Store "Visit" links** — set a tagged homepage link in the merchant's *“Visit Store” affiliate link*.
- **Deals** — Admin → Deals → *Add offer*; publish only merchant-stated discounts, record when you verified them and set expiry dates.

## Adding products and publishing blogs

**Products:** Admin → Products → *Add product* → write an original short description, overview and key features → *Create draft*. Then add images (upload images you have rights to), specifications (with source URLs), merchant listings and optional alternatives. Set **Status → Published**. Publishing is blocked until the checklist passes (category, short description, 300+ characters of original editorial text, 3+ features or specs, an image, an active listing) — this prevents thin pages from being indexed. Use *Trending* only with an editorial reason.

**Blog:** the 10 seeded articles are **drafts marked AI-assisted**. For each: Admin → Blog posts → open → fact-check, add a featured image and any verified product picks the editor notes ask for → *Mark as editorially reviewed* → set **Status → Published** (or **Scheduled** with a future date) → Save. Every save creates a revision you can restore. Articles about current models/prices (e.g. earbuds under ₹2,000) intentionally contain no model list until you research and verify one.

## SEO, AEO & GEO

Implemented: server-rendered pages, unique titles/descriptions, canonicals, Open Graph/Twitter cards, XML sitemap (`/sitemap.xml`, indexable pages only), `robots.txt`, breadcrumbs, JSON-LD (Organization, WebSite + SearchAction, BreadcrumbList, Product/Offer/AggregateOffer only with verified prices, ItemList, Article, FAQPage only for visible FAQs — never ratings or reviews), `noindex` for search results and filter/sort combinations, image alt text, a default OG image, 301 redirects for common legacy paths and a custom 404. Configure defaults and Search Console verification in Admin → Site settings. Keyword map, content checklist and AEO/GEO guidance: [`docs/SEO_STRATEGY.md`](docs/SEO_STRATEGY.md).

## Analytics

- **First-party (always on, no cookies):** outbound clicks (source page, placement, merchant, product, UTM, device type, hashed IP, bot flag), content views (daily aggregates) and internal search terms → Admin → Analytics.
- **GA4 (optional):** set `NEXT_PUBLIC_GA_MEASUREMENT_ID`. GA loads only after the visitor accepts analytics cookies. Events: `affiliate_click`, `view_item`, `view_article`, `view_item_list`, `search`, `add_to_wishlist`, `sign_up`, `login`, `newsletter_signup`.
- **Clicks are not sales.** Orders/commissions come only from programme reports — enter them manually or import a CSV in Admin → Analytics → *Partner-reported results*.

## Deployment (Vercel)

1. Push the repository to GitHub and import it in Vercel (framework preset: Next.js).
2. Add the environment variables from the table above (Production + Preview). Set `NEXT_PUBLIC_SITE_URL` to the final domain.
3. Deploy, then add your custom domain.
4. In Supabase Auth, set the Site URL / redirect URLs to the production domain.
5. `vercel.json` schedules `/api/cron/refresh-listings` daily at 21:30 UTC (03:00 IST); Vercel sends `CRON_SECRET` automatically. On a Pro plan, increase the frequency (for example every 6 hours) so Amazon API prices stay within the 24-hour display window.
6. Submit `https://your-domain/sitemap.xml` in Google Search Console.

Other Node hosts work too (`npm run build && npm start`); trigger the cron URL with `Authorization: Bearer $CRON_SECRET`.

## Testing

| Command | What it does |
| --- | --- |
| `npm run typecheck` | Route type generation + `tsc --noEmit` |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm test` | Vitest unit tests (pricing/discount rules, URL/domain validation, Markdown sanitisation, adapter parsing, redirect safety, publishing checklist, upload sniffing) |
| `node tests/e2e/acceptance.mjs` | 33 end-to-end checks against a running app + local Supabase: admin signup & role grant, product creation, publishing checklist, image upload, listings (domain validation, Amazon price rule), public page price/discount/JSON-LD, Buy Now opens the affiliate URL & logs a click, guest wishlist & merge, logout/login, password reset via email, permissions, blog review & publishing, search/category/store/sitemap, mobile overflow |
| `node tests/e2e/rls.mjs` | 21 database-permission checks (cross-user access, privilege escalation, catalogue tampering, private tables, drafts) |

The e2e scripts need `playwright` with Chromium (`npm i -D playwright && npx playwright install chromium`) and set `TEST_IMAGE=/path/to/image.png` for the image-upload step.

## Security & compliance notes

- Roles are enforced in Postgres (RLS + `is_staff()`/`is_admin()`) and re-checked in every Server Action and admin page; client-side role info is used only to show/hide links.
- Secret keys are read only in `server-only` modules; client bundles contain only the publishable key.
- Rate limiting (DB-backed, works across serverless instances) on tracking, newsletter, contact and avatar uploads; Supabase Auth applies its own auth rate limits.
- Uploads: magic-byte sniffing, type allow-list (no SVG), size limits, storage policies.
- Markdown is sanitised; external links get `noopener`, merchant links get `rel="sponsored nofollow"`.
- Security headers: HSTS, `X-Frame-Options: DENY`, `nosniff`, referrer policy, permissions policy, CSP `frame-ancestors`/`object-src`/`base-uri`/`form-action`.
- IP addresses are never stored raw (salted hash, rotating daily); search terms that look like emails/phone numbers are discarded.
- Disclosures: short disclosure near buttons, merchant-specific statements (the exact Amazon Associates sentence), footer disclosure and a full disclosure page. No cashback/reward claims, no fake urgency, no invented prices/ratings.
- **Legal pages** (`src/content/pages.ts`) are careful starting points written for India (DPDP Act aware) — have them reviewed by a lawyer before launch.

## Troubleshooting

- **Images 400 locally with `npm start`:** Next 16 blocks private-IP images; this project allows them only when `NEXT_PUBLIC_SUPABASE_URL` is a local address.
- **"SUPABASE_SECRET_KEY is not set" banner in admin:** clicks, newsletter, contact and user management need the server secret key.
- **Amazon shows "Check Price" even with a price entered:** expected — enable the Creators API for displayable Amazon prices.
- **Edits not visible publicly:** admin actions expire caches immediately; content listings otherwise refresh within 10 minutes (catalogue) or 1 hour (editorial).
- **Can't publish an article:** AI-assisted drafts need *Mark as editorially reviewed*; articles also need 300+ words and an excerpt or meta description.
