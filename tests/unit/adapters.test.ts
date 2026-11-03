import { describe, expect, it } from "vitest";
import { parseAmazonItems } from "@/lib/affiliate/adapters/amazon-creators";
import { parseFlipkartProduct } from "@/lib/affiliate/adapters/flipkart";

describe("parseAmazonItems", () => {
  it("maps lowerCamelCase Creators API responses", () => {
    const [item] = parseAmazonItems({
      itemsResult: {
        items: [
          {
            asin: "B000000001",
            detailPageURL: "https://www.amazon.in/dp/B000000001?tag=t-21",
            itemInfo: { title: { displayValue: "Test Item" } },
            images: { primary: { large: { url: "https://m.media-amazon.com/images/I/x.jpg" } } },
            offersV2: { listings: [{ price: { money: { amount: 999, currency: "INR" }, savingBasis: { money: { amount: 1499 } } }, availability: { type: "IN_STOCK" } }] },
          },
        ],
      },
    });
    expect(item).toMatchObject({ merchantProductId: "B000000001", title: "Test Item", price: 999, previousPrice: 1499, currency: "INR", availability: "in_stock" });
  });
  it("tolerates PascalCase and missing offers", () => {
    const [item] = parseAmazonItems({ ItemsResult: { Items: [{ ASIN: "B000000002", DetailPageURL: "https://www.amazon.in/dp/B000000002" }] } });
    expect(item).toMatchObject({ merchantProductId: "B000000002", price: null, availability: "unknown" });
  });
});

describe("parseFlipkartProduct", () => {
  it("maps productBaseInfoV1 fields", () => {
    const p = parseFlipkartProduct({
      productBaseInfoV1: {
        productId: "MOBABC",
        title: "Phone",
        productUrl: "https://dl.flipkart.com/dl/phone/p/itm?pid=MOBABC&affid=me",
        imageUrls: { "200x200": "https://img/200", "800x800": "https://img/800" },
        maximumRetailPrice: { amount: 15999, currency: "INR" },
        flipkartSpecialPrice: { amount: 12999, currency: "INR" },
        inStock: true,
      },
    });
    expect(p).toMatchObject({ merchantProductId: "MOBABC", price: 12999, previousPrice: 15999, imageUrl: "https://img/800", availability: "in_stock" });
  });
  it("returns null without productBaseInfoV1", () => {
    expect(parseFlipkartProduct({})).toBeNull();
  });
});
