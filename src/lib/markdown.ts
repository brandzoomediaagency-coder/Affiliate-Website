import { Marked, type Tokens } from "marked";
import sanitizeHtml from "sanitize-html";
import { slugify, stripMarkdown } from "@/lib/utils";

export type TocItem = { id: string; text: string; depth: 2 | 3 };

/** Hostnames that are always treated as affiliate/merchant destinations. */
export const DEFAULT_AFFILIATE_HOSTS = [
  "amazon.in",
  "amzn.to",
  "amzn.in",
  "flipkart.com",
  "dl.flipkart.com",
  "fkrt.it",
  "meesho.com",
];

function hostMatches(host: string, domains: string[]) {
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

/**
 * Renders trusted-but-sanitised Markdown (written by staff in the CMS) to
 * HTML. Headings get stable ids for the table of contents, H1s are demoted
 * (pages own their H1), tables are made horizontally scrollable, external
 * links open in a new tab and merchant links are marked as sponsored.
 */
export function renderMarkdown(
  markdown: string | null | undefined,
  options: { affiliateHosts?: string[]; siteHost?: string } = {},
): { html: string; toc: TocItem[] } {
  if (!markdown?.trim()) return { html: "", toc: [] };

  const toc: TocItem[] = [];
  const used = new Map<string, number>();
  const marked = new Marked({ gfm: true, breaks: false });

  marked.use({
    renderer: {
      heading(this: { parser: { parseInline: (tokens: Tokens.Generic[]) => string } }, token: Tokens.Heading) {
        const depth = Math.min(Math.max(token.depth, 2), 6);
        const inner = this.parser.parseInline(token.tokens);
        const plain = stripMarkdown(token.text);
        const base = slugify(plain) || "section";
        const count = used.get(base) ?? 0;
        used.set(base, count + 1);
        const id = count === 0 ? base : `${base}-${count + 1}`;
        if (depth === 2 || depth === 3) toc.push({ id, text: plain, depth });
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
    },
  });

  const raw = marked.parse(markdown, { async: false }) as string;
  const affiliateHosts = [...DEFAULT_AFFILIATE_HOSTS, ...(options.affiliateHosts ?? [])];

  const clean = sanitizeHtml(raw, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "h2"],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
      h2: ["id"],
      h3: ["id"],
      h4: ["id"],
      h5: ["id"],
      h6: ["id"],
      th: ["align", "colspan", "rowspan"],
      td: ["align", "colspan", "rowspan"],
      code: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        let host: string | null = null;
        try {
          host = /^https?:\/\//i.test(href) ? new URL(href).hostname.toLowerCase() : null;
        } catch {
          host = null;
        }
        if (!host || (options.siteHost && host === options.siteHost)) {
          return { tagName, attribs: { href, ...(attribs.title ? { title: attribs.title } : {}) } };
        }
        const rel = hostMatches(host, affiliateHosts) ? "sponsored nofollow noopener" : "noopener noreferrer";
        return { tagName, attribs: { href, rel, target: "_blank", ...(attribs.title ? { title: attribs.title } : {}) } };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy", decoding: "async", alt: attribs.alt ?? "" },
      }),
    },
  });

  const html = clean
    .replace(/<table>/g, '<div class="table-wrap" role="region" tabindex="0" aria-label="Scrollable table"><table>')
    .replace(/<\/table>/g, "</table></div>");

  return { html, toc };
}
