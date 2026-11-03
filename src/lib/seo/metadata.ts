import "server-only";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { siteConfig } from "@/config/site";
import { getSiteSettings } from "@/lib/data/settings";
import { truncate } from "@/lib/utils";

type BuildMetadataInput = {
  title?: string;
  /** Use the title verbatim (no "| Brand" suffix). */
  absoluteTitle?: boolean;
  description?: string | null;
  path: string;
  image?: string | null;
  imageAlt?: string | null;
  noindex?: boolean;
  /** Allow following links even when noindex (e.g. filtered listing pages). */
  follow?: boolean;
  canonical?: string | null;
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authors?: string[];
};

/** Consistent per-page metadata: unique title/description, canonical, OG, Twitter. */
export async function buildMetadata(input: BuildMetadataInput): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = truncate(input.description || settings.seoDefaultDescription, 160);
  const canonical = input.canonical || absoluteUrl(input.path);
  const image = input.image || settings.defaultOgImageUrl || absoluteUrl("/opengraph-image");
  const fullTitle = input.title
    ? input.absoluteTitle
      ? input.title
      : settings.seoTitleTemplate.replace("%s", input.title)
    : settings.seoDefaultTitle;

  return {
    title: input.title ? (input.absoluteTitle ? { absolute: input.title } : input.title) : { absolute: settings.seoDefaultTitle },
    description,
    alternates: { canonical },
    robots: input.noindex
      ? { index: false, follow: input.follow ?? true, googleBot: { index: false, follow: input.follow ?? true } }
      : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    openGraph: {
      type: input.type ?? "website",
      url: canonical,
      siteName: settings.brandName,
      locale: siteConfig.locale,
      title: fullTitle,
      description,
      images: [{ url: image, alt: input.imageAlt || fullTitle }],
      ...(input.type === "article"
        ? {
            publishedTime: input.publishedTime ?? undefined,
            modifiedTime: input.modifiedTime ?? undefined,
            authors: input.authors,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}
