# SEO, AEO & GEO strategy

Target: shoppers in India, English (content model is ready for Hindi later — slugs, titles and copy are per-entity fields, so a `locale` column and `/hi/` routes can be added without restructuring).

## Technical SEO (implemented)

| Item | Where |
| --- | --- |
| Server-rendered/prerendered pages | Cache Components static shells; public data in `'use cache'` functions |
| Unique titles & meta descriptions | `buildMetadata()` (`src/lib/seo/metadata.ts`); per-entity SEO fields in admin |
| Canonicals | Every page; filtered/sorted/paginated variants canonicalise or are `noindex,follow` |
| Robots | `src/app/robots.ts` disallows admin/account/api/auth/search/wishlist |
| XML sitemap | `src/app/sitemap.ts` — only indexable, published, non-noindex pages |
| Open Graph / Twitter | `buildMetadata()` + default `/opengraph-image` |
| Breadcrumbs | Visible + `BreadcrumbList` JSON-LD on all deep pages |
| Structured data | Organization, WebSite + SearchAction, Product (+ Offer/AggregateOffer only with verified prices), ItemList, Article, FAQPage (visible FAQs only), author Person/Organization |
| Internal search | `/search` is `noindex,follow` |
| Thin content guard | Products can't be published without the content checklist; comparisons need 2+ products; articles need 300+ words |
| Images | `next/image` (AVIF/WebP, responsive sizes, lazy by default), required alt text |
| Redirects & 404 | `next.config.ts` redirects, custom `not-found.tsx` |
| Search Console | `GOOGLE_SITE_VERIFICATION` env or Admin → Settings |
| Performance | Static shells, no heavy client libraries, font `display: swap`, sendBeacon tracking |

Never emitted: ratings, reviews, `aggregateRating`, invented prices or availability. FAQ rich results are not promised — FAQ markup is only added where the FAQ is visible.

## Keyword map

Use natural language; don't put every keyword on every page.

| Keyword (intent) | Target page |
| --- | --- |
| best online shopping deals in India; online shopping offers India; best shopping deals today | `/deals` (+ homepage deals section) |
| best product deals online; trending products online India; best products to buy online | Homepage `/`, `/products` |
| compare product prices online; best online product comparison website | `/blog/compare-product-prices-amazon-flipkart-meesho`, `/compare` |
| Amazon deals India / Flipkart deals India / Meesho product deals | `/stores/amazon`, `/stores/flipkart`, `/stores/meesho`, `/deals?store=…` (noindex filter — link to store pages instead) |
| affordable products online India; best online shopping websites for affordable products | `/stores/meesho`, `/blog/amazon-vs-flipkart-vs-meesho-what-to-compare` |
| best smartphones under 15000 in India; best smartphones under 20000 | `/categories/smartphones`, `/blog/budget-smartphones-what-to-look-for`, future comparisons "Smartphones under ₹15,000/₹20,000" |
| best earbuds under 2000; best budget wireless earbuds India | `/blog/best-wireless-earbuds-under-2000`, `/categories/headphones-earbuds`, future comparison |
| best Bluetooth headphones under 3000 | `/categories/headphones-earbuds` + future guide |
| best laptop for students in India; best laptops under 50000; best budget electronics for students | `/blog/best-laptop-for-students-india`, `/categories/laptops`, future comparison "Laptops under ₹50,000" |
| best smartwatches under 3000 | `/categories/smartwatches` + future guide |
| best kitchen appliances under 2000; best products for home and kitchen; best home decor products online | `/blog/useful-home-kitchen-products-everyday`, `/categories/home-kitchen`, `/categories/kitchen-appliances`, `/categories/home-decor` |
| best useful gadgets under 1000; best affordable gadgets to buy online | `/blog/budget-gadgets-worth-exploring`, `/categories/electronics` |
| what to check before buying products online | `/blog/things-to-check-before-buying-online` |
| how to find genuine discounts during online sales | `/blog/genuine-online-deals-avoid-fake-discounts` |
| Amazon vs Flipkart which is better for buying electronics | `/blog/amazon-vs-flipkart-vs-meesho-what-to-compare` |
| how to compare Amazon and Flipkart prices | `/blog/compare-product-prices-amazon-flipkart-meesho` |
| how affiliate websites work | `/blog/how-affiliate-shopping-websites-work`, `/how-it-works` |

Map each keyword to one primary URL to avoid cannibalisation. Do not create near-duplicate location or "best X in [city]" pages.

## AEO (answer engines) — built into the CMS

- **Quick answer** field on articles: a stand-alone 2–4 sentence answer shown at the top.
- Question-style H2/H3 headings feed the automatic table of contents.
- Comparison tables, step-by-step lists and checklists render cleanly (tables scroll on mobile).
- FAQs per product, category, comparison and article.
- Author, published and updated dates shown on every article; author pages with expertise.
- **Sources & references** on products and articles.

## GEO (generative engines)

- Consistent product names, model numbers and category names (single source of truth in the database).
- Specifications attributed with source URLs; manufacturer claims labelled as claims.
- Original analysis fields (advantages, limitations, who it suits / who should look elsewhere).
- Transparent affiliate disclosure and editorial policy pages linked from every article.
- Clean semantic HTML, logical hierarchy (home → category → subcategory → product), and accurate structured data. No fake authority signals, reviews or entity claims.

## Content checklist (per article)

- [ ] Primary + secondary keyword, search intent set in the CMS
- [ ] SEO title ≤ 60 chars, meta description ≤ 155 chars
- [ ] Quick answer written
- [ ] H2/H3 structure (TOC appears from 3+ headings)
- [ ] Featured image you own/licensed, with alt text
- [ ] FAQs (3–5 real questions)
- [ ] Sources verified and linked
- [ ] Internal links to categories, products and related guides
- [ ] Time-sensitive facts (models, prices) verified or removed
- [ ] Editorial review recorded before publishing
