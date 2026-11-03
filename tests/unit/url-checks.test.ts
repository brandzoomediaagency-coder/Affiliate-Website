import { describe, expect, it } from "vitest";
import { checkListingUrls, hostAllowed, parseHttpsUrl } from "@/lib/affiliate/url-checks";
import { validateListingUrls } from "@/lib/affiliate/registry";

const amazonDomains = ["amazon.in", "amzn.to"];

describe("hostAllowed", () => {
  it("matches exact domains and subdomains only", () => {
    expect(hostAllowed("www.amazon.in", amazonDomains)).toBe(true);
    expect(hostAllowed("amzn.to", amazonDomains)).toBe(true);
    expect(hostAllowed("amazon.in.evil.com", amazonDomains)).toBe(false);
    expect(hostAllowed("notamazon.in", amazonDomains)).toBe(false);
  });
});

describe("parseHttpsUrl", () => {
  it("rejects non-https and credential-bearing URLs", () => {
    expect(parseHttpsUrl("http://www.amazon.in/dp/X")).toBeNull();
    expect(parseHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(parseHttpsUrl("https://user:pass@amazon.in/")).toBeNull();
    expect(parseHttpsUrl("https://www.amazon.in/dp/B000000000")).not.toBeNull();
  });
});

describe("checkListingUrls", () => {
  it("blocks links to hosts outside the merchant's allowed domains", () => {
    const r = checkListingUrls({
      destinationUrl: "https://www.amazon.in/dp/B000000000",
      affiliateUrl: "https://bit.ly/abc",
      allowedDomains: amazonDomains,
    });
    expect(r.errors.some((e) => e.includes("bit.ly"))).toBe(true);
  });
  it("accepts valid tagged merchant links", () => {
    const r = validateListingUrls("amazon_creators", {
      destinationUrl: "https://www.amazon.in/dp/B000000000",
      affiliateUrl: "https://www.amazon.in/dp/B000000000?tag=mytag-21",
      allowedDomains: amazonDomains,
    });
    expect(r.errors).toEqual([]);
  });
  it("warns when an Amazon link has no Associates tag", () => {
    const r = validateListingUrls("amazon_creators", {
      destinationUrl: "https://www.amazon.in/dp/B000000000",
      affiliateUrl: "https://www.amazon.in/dp/B000000000",
      allowedDomains: amazonDomains,
    });
    expect(r.warnings.join(" ")).toMatch(/tag=/);
  });
  it("warns when a Flipkart link has no affiliate id", () => {
    const r = validateListingUrls("flipkart_affiliate", {
      destinationUrl: "https://www.flipkart.com/p/itm123",
      affiliateUrl: "https://www.flipkart.com/p/itm123",
      allowedDomains: ["flipkart.com"],
    });
    expect(r.warnings.join(" ")).toMatch(/affid/);
  });
});
