import { describe, expect, it } from "vitest";
import { slugify, stripMarkdown, truncate } from "@/lib/utils";
import { safeNextPath } from "@/lib/safe-redirect";
import { assessProductQuality } from "@/lib/product-quality";
import { parseProductFilters, hasNonCanonicalFilters } from "@/lib/search-params";
import { sniffImageType } from "@/lib/security/uploads";

describe("slugify", () => {
  it("creates clean slugs", () => {
    expect(slugify("Men's Fashion & Accessories")).toBe("mens-fashion-and-accessories");
    expect(slugify("  Best Earbuds Under ₹2,000!  ")).toBe("best-earbuds-under-2-000");
  });
});

describe("safeNextPath (open-redirect protection)", () => {
  it("allows internal paths only", () => {
    expect(safeNextPath("/account/wishlist")).toBe("/account/wishlist");
    expect(safeNextPath("https://evil.com")).toBe("/account");
    expect(safeNextPath("//evil.com")).toBe("/account");
    expect(safeNextPath("/\\evil.com")).toBe("/account");
    expect(safeNextPath("/login")).toBe("/account");
    expect(safeNextPath(undefined, "/")).toBe("/");
  });
});

describe("assessProductQuality", () => {
  const base = {
    short_description: "A clear short description that is longer than forty characters.",
    overview: "x ".repeat(200),
    description: null,
    key_features: ["a", "b", "c"],
    imageCount: 1,
    activeListingCount: 1,
    specCount: 0,
    categoryId: "c",
  };
  it("passes complete products", () => {
    expect(assessProductQuality(base).ok).toBe(true);
  });
  it("blocks thin products", () => {
    const r = assessProductQuality({ ...base, overview: "Too short", activeListingCount: 0 });
    expect(r.ok).toBe(false);
    expect(r.issues.length).toBe(2);
  });
});

describe("search params", () => {
  it("parses and sanitises filters", () => {
    const f = parseProductFilters({ q: " earbuds ", category: "Bad Slug!", min: "500", max: "-1", sort: "price_asc", page: "2" });
    expect(f).toMatchObject({ q: "earbuds", category: undefined, min: 500, max: undefined, sort: "price_asc", page: 2 });
    expect(hasNonCanonicalFilters(f)).toBe(true);
    expect(hasNonCanonicalFilters(parseProductFilters({ page: "3" }))).toBe(false);
  });
});

describe("helpers", () => {
  it("strips markdown and truncates on word boundaries", () => {
    expect(stripMarkdown("## Hi **there** [link](https://x.y)")).toBe("Hi there link");
    expect(truncate("one two three four five", 12)).toBe("one two…");
  });
  it("detects image types from magic bytes", () => {
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe("image/png");
    expect(sniffImageType(new TextEncoder().encode("<svg xmlns=...></svg>"))).toBeNull();
  });
});
