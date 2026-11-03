/**
 * Central, code-level site configuration.
 *
 * The brand name and most copy are ALSO editable from Admin > Settings
 * (stored in the `site_settings` table). Values here are fallbacks used when
 * the database is unavailable and for things that are not admin-editable.
 * Components must read the brand via `getSiteSettings()` rather than
 * hardcoding it.
 */
export const siteConfig = {
  defaultBrandName: "Kartwise",
  defaultTagline: "Discover better products. Shop smarter.",
  defaultDescription:
    "Discover trending products, compare listings from Amazon, Flipkart, Meesho and more, and read practical buying guides before you shop online in India.",
  locale: "en_IN",
  language: "en-IN",
  country: "IN",
  currency: "INR",
  timeZone: "Asia/Kolkata",
  amazonAssociateStatement: "As an Amazon Associate I earn from qualifying purchases.",
  defaultAffiliateDisclosure:
    "Some links on this page are affiliate links. If you buy through them we may earn a commission at no extra cost to you. You complete your purchase on the merchant's website.",
  priceDisclaimer:
    "Prices and availability are accurate as of the date and time shown and are subject to change. The price and availability displayed on the merchant's website at the time of purchase will apply.",
  productsPerPage: 24,
} as const;

export const mainNav = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/deals", label: "Deals" },
  { href: "/stores", label: "Stores" },
  { href: "/blog", label: "Blog" },
] as const;

export const footerNav = {
  company: [
    { href: "/about", label: "About Us" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/contact", label: "Contact" },
    { href: "/blog", label: "Blog" },
  ],
  legal: [
    { href: "/affiliate-disclosure", label: "Affiliate Disclosure" },
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-and-conditions", label: "Terms & Conditions" },
    { href: "/editorial-policy", label: "Editorial Policy" },
  ],
  explore: [
    { href: "/products", label: "All Products" },
    { href: "/categories", label: "Categories" },
    { href: "/deals", label: "Deals & Offers" },
    { href: "/compare", label: "Comparisons" },
    { href: "/stores", label: "Stores" },
  ],
} as const;

export const socialPlatforms = [
  "facebook",
  "instagram",
  "x",
  "youtube",
  "linkedin",
  "pinterest",
  "whatsapp",
] as const;
export type SocialPlatform = (typeof socialPlatforms)[number];
