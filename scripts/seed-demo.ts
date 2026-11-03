/**
 * OPTIONAL demo catalogue for LOCAL UI previews only.
 *
 *   npm run seed:demo            # create clearly-labelled demo products
 *   npm run seed:demo -- --remove
 *
 * Demo products:
 *  - are named "Sample …" and say they are demo content,
 *  - are noindex, have NO prices, NO ratings and NO images,
 *  - link to merchant SEARCH pages (not affiliate links).
 * Never run this against production. Remove before launch.
 */
import { serviceClient } from "./_env";

const DEMO_TAG = "demo-content";

const demo = [
  { slug: "sample-wireless-earbuds", name: "Sample Wireless Earbuds", category: "headphones-earbuds", q: "wireless earbuds" },
  { slug: "sample-budget-5g-smartphone", name: "Sample Budget 5G Smartphone", category: "smartphones", q: "5g smartphone" },
  { slug: "sample-student-laptop", name: "Sample Student Laptop", category: "laptops", q: "student laptop" },
  { slug: "sample-mixer-grinder", name: "Sample Mixer Grinder", category: "kitchen-appliances", q: "mixer grinder" },
  { slug: "sample-smartwatch", name: "Sample Smartwatch", category: "smartwatches", q: "smartwatch" },
  { slug: "sample-cotton-kurta", name: "Sample Cotton Kurta", category: "womens-fashion", q: "cotton kurta" },
  { slug: "sample-power-bank", name: "Sample 10000mAh Power Bank", category: "chargers-power-banks", q: "power bank" },
  { slug: "sample-yoga-mat", name: "Sample Yoga Mat", category: "fitness-equipment", q: "yoga mat" },
];

const searchUrl: Record<string, (q: string) => string> = {
  amazon: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
  flipkart: (q) => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`,
  meesho: (q) => `https://www.meesho.com/search?q=${encodeURIComponent(q)}`,
};

async function main() {
  const db = serviceClient();
  if (process.argv.includes("--remove")) {
    const { data } = await db.from("products").delete().eq("search_keywords", DEMO_TAG).select("slug");
    console.log(`Removed ${data?.length ?? 0} demo products.`);
    return;
  }
  const [{ data: categories }, { data: merchants }] = await Promise.all([
    db.from("categories").select("id, slug"),
    db.from("merchants").select("id, slug"),
  ]);
  const cat = new Map((categories ?? []).map((c) => [c.slug, c.id]));
  const merch = new Map((merchants ?? []).map((m) => [m.slug, m.id]));

  for (const [i, d] of demo.entries()) {
    const { data: product, error } = await db
      .from("products")
      .upsert(
        {
          slug: d.slug,
          name: d.name,
          category_id: cat.get(d.category) ?? null,
          short_description: `Demo product for previewing the ${d.name.replace("Sample ", "").toLowerCase()} layout. Not a real recommendation.`,
          overview:
            "**This is demo content for local development.** It shows how a product page looks with editorial sections, specifications and store listings. Delete demo products before launch with `npm run seed:demo -- --remove`.",
          description:
            "Real product pages should contain original analysis: what the product is good at, where it falls short, who it suits and what to check before buying. Specifications should come from the manufacturer or official sources and be cited.",
          key_features: ["Demo feature one", "Demo feature two", "Demo feature three"],
          pros: ["Shows the advantages layout"],
          cons: ["Demo content — not a real product"],
          best_for: "Previewing the product page design.",
          not_ideal_for: "Real shoppers — this is sample content.",
          faqs: [{ question: "Is this a real product?", answer: "No. It is demo content for previewing the website locally." }],
          search_keywords: DEMO_TAG,
          status: "published",
          noindex: true,
          is_featured: i < 4,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error) throw error;
    await db.from("product_specs").delete().eq("product_id", product.id);
    await db.from("product_specs").insert([
      { product_id: product.id, group_name: "General", label: "Type", value: "Demo item", sort_order: 0 },
      { product_id: product.id, group_name: "General", label: "Purpose", value: "Layout preview", sort_order: 10 },
    ]);
    for (const [j, slug] of ["amazon", "flipkart", "meesho"].entries()) {
      if (slug === "meesho" && !["womens-fashion", "fitness-equipment", "kitchen-appliances"].includes(d.category)) continue;
      const merchantId = merch.get(slug);
      if (!merchantId) continue;
      const url = searchUrl[slug]!(d.q);
      await db
        .from("product_listings")
        .upsert(
          { product_id: product.id, merchant_id: merchantId, variant_label: "", destination_url: url, affiliate_url: url, sort_order: j, internal_notes: "Demo listing (merchant search page, not an affiliate link)" },
          { onConflict: "product_id,merchant_id,variant_label" },
        );
    }
    console.log(`✚ ${d.slug}`);
  }
  console.log("\nDemo products created (noindex, no prices). Remove them before launch: npm run seed:demo -- --remove");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
