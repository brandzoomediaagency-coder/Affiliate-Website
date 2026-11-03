/** Domain types shared by server data functions and UI components. */

export type Faq = { question: string; answer: string };
export type SourceRef = { title: string; url: string; note?: string };
export type LinkRef = { label: string; url: string };

export type SiteSettings = {
  brandName: string;
  tagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  footerAbout: string;
  socialLinks: Partial<Record<string, string>>;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  seoDefaultTitle: string;
  seoTitleTemplate: string;
  seoDefaultDescription: string;
  defaultOgImageUrl: string | null;
  affiliateDisclosureShort: string;
  affiliateDisclosureContent: string | null;
  amazonAssociateStatement: string;
  newsletterEnabled: boolean;
  newsletterHeading: string;
  newsletterSubheading: string;
  newsletterConsentText: string;
  announcementText: string | null;
  announcementUrl: string | null;
  googleSiteVerification: string | null;
};

export type Banner = {
  id: string;
  placement: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaUrl: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  theme: "violet" | "saffron" | "navy" | "emerald" | "rose";
};

export type Category = {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  faqs: Faq[];
  sortOrder: number;
  showOnHome: boolean;
  homeSortOrder: number;
  noindex: boolean;
  updatedAt: string;
};

export type CategoryNode = Category & { children: CategoryNode[] };

export type Merchant = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  websiteUrl: string;
  visitUrl: string;
  allowedDomains: string[];
  logoUrl: string | null;
  logoUsagePermitted: boolean;
  brandColor: string | null;
  disclosureText: string | null;
  highlights: string[];
  policyLinks: LinkRef[];
  seoTitle: string | null;
  metaDescription: string | null;
  isFeatured: boolean;
  updatedAt: string;
};

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  isFeatured: boolean;
  isTrending: boolean;
  trendingReason: string | null;
  publishedAt: string | null;
  updatedAt: string;
  categoryName: string | null;
  categorySlug: string | null;
  brandName: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageSource: string | null;
  bestListingId: string | null;
  bestMerchantId: string | null;
  bestMerchantName: string | null;
  bestMerchantSlug: string | null;
  bestAffiliateUrl: string | null;
  price: number | null;
  previousPrice: number | null;
  discount: number | null;
  priceCheckedAt: string | null;
  availability: string | null;
  listingCount: number;
  merchantSlugs: string[];
};

export type ProductImage = {
  id: string;
  url: string;
  altText: string;
  source: string;
  credit: string | null;
  sourceUrl: string | null;
  width: number | null;
  height: number | null;
};

export type ProductSpec = {
  id: string;
  groupName: string;
  label: string;
  value: string;
  sourceUrl: string | null;
};

export type Listing = {
  id: string;
  productId: string;
  merchantId: string;
  merchantSlug: string;
  merchantName: string;
  merchantLogoUrl: string | null;
  merchantLogoUsagePermitted: boolean;
  merchantBrandColor: string | null;
  merchantDisclosureText: string | null;
  variantLabel: string;
  affiliateUrl: string;
  price: number | null;
  previousPrice: number | null;
  previousPriceType: string;
  discount: number | null;
  priceCheckedAt: string | null;
  priceSource: string;
  availability: string;
  couponCode: string | null;
  offerDetails: string | null;
  offerExpiresAt: string | null;
};

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  modelNumber: string | null;
  shortDescription: string | null;
  overview: string | null;
  description: string | null;
  keyFeatures: string[];
  pros: string[];
  cons: string[];
  bestFor: string | null;
  notIdealFor: string | null;
  buyingConsiderations: string | null;
  faqs: Faq[];
  sources: SourceRef[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  isTrending: boolean;
  trendingReason: string | null;
  noindex: boolean;
  publishedAt: string | null;
  updatedAt: string;
  brand: { id: string; name: string; slug: string; websiteUrl: string | null } | null;
  category: { id: string; name: string; slug: string; parentId: string | null } | null;
  images: ProductImage[];
  specs: ProductSpec[];
  listings: Listing[];
};

export type Offer = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  merchantId: string;
  merchantName: string;
  merchantSlug: string;
  productId: string | null;
  productSlug: string | null;
  listingId: string | null;
  categoryId: string | null;
  offerUrl: string;
  imageUrl: string | null;
  imageAlt: string | null;
  couponCode: string | null;
  discountText: string | null;
  terms: string | null;
  sourceUrl: string | null;
  verifiedAt: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  isFeatured: boolean;
};

export type ComparisonSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  categoryName: string | null;
  productCount: number;
  imageUrls: string[];
  updatedAt: string;
};

export type ComparisonDetail = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  intro: string | null;
  verdict: string | null;
  specLabels: string[];
  faqs: Faq[];
  seoTitle: string | null;
  metaDescription: string | null;
  publishedAt: string | null;
  updatedAt: string;
  category: { name: string; slug: string } | null;
  items: Array<{
    product: ProductCard;
    highlight: string | null;
    note: string | null;
    specs: ProductSpec[];
    pros: string[];
    cons: string[];
    listings: Listing[];
  }>;
};

export type BlogAuthor = {
  id: string;
  slug: string;
  name: string;
  jobTitle: string | null;
  bio: string | null;
  avatarUrl: string | null;
  expertise: string[];
  websiteUrl: string | null;
  socialLinks: Partial<Record<string, string>>;
};

export type BlogPostCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  authorName: string | null;
  authorSlug: string | null;
  publishedAt: string | null;
  updatedAt: string;
  contentUpdatedAt: string | null;
  readingTimeMinutes: number | null;
};

export type BlogPostDetail = BlogPostCard & {
  content: string;
  answerSummary: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  primaryKeyword: string | null;
  faqs: Faq[];
  sources: SourceRef[];
  noindex: boolean;
  author: BlogAuthor | null;
  tags: Array<{ slug: string; name: string }>;
  productCategoryId: string | null;
  productIds: string[];
};
