import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/clients";
import { siteConfig } from "@/config/site";
import type { Banner, SiteSettings } from "./types";

export const CACHE_TAGS = {
  settings: "settings",
  banners: "banners",
  categories: "categories",
  merchants: "merchants",
  products: "products",
  offers: "offers",
  comparisons: "comparisons",
  blog: "blog",
} as const;

export const defaultSiteSettings: SiteSettings = {
  brandName: siteConfig.defaultBrandName,
  tagline: siteConfig.defaultTagline,
  logoUrl: null,
  faviconUrl: null,
  footerAbout:
    "We help shoppers in India discover products, compare listings across popular online stores and read practical buying guides. You always check out on the merchant's website.",
  socialLinks: {},
  contactEmail: null,
  contactPhone: null,
  contactAddress: null,
  seoDefaultTitle: `${siteConfig.defaultBrandName} — Discover products & compare online shopping options in India`,
  seoTitleTemplate: `%s | ${siteConfig.defaultBrandName}`,
  seoDefaultDescription: siteConfig.defaultDescription,
  defaultOgImageUrl: null,
  affiliateDisclosureShort: siteConfig.defaultAffiliateDisclosure,
  affiliateDisclosureContent: null,
  amazonAssociateStatement: siteConfig.amazonAssociateStatement,
  newsletterEnabled: true,
  newsletterHeading: "Smarter shopping, in your inbox",
  newsletterSubheading: "Occasional buying guides and curated product picks. Unsubscribe any time.",
  newsletterConsentText:
    "I agree to receive the newsletter by email. I can unsubscribe at any time using the link in every email.",
  announcementText: null,
  announcementUrl: null,
  googleSiteVerification: null,
};

function asStringRecord(value: unknown): Partial<Record<string, string>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Partial<Record<string, string>> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === "string" && /^https:\/\//i.test(v)) out[k] = v;
  }
  return out;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(CACHE_TAGS.settings);
  cacheLife("content");

  const db = createPublicClient();
  if (!db) return defaultSiteSettings;
  const { data, error } = await db.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(`Failed to load site settings: ${error.message}`);
  if (!data) return defaultSiteSettings;

  const d = defaultSiteSettings;
  return {
    brandName: data.brand_name || d.brandName,
    tagline: data.tagline || d.tagline,
    logoUrl: data.logo_url,
    faviconUrl: data.favicon_url,
    footerAbout: data.footer_about || d.footerAbout,
    socialLinks: asStringRecord(data.social_links),
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    contactAddress: data.contact_address,
    seoDefaultTitle: data.seo_default_title || d.seoDefaultTitle,
    seoTitleTemplate: data.seo_title_template || `%s | ${data.brand_name || d.brandName}`,
    seoDefaultDescription: data.seo_default_description || d.seoDefaultDescription,
    defaultOgImageUrl: data.default_og_image_url,
    affiliateDisclosureShort: data.affiliate_disclosure_short || d.affiliateDisclosureShort,
    affiliateDisclosureContent: data.affiliate_disclosure_content,
    amazonAssociateStatement: data.amazon_associate_statement || d.amazonAssociateStatement,
    newsletterEnabled: data.newsletter_enabled,
    newsletterHeading: data.newsletter_heading || d.newsletterHeading,
    newsletterSubheading: data.newsletter_subheading || d.newsletterSubheading,
    newsletterConsentText: data.newsletter_consent_text || d.newsletterConsentText,
    announcementText: data.announcement_text,
    announcementUrl: data.announcement_url,
    googleSiteVerification: data.google_site_verification,
  };
}

export async function getBanners(placement: "home_hero" | "home_promo" | "deals_top"): Promise<Banner[]> {
  "use cache";
  cacheTag(CACHE_TAGS.banners);
  cacheLife("catalog");

  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("banners")
    .select("*")
    .eq("placement", placement)
    .eq("is_active", true)
    .order("sort_order")
    .limit(6);
  if (error) throw new Error(`Failed to load banners: ${error.message}`);
  return (data ?? []).map((b) => ({
    id: b.id,
    placement: b.placement,
    eyebrow: b.eyebrow,
    title: b.title,
    subtitle: b.subtitle,
    ctaLabel: b.cta_label,
    ctaUrl: b.cta_url,
    secondaryCtaLabel: b.secondary_cta_label,
    secondaryCtaUrl: b.secondary_cta_url,
    imageUrl: b.image_url,
    imageAlt: b.image_alt,
    theme: b.theme as Banner["theme"],
  }));
}
