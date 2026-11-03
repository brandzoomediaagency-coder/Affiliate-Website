import type { UrlCheckInput, UrlCheckResult } from "./types";

export function parseHttpsUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

export function hostAllowed(host: string, allowedDomains: string[]): boolean {
  const h = host.toLowerCase();
  return allowedDomains.some((raw) => {
    const d = raw.trim().toLowerCase().replace(/^\*\./, "");
    return d.length > 0 && (h === d || h.endsWith(`.${d}`));
  });
}

/**
 * Generic checks applied to every merchant listing:
 *  - both URLs must be valid https URLs without embedded credentials;
 *  - both hosts must belong to the merchant's allowed domains (merchant
 *    domains plus any approved affiliate-network tracking domains), so a
 *    listing can never silently send shoppers to an unrelated website.
 */
export function checkListingUrls(input: UrlCheckInput): UrlCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const destination = parseHttpsUrl(input.destinationUrl);
  const affiliate = parseHttpsUrl(input.affiliateUrl);

  if (!destination) errors.push("Destination URL must be a valid https:// URL.");
  if (!affiliate) errors.push("Affiliate URL must be a valid https:// URL.");
  if (input.affiliateUrl.length > 2048) errors.push("Affiliate URL is too long (max 2048 characters).");

  if (input.allowedDomains.length === 0) {
    warnings.push("This merchant has no allowed domains configured, so link hosts cannot be verified.");
  } else {
    if (destination && !hostAllowed(destination.hostname, input.allowedDomains)) {
      errors.push(
        `Destination host "${destination.hostname}" is not one of this merchant's allowed domains (${input.allowedDomains.join(", ")}).`,
      );
    }
    if (affiliate && !hostAllowed(affiliate.hostname, input.allowedDomains)) {
      errors.push(
        `Affiliate URL host "${affiliate.hostname}" is not allowed for this merchant. If it is an approved affiliate-network tracking domain, add it to the merchant's allowed domains first.`,
      );
    }
  }
  return { errors, warnings };
}
