import { z } from "zod";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slug = z
  .string()
  .trim()
  .min(2, "Slug is required")
  .max(120)
  .regex(SLUG_RE, "Use lowercase letters, numbers and single hyphens only");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximum ${max} characters`)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null));

const optionalHttpsUrl = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https:\/\/[^\s]+$/i.test(v), "Must be an https:// URL");

const optionalUrl = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https?:\/\/[^\s]+$/i.test(v), "Must be an http(s) URL");

/** Internal path (/deals) or https URL — used for banner CTAs. */
const optionalLink = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\/(?!\/)[^\s]*$/.test(v) || /^https:\/\/[^\s]+$/i.test(v), "Use a site path like /deals or an https:// URL");

const optionalUuid = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || z.uuid().safeParse(v).success, "Invalid selection");

export const faqSchema = z.object({
  question: z.string().trim().min(5, "Question is too short").max(300),
  answer: z.string().trim().min(5, "Answer is too short").max(2000),
});
export const faqsSchema = z.array(faqSchema).max(30);

export const sourceSchema = z.object({
  title: z.string().trim().min(2).max(200),
  url: z.string().trim().regex(/^https?:\/\/[^\s]+$/i, "Source URL must be http(s)"),
  note: z.string().trim().max(300).optional().default(""),
});
export const sourcesSchema = z.array(sourceSchema).max(40);

export const specSchema = z.object({
  group_name: z.string().trim().max(80).optional().default("General").transform((v) => v || "General"),
  label: z.string().trim().min(1, "Spec label is required").max(120),
  value: z.string().trim().min(1, "Spec value is required").max(500),
  source_url: optionalUrl,
});
export const specsSchema = z.array(specSchema).max(200);

const textList = (maxItems: number, maxLen: number) => z.array(z.string().trim().min(1).max(maxLen)).max(maxItems);

export const productStatus = z.enum(["draft", "published", "archived"]);

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(200),
    slug,
    brand_id: optionalUuid,
    category_id: optionalUuid,
    model_number: optionalText(120),
    short_description: optionalText(320),
    overview: optionalText(5000),
    description: optionalText(30000),
    key_features: textList(30, 300),
    pros: textList(20, 300),
    cons: textList(20, 300),
    best_for: optionalText(2000),
    not_ideal_for: optionalText(2000),
    buying_considerations: optionalText(10000),
    faqs: faqsSchema,
    sources: sourcesSchema,
    search_keywords: optionalText(500),
    seo_title: optionalText(120),
    meta_description: optionalText(320),
    canonical_url: optionalHttpsUrl,
    status: productStatus,
    is_featured: z.boolean(),
    is_trending: z.boolean(),
    trending_reason: optionalText(200),
    noindex: z.boolean(),
  })
  .refine((v) => !v.is_trending || Boolean(v.trending_reason), {
    path: ["trending_reason"],
    message: "Add an editorial reason before marking a product as trending",
  });
export type ProductInput = z.infer<typeof productSchema>;

const priceField = z
  .number()
  .nullable()
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v < 100_000_000), "Enter a valid price in rupees");

export const listingSchema = z
  .object({
    product_id: z.uuid(),
    merchant_id: z.uuid("Choose a merchant"),
    program_id: optionalUuid,
    variant_label: z.string().trim().max(120).default(""),
    destination_url: z.string().trim().min(10, "Destination URL is required").max(2048),
    affiliate_url: z.string().trim().min(10, "Affiliate URL is required").max(2048),
    merchant_product_id: optionalText(120),
    current_price: priceField,
    previous_price: priceField,
    previous_price_type: z.enum(["mrp", "list_price", "was_price"]),
    availability: z.enum(["in_stock", "out_of_stock", "limited_stock", "preorder", "unknown"]),
    coupon_code: optionalText(60),
    offer_details: optionalText(500),
    offer_expires_at: z.string().nullable(),
    price_checked_at: z.string().nullable(),
    is_active: z.boolean(),
    sort_order: z.number().int().min(0).max(10000),
    internal_notes: optionalText(2000),
  })
  .refine((v) => v.current_price === null || v.price_checked_at !== null, {
    path: ["price_checked_at"],
    message: "Record when you verified the price (required whenever a price is entered)",
  });
export type ListingInput = z.infer<typeof listingSchema>;

export const merchantSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug,
  short_description: optionalText(300),
  description: optionalText(20000),
  website_url: z.string().trim().regex(/^https:\/\/[^\s]+$/i, "Website must be an https:// URL"),
  visit_url: optionalHttpsUrl,
  allowed_domains: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^(?:\*\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+$/, "Enter bare domains like example.com"),
    )
    .max(30),
  logo_url: optionalHttpsUrl,
  logo_usage_permitted: z.boolean(),
  brand_color: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^#[0-9a-fA-F]{6}$/.test(v), "Use a hex colour like #4F46E5"),
  disclosure_text: optionalText(500),
  allow_manual_prices: z.boolean(),
  price_max_age_hours: z
    .number()
    .int()
    .positive()
    .max(24 * 30)
    .nullable(),
  highlights: textList(10, 300),
  policy_links: z
    .array(z.object({ label: z.string().trim().min(2).max(80), url: z.string().trim().regex(/^https:\/\/[^\s]+$/i) }))
    .max(10),
  seo_title: optionalText(120),
  meta_description: optionalText(320),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  sort_order: z.number().int().min(0).max(10000),
});

export const programSchema = z.object({
  merchant_id: z.uuid(),
  name: z.string().trim().min(1).max(160),
  network: optionalText(120),
  status: z.enum(["not_applied", "applied", "approved", "paused", "rejected", "inactive"]),
  integration_type: z.enum(["manual", "api", "feed", "network"]),
  adapter_key: z.enum(["generic", "amazon_creators", "flipkart_affiliate", "meesho"]),
  api_status: z.enum(["not_configured", "credentials_added", "active", "error", "disabled"]),
  tracking_id_ref: optionalText(120),
  documentation_url: optionalHttpsUrl,
  terms_url: optionalHttpsUrl,
  notes: optionalText(4000),
  is_default: z.boolean(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug,
  parent_id: optionalUuid,
  short_description: optionalText(300),
  description: optionalText(20000),
  icon: optionalText(40),
  image_url: optionalHttpsUrl,
  image_alt: optionalText(250),
  seo_title: optionalText(120),
  meta_description: optionalText(320),
  faqs: faqsSchema,
  sort_order: z.number().int().min(0).max(100000),
  show_on_home: z.boolean(),
  home_sort_order: z.number().int().min(0).max(100000),
  is_active: z.boolean(),
  noindex: z.boolean(),
});

export const brandSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug,
  description: optionalText(2000),
  website_url: optionalUrl,
});

export const offerSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    slug,
    description: optionalText(1000),
    merchant_id: z.uuid("Choose a merchant"),
    product_id: optionalUuid,
    category_id: optionalUuid,
    offer_url: z.string().trim().min(10).max(2048),
    image_url: optionalHttpsUrl,
    image_alt: optionalText(250),
    coupon_code: optionalText(60),
    discount_text: optionalText(160),
    terms: optionalText(2000),
    source_url: optionalHttpsUrl,
    verified_at: z.string().nullable(),
    starts_at: z.string().nullable(),
    expires_at: z.string().nullable(),
    status: productStatus,
    is_featured: z.boolean(),
    sort_order: z.number().int().min(0).max(10000),
  })
  .refine((v) => !v.expires_at || !v.starts_at || new Date(v.expires_at) > new Date(v.starts_at), {
    path: ["expires_at"],
    message: "Expiry must be after the start date",
  })
  .refine((v) => !v.discount_text || Boolean(v.verified_at), {
    path: ["verified_at"],
    message: "Record when the discount was verified with the merchant",
  });

export const comparisonSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug,
  summary: optionalText(500),
  intro: optionalText(20000),
  verdict: optionalText(20000),
  category_id: optionalUuid,
  spec_labels: textList(40, 120),
  faqs: faqsSchema,
  seo_title: optionalText(120),
  meta_description: optionalText(320),
  status: productStatus,
  is_featured: z.boolean(),
  items: z
    .array(
      z.object({
        product_id: z.uuid(),
        highlight: optionalText(120),
        note: optionalText(500),
      }),
    )
    .max(8, "Compare up to 8 products"),
});

export const blogPostSchema = z
  .object({
    title: z.string().trim().min(5).max(200),
    slug,
    excerpt: optionalText(400),
    answer_summary: optionalText(800),
    content: z.string().max(200_000),
    featured_image_url: optionalHttpsUrl,
    featured_image_alt: optionalText(250),
    author_id: optionalUuid,
    category_id: optionalUuid,
    product_category_id: optionalUuid,
    seo_title: optionalText(120),
    meta_description: optionalText(320),
    canonical_url: optionalHttpsUrl,
    primary_keyword: optionalText(120),
    secondary_keywords: textList(20, 120),
    search_intent: z.enum(["informational", "commercial", "transactional", "navigational"]).nullable(),
    faqs: faqsSchema,
    sources: sourcesSchema,
    status: z.enum(["draft", "in_review", "scheduled", "published", "archived"]),
    published_at: z.string().nullable(),
    ai_assisted: z.boolean(),
    editor_notes: optionalText(10000),
    is_featured: z.boolean(),
    noindex: z.boolean(),
    tag_ids: z.array(z.uuid()).max(30),
    product_ids: z.array(z.uuid()).max(30),
    revision_note: optionalText(300),
  })
  .refine((v) => v.status !== "scheduled" || (v.published_at && new Date(v.published_at) > new Date()), {
    path: ["published_at"],
    message: "Scheduled posts need a future publish date",
  });

export const authorSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug,
  job_title: optionalText(120),
  bio: optionalText(2000),
  avatar_url: optionalHttpsUrl,
  expertise: textList(15, 80),
  website_url: optionalHttpsUrl,
  is_active: z.boolean(),
});

export const simpleTaxonomySchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug,
  description: optionalText(500),
});

export const bannerSchema = z.object({
  placement: z.enum(["home_hero", "home_promo", "deals_top"]),
  eyebrow: optionalText(80),
  title: z.string().trim().min(3).max(160),
  subtitle: optionalText(400),
  cta_label: optionalText(40),
  cta_url: optionalLink,
  secondary_cta_label: optionalText(40),
  secondary_cta_url: optionalLink,
  image_url: optionalHttpsUrl,
  image_alt: optionalText(250),
  theme: z.enum(["violet", "saffron", "navy", "emerald", "rose"]),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(10000),
});

export const settingsSchema = z.object({
  brand_name: z.string().trim().min(1).max(60),
  tagline: optionalText(160),
  logo_url: optionalHttpsUrl,
  favicon_url: optionalHttpsUrl,
  footer_about: optionalText(600),
  social_links: z.record(z.string(), z.string().trim().regex(/^https:\/\/[^\s]+$/i, "Social links must be https:// URLs")),
  contact_email: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || z.email().safeParse(v).success, "Invalid email"),
  contact_phone: optionalText(40),
  contact_address: optionalText(300),
  seo_default_title: optionalText(120),
  seo_title_template: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || v.includes("%s"), "Template must contain %s"),
  seo_default_description: optionalText(320),
  default_og_image_url: optionalHttpsUrl,
  affiliate_disclosure_short: optionalText(500),
  affiliate_disclosure_content: optionalText(20000),
  amazon_associate_statement: z.string().trim().min(10).max(300),
  newsletter_enabled: z.boolean(),
  newsletter_heading: optionalText(120),
  newsletter_subheading: optionalText(300),
  newsletter_consent_text: optionalText(500),
  announcement_text: optionalText(200),
  announcement_url: optionalLink,
  google_site_verification: optionalText(200),
});

export const profileSchema = z.object({
  full_name: z.string().trim().max(120).nullable().transform((v) => (v ? v : null)),
  newsletter_opt_in: z.boolean(),
  notification_prefs: z.object({ product_updates: z.boolean(), editorial_digest: z.boolean() }),
  privacy_prefs: z.object({ track_recently_viewed: z.boolean() }),
});

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")).pipe(z.string().max(254));

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Include at least one letter and one number");

export const newsletterSchema = z.object({
  email: emailSchema,
  consent: z.literal(true, { error: "Please tick the consent box to subscribe" }),
  source: z.string().trim().max(300).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: emailSchema,
  subject: z.string().trim().min(3, "Subject is required").max(200),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(5000),
  // Honeypot: must stay empty.
  website: z.string().max(0).optional(),
});

export const clickEventSchema = z.object({
  listingId: z.uuid().optional(),
  merchantId: z.uuid().optional(),
  offerId: z.uuid().optional(),
  sourcePath: z.string().max(500).optional(),
  sourceComponent: z.string().max(60).optional(),
  anonId: z.string().max(64).optional(),
  referrer: z.string().max(1000).optional(),
  utm: z
    .object({
      source: z.string().max(120).optional(),
      medium: z.string().max(120).optional(),
      campaign: z.string().max(120).optional(),
      term: z.string().max(120).optional(),
      content: z.string().max(120).optional(),
    })
    .optional(),
});

export const viewEventSchema = z.object({
  type: z.enum(["home", "product", "category", "store", "blog_post", "comparison", "deals"]),
  id: z.uuid().optional(),
});

export const searchEventSchema = z.object({
  q: z.string().trim().min(1).max(200),
  results: z.number().int().min(0).max(1_000_000),
});
