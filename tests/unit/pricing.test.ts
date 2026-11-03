import { describe, expect, it } from "vitest";
import { discountPercent, displayPrice, formatINR, toNumber } from "@/lib/pricing";

describe("discountPercent", () => {
  it("calculates a whole-number discount from verified prices", () => {
    expect(discountPercent(1499, 2999)).toBe(50);
    expect(discountPercent("799", "999")).toBe(20);
  });
  it("never shows a discount when the previous price is not higher", () => {
    expect(discountPercent(1000, 1000)).toBeNull();
    expect(discountPercent(1200, 1000)).toBeNull();
  });
  it("returns null for missing, zero or implausible values", () => {
    expect(discountPercent(null, 1000)).toBeNull();
    expect(discountPercent(1000, null)).toBeNull();
    expect(discountPercent(0, 1000)).toBeNull();
    expect(discountPercent(1, 10000)).toBeNull(); // > 95% is treated as invalid data
    expect(discountPercent(999.5, 1000)).toBeNull(); // < 1%
  });
});

describe("displayPrice", () => {
  it("hides prices that are not displayable", () => {
    expect(displayPrice({ current_price: 999, previous_price: 1999, price_displayable: false, price_checked_at: "2026-01-01" })).toEqual({
      price: null,
      previousPrice: null,
      discount: null,
      checkedAt: null,
    });
  });
  it("drops a previous price that is not higher than the current price", () => {
    const r = displayPrice({ current_price: 999, previous_price: 900, price_displayable: true, price_checked_at: "2026-01-01" });
    expect(r.price).toBe(999);
    expect(r.previousPrice).toBeNull();
    expect(r.discount).toBeNull();
  });
});

describe("formatting", () => {
  it("formats INR with Indian grouping", () => {
    expect(formatINR(125000)).toBe("₹1,25,000");
    expect(formatINR(null)).toBeNull();
  });
  it("parses numeric strings safely", () => {
    expect(toNumber("12.5")).toBe(12.5);
    expect(toNumber("abc")).toBeNull();
    expect(toNumber("")).toBeNull();
  });
});
