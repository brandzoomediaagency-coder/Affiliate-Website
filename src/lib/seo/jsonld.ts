import { absoluteUrl } from "@/lib/env";
import { stripMarkdown, truncate } from "@/lib/utils";
import type {
  BlogPostDetail,
  Faq,
  Listing,
  ProductCard,
  ProductDetail,
  SiteSettings,
} from "@/lib/data/types";

/**
 * JSON-LD builders. Only facts that are visible on the page are emitted.
 * We NEVER output ratings, reviews or aggregateRating, and Offer data is
 * only included when a verified, displayable price exists.
 */

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(settings: SiteSettings): JsonLd {
  const sameAs = Object.values(settings.socialLinks).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: settings.brandName,
    url: absoluteUrl("/"),
    ...(settings.logoUrl ? { logo: settings.logoUrl } : { logo: absoluteUrl("/apple-icon") }),
    ...(sameAs.length ? { sameAs } : {}),
    ...(settings.contactEmail
      ? { contactPoint: { "@type": "ContactPoint", email: settings.contactEmail, contactType: "customer support", areaServed: "IN" } }
      : {}),
  };
}

export function websiteJsonLd(settings: SiteSettings): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: settings.brandName,
    url: absoluteUrl("/"),
    inLanguage: "en-IN",
    publisher: { "@id": absoluteUrl("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; href: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

export function itemListJsonLd(name: string, products: Pick<ProductCard, "slug" | "name">[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: products.length,
    itemListElement: products.map((p, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/products/${p.slug}`),
      name: p.name,
    })),
  };
}

const availabilityMap: Record<string, string> = {
  in_stock: "https://schema.org/InStock",
  out_of_stock: "https://schema.org/OutOfStock",
  limited_stock: "https://schema.org/LimitedAvailability",
  preorder: "https://schema.org/PreOrder",
};

function offerFromListing(listing: Listing): JsonLd | null {
  if (listing.price === null || !listing.priceCheckedAt) return null;
  return {
    "@type": "Offer",
    url: listing.affiliateUrl,
    price: listing.price.toFixed(2),
    priceCurrency: "INR",
    ...(availabilityMap[listing.availability] ? { availability: availabilityMap[listing.availability] } : {}),
    seller: { "@type": "Organization", name: listing.merchantName },
  };
}

export function productJsonLd(product: ProductDetail): JsonLd {
  const offers = product.listings.map(offerFromListing).filter((o): o is JsonLd => o !== null);
  const prices = product.listings.map((l) => l.price).filter((p): p is number => p !== null);
  const description =
    product.shortDescription || truncate(stripMarkdown(product.overview || product.description || ""), 300) || undefined;

  const base: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: absoluteUrl(`/products/${product.slug}`),
    ...(description ? { description } : {}),
    ...(product.images.length ? { image: product.images.map((i) => i.url) } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    ...(product.modelNumber ? { model: product.modelNumber, mpn: product.modelNumber } : {}),
    ...(product.category ? { category: product.category.name } : {}),
  };

  if (offers.length === 1) return { ...base, offers: offers[0] };
  if (offers.length > 1) {
    return {
      ...base,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "INR",
        lowPrice: Math.min(...prices).toFixed(2),
        highPrice: Math.max(...prices).toFixed(2),
        offerCount: offers.length,
        offers,
      },
    };
  }
  return base;
}

export function articleJsonLd(post: BlogPostDetail, settings: SiteSettings): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: truncate(post.title, 110),
    description: post.metaDescription || post.excerpt || undefined,
    url: absoluteUrl(`/blog/${post.slug}`),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    ...(post.featuredImageUrl ? { image: [post.featuredImageUrl] } : {}),
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.contentUpdatedAt ?? post.updatedAt,
    inLanguage: "en-IN",
    author: post.author
      ? {
          "@type": post.author.slug === "editorial-team" ? "Organization" : "Person",
          name: post.author.name,
          url: absoluteUrl(`/blog/author/${post.author.slug}`),
        }
      : { "@type": "Organization", name: settings.brandName, url: absoluteUrl("/") },
    publisher: {
      "@type": "Organization",
      name: settings.brandName,
      ...(settings.logoUrl ? { logo: { "@type": "ImageObject", url: settings.logoUrl } } : {}),
    },
    ...(post.sources.length ? { citation: post.sources.map((s) => s.url) } : {}),
  };
}

/** Only used when the FAQs are visibly rendered on the same page. */
export function faqJsonLd(faqs: Faq[]): JsonLd | null {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
