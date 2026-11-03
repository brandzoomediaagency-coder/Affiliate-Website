/**
 * Copy for informational pages. `{{brand}}`, `{{email}}` and `{{amazon}}`
 * are replaced at render time with values from Admin > Settings.
 *
 * IMPORTANT: Privacy Policy and Terms are carefully drafted starting points
 * for an Indian affiliate website. Have them reviewed by a qualified legal
 * professional before launch.
 */
export const PAGES_LAST_UPDATED = "2026-11-03";

export const pageContent = {
  about: {
    title: "About {{brand}}",
    description: "{{brand}} is an independent product discovery and comparison website for shoppers in India.",
    body: `## Why we exist

Shopping online in India means choosing between many stores, sellers and near-identical listings. {{brand}} helps you **discover products, understand what matters before you buy and see where a product is available** — then you buy directly from the store you trust.

## What we do

- **Product discovery.** We organise products into clear categories with plain-English descriptions, key specifications, advantages and limitations.
- **Store comparison.** Where a product is listed on more than one store, we show each listing with its own button. When we can verify a price, we show it together with the time it was last checked.
- **Buying guides.** Our articles explain what to check before you buy — specifications, warranty, returns and how to recognise a genuine deal.
- **Wishlists.** Save products on your device, or create a free account to keep your wishlist across devices.

## What we don't do

- We **don't sell products** or take payments. Checkout, delivery, returns and customer support are handled by the merchant.
- We **don't offer cashback, reward points, coins, wallets or referral earnings.**
- We **don't publish fake reviews, ratings or countdown timers.**

## How we are funded

Some links on {{brand}} are affiliate links. If you buy through them, we may earn a commission from the merchant at no extra cost to you. Read our [affiliate disclosure](/affiliate-disclosure) and [editorial policy](/editorial-policy) to learn how we keep recommendations independent.

## Get in touch

Questions, corrections or partnership enquiries? [Contact us](/contact).`,
  },

  howItWorks: {
    title: "How {{brand}} works",
    description: "Discover products, compare store listings and buy directly from the merchant — here's how it works.",
    body: `## In short

**Discover products → Explore deals → Click Buy Now → Visit the store → Purchase from the merchant.**

## 1. Discover

Search for a product or browse categories. Each product page brings together an overview, key features, specifications (with sources where available), advantages, limitations and who the product suits.

## 2. Compare store listings

If a product is available on several stores — for example Amazon, Flipkart or Meesho — you'll see each listing separately with its own **Buy Now** or **Check Price** button.

- We show a price **only when we can verify it**, together with when it was last checked.
- We never claim one store is "cheapest" unless the data is current and comparable — and even then, check delivery fees, seller, warranty and return policy on the store.

## 3. Save to your wishlist

Tap the heart icon to save a product. Without an account, your wishlist is stored on this device. Create a free account to keep it across devices — anything you saved as a guest is merged automatically when you sign in.

## 4. Buy on the store's website

When you click **Buy Now**, the merchant's website opens in a new tab. You complete your purchase there. The merchant is responsible for payment, delivery, returns, refunds, warranty and customer support.

## Do I need an account?

No. You can browse, compare and buy without signing in. An account simply lets you sync your wishlist and recently viewed products.

## Is there any cashback or reward?

No. {{brand}} does not offer cashback, reward points, coins, wallets or referral earnings. We may earn an affiliate commission from the merchant when you buy through our links — this never increases the price you pay.`,
  },

  affiliateDisclosure: {
    title: "Affiliate disclosure",
    description: "How {{brand}} earns money through affiliate links, and what that means for you.",
    body: "", // Rendered from Admin > Settings (affiliate_disclosure_content).
  },

  editorialPolicy: {
    title: "Editorial policy",
    description: "How {{brand}} selects products, researches information, handles pricing and keeps content accurate and independent.",
    body: `## Our principles

1. **Usefulness first.** Every page should help a shopper make a better decision — not just collect clicks.
2. **Independence.** Affiliate relationships never decide which products we cover or what we say about them. We include products from stores we don't earn from when they are the better choice.
3. **Accuracy and attribution.** Specifications come from manufacturers, official listings or other credible sources, and we cite sources where it matters.
4. **Transparency.** We clearly disclose affiliate links and show when content was published and last updated.

## How we choose products

We consider usefulness for the category, availability from reputable stores in India, the clarity of manufacturer information, warranty and service support, and genuine differences between options. Being available through an affiliate programme is not a selection criterion.

## Specifications and claims

- We do not invent specifications, test results or performance figures.
- When a figure is a manufacturer claim (for example battery life), we say so.
- Where information is unavailable or unverified, we say that rather than guessing.

## Prices, discounts and deals

- Prices are shown only when verified, with the date and time they were last checked. Some programmes (such as Amazon Associates) require prices to come from their official data feed and to be refreshed frequently; where that isn't possible, we show a **Check Price** button instead.
- A discount is shown only when it can be calculated from verified prices or is stated by the merchant.
- We never use fake countdown timers or artificial urgency, and expired offers are removed automatically.

## Reviews and ratings

We do not publish fabricated reviews, star ratings or "aggregate ratings", and we do not copy customer reviews from other websites and present them as our own.

## Use of AI tools

Some drafts may be prepared with the help of AI writing tools. Every article is reviewed, fact-checked and edited by a person before publication, and AI-assisted drafts cannot be published without a recorded editorial review.

## Corrections and updates

We review important guides regularly and update them when products, prices or policies change. If you spot an error, please [contact us](/contact) — we correct factual mistakes promptly and note significant updates.`,
  },

  privacyPolicy: {
    title: "Privacy policy",
    description: "How {{brand}} collects, uses and protects your personal data.",
    body: `This policy explains how {{brand}} ("we", "us") handles personal data when you use our website. We aim to collect as little personal data as possible, in line with India's Digital Personal Data Protection Act, 2023 and other applicable laws.

## Data we collect

**When you browse (no account needed)**
- *First-party analytics:* the page you viewed, which product or store link you clicked, device type (mobile/tablet/desktop), referring website domain and campaign (UTM) parameters. We store a **one-way, salted hash** of your IP address that rotates daily — we never store your raw IP address. These analytics do not use cookies.
- *Your device:* your guest wishlist, recently viewed products and cookie preferences are stored in your browser's local storage and never leave your device unless you sign in.

**When you create an account**
- Email address, optional name and profile photo, your wishlist, recently viewed products (you can switch this off), and your preferences. Passwords are handled by our authentication provider and are never visible to us.

**When you subscribe to the newsletter**
- Your email address, the consent wording you agreed to, and the date/time and page of consent.

**When you contact us**
- Your name, email address and message.

## Cookies {#cookies}

- **Essential cookies** keep you signed in and secure. They are required for accounts to work.
- **Analytics cookies (optional).** With your permission we use Google Analytics 4 to understand how the website is used. Google Analytics is only loaded after you click "Accept analytics". You can change your choice at any time using **Cookie preferences** in the footer.
- **Merchant and affiliate cookies.** When you click through to a store, that merchant or affiliate network may set its own cookies to attribute your purchase. Those cookies are governed by the merchant's or network's own privacy policy.

## How we use data

To provide and secure the website and your account, sync your wishlist, send the newsletter you asked for, respond to your messages, prevent abuse (for example rate-limiting), and understand which pages and products are useful. We do **not** sell your personal data.

## Service providers

We use trusted providers to run the website, including our hosting provider, our database and authentication provider (Supabase), Google Analytics (only with your consent), and an email service provider for the newsletter (if configured). They process data on our behalf under appropriate agreements.

## Retention

- Account data: until you delete your account.
- Newsletter: until you unsubscribe (we keep a record of the unsubscribe).
- Contact messages: up to 24 months.
- Click and view analytics: aggregated or pseudonymised; detailed events are kept for up to 24 months.

## Your rights

You can access, correct or delete your personal data, withdraw consent and raise a grievance. You can update your profile and preferences, and request account deletion, from your [account settings](/account/profile). To make any other request, [contact us](/contact) or email {{email}}.

## Children

The website is intended for users aged 18 or over. We do not knowingly collect personal data from children.

## Security

We use encryption in transit (HTTPS), row-level database access controls, hashed identifiers and role-based access for staff. No system is perfectly secure, but we work to protect your data and will notify you as required by law if a breach affects you.

## Changes

We may update this policy. Material changes will be highlighted on this page with a new "last updated" date.`,
  },

  terms: {
    title: "Terms and conditions",
    description: "The terms that apply when you use {{brand}}.",
    body: `By using {{brand}} you agree to these terms. If you do not agree, please do not use the website.

## What {{brand}} is

{{brand}} is a product discovery and comparison website. **We do not sell products, accept payments or fulfil orders.** When you click a store link, you leave our website and any purchase is a contract between you and that merchant, under the merchant's own terms.

## Information on the website

We work to keep product information accurate, but specifications, prices, offers and availability can change at any time and may contain errors. Prices are shown with the time they were last checked. **The price and terms shown on the merchant's website at the time of purchase apply.** Please verify details on the merchant's website before buying.

## Affiliate links

Some links are affiliate links and we may earn a commission from qualifying purchases. This does not change the price you pay. See our [affiliate disclosure](/affiliate-disclosure). {{brand}} does not offer cashback, rewards, coins or wallet balances.

## Accounts

You are responsible for keeping your login credentials secure and for activity on your account. You may delete your account at any time. We may suspend accounts that misuse the website.

## Acceptable use

You agree not to: scrape or copy the website in bulk; attempt to access other users' data or our systems without permission; interfere with the website's security or performance; generate fake clicks or traffic; or use the website for any unlawful purpose.

## Intellectual property

Our original text, design and editorial content belong to {{brand}}. Product names, brands, logos and store names belong to their respective owners and are used only to identify products and where they are available.

## Third-party websites

Links to merchants and other websites are provided for convenience. We are not responsible for their content, products, services, policies or practices.

## Disclaimer and limitation of liability

The website is provided "as is". To the extent permitted by law, we are not liable for any loss arising from your use of the website or from purchases made on third-party websites. Nothing in these terms limits rights you have under applicable consumer protection law.

## Governing law

These terms are governed by the laws of India. Courts in India shall have jurisdiction.

## Changes

We may update these terms from time to time. Continued use of the website after changes means you accept the updated terms.

## Contact

Questions about these terms? [Contact us](/contact).`,
  },
} as const;

export function fillTemplate(text: string, vars: { brand: string; email: string | null; amazon: string }) {
  return text
    .replace(/\{\{brand\}\}/g, vars.brand)
    .replace(/\{\{email\}\}/g, vars.email ?? "the address on our contact page")
    .replace(/\{\{amazon\}\}/g, vars.amazon)
    .replace(/ \{#cookies\}/g, "");
}
