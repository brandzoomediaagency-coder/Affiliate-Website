/**
 * End-to-end acceptance test against a running dev/prod server + local Supabase.
 *
 *   npx supabase start && npm run dev       # in another terminal
 *   node tests/e2e/acceptance.mjs
 *
 * Requires the `playwright` package and a Chromium build available to it
 * (`npm i -D playwright && npx playwright install chromium`), plus
 * NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY in .env.local for DB checks.
 * Uses Mailpit (local Supabase SMTP) for the password-reset flow.
 */
import { existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const MAILPIT = process.env.MAILPIT_URL || "http://127.0.0.1:54324";
const SHOTS = process.env.SHOTS_DIR || "tests/e2e/screenshots";
const IMAGE = process.env.TEST_IMAGE;
mkdirSync(SHOTS, { recursive: true });

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const run = Date.now().toString(36);
const adminEmail = `admin-${run}@example.com`;
const userEmail = `shopper-${run}@example.com`;
const password = "TestPass123";
const productName = `Acceptance Test Earbuds ${run}`;
const productSlug = `acceptance-test-earbuds-${run}`;

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✔" : "✘"} ${name}${detail ? ` — ${detail}` : ""}`);
}
async function step(name, fn) {
  try {
    await fn();
  } catch (e) {
    check(name, false, String(e?.message ?? e).split("\n")[0]);
  }
}

const browser = await chromium.launch();
const adminCtx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const admin = await adminCtx.newPage();
admin.on("pageerror", (e) => console.log("  [admin pageerror]", e.message));

async function signUp(page, email, name) {
  await page.goto(`${BASE}/signup`);
  await page.fill("#su-name", name);
  await page.fill("#su-email", email);
  await page.fill("#su-password", password);
  await page.fill("#su-confirm", password);
  await page.check('input[name="terms"]');
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account/, { timeout: 20000 });
}

async function submitAndWaitToast(page, buttonText) {
  await page.getByRole("button", { name: buttonText }).last().click();
  await page.waitForTimeout(1500);
}

// ---------------------------------------------------------------------------
await step("Admin signs up and is granted the admin role", async () => {
  await signUp(admin, adminEmail, "Asha Admin");
  execSync(`npx tsx scripts/grant-admin.ts ${adminEmail} admin`, { stdio: "pipe" });
  await admin.goto(`${BASE}/admin`);
  await admin.getByRole("heading", { name: /Welcome/ }).waitFor({ timeout: 20000 });
  check("Admin signs up and is granted the admin role", true);
});

await step("Admin creates a draft product", async () => {
  await admin.goto(`${BASE}/admin/products/new`);
  await admin.fill("#name", productName);
  await admin.selectOption("#category_id", { label: "— Headphones & Earbuds" });
  await admin.fill("#short_description", "Compact true-wireless earbuds used to verify the publishing workflow end to end.");
  const overview = admin.locator('textarea[name="overview"]');
  await overview.fill(
    "These earbuds are an acceptance-test product. ".repeat(4) +
      "They exist to check that editorial content, merchant listings, pricing rules, structured data and affiliate tracking all work together. " +
      "A real product page would explain what the product is good at and where it falls short.",
  );
  await admin.fill("#key_features", "Bluetooth 5.3\nUSB-C charging\nIPX4 splash resistance");
  await admin.fill("#pros", "Comfortable fit\nApp with EQ");
  await admin.fill("#cons", "No wireless charging");
  await submitAndWaitToast(admin, "Create draft");
  await admin.waitForURL(/\/admin\/products\/[0-9a-f-]{36}/, { timeout: 20000 });
  check("Admin creates a draft product", true, admin.url().split("/").pop());
});
const productId = admin.url().split("/").pop();

await step("Publishing is blocked until the content checklist is complete", async () => {
  await admin.selectOption('select[name="status"]', "published");
  await submitAndWaitToast(admin, "Save product");
  const blocked = await admin.getByText(/isn't ready to publish/).first().isVisible();
  check("Publishing is blocked until the content checklist is complete", blocked);
});

await step("Admin uploads a product image", async () => {
  if (!IMAGE) throw new Error("Set TEST_IMAGE to a PNG/JPEG path");
  await admin.setInputFiles("#img-file", IMAGE);
  await admin.locator('input[name="alt_text"]').last().fill("Purple wireless earbuds in a charging case");
  await submitAndWaitToast(admin, "Add image");
  const { count } = await db.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId);
  check("Admin uploads a product image", count === 1, `${count} image(s)`);
});

await step("Admin adds a Flipkart listing with a verified price", async () => {
  const { data: fk } = await db.from("merchants").select("id").eq("slug", "flipkart").single();
  await admin.goto(`${BASE}/admin/listings/new?product=${productId}`);
  await admin.selectOption("#merchant_id", fk.id);
  await admin.fill("#destination_url", "https://www.flipkart.com/test-earbuds/p/itm123");
  await admin.fill("#affiliate_url", "https://www.flipkart.com/test-earbuds/p/itm123?affid=acceptance");
  await admin.fill("#current_price", "999");
  await admin.fill("#previous_price", "1499");
  await admin.check('input[name="price_verified_now"]');
  await submitAndWaitToast(admin, "Add listing");
  const { data } = await db.from("product_listings").select("current_price, price_checked_at").eq("product_id", productId).eq("merchant_id", fk.id).single();
  check("Admin adds a Flipkart listing with a verified price", Number(data?.current_price) === 999 && Boolean(data?.price_checked_at));
});

await step("Listing on a foreign domain is rejected", async () => {
  const { data: fk } = await db.from("merchants").select("id").eq("slug", "flipkart").single();
  await admin.goto(`${BASE}/admin/listings/new?product=${productId}`);
  await admin.selectOption("#merchant_id", fk.id);
  await admin.fill("#variant_label", "Bad link");
  await admin.fill("#destination_url", "https://www.flipkart.com/x");
  await admin.fill("#affiliate_url", "https://bit.ly/masked-link");
  await submitAndWaitToast(admin, "Add listing");
  const { count } = await db.from("product_listings").select("id", { count: "exact", head: true }).eq("product_id", productId).eq("variant_label", "Bad link");
  check("Listing on a foreign domain is rejected", count === 0);
});

await step("Manual Amazon price is saved but hidden publicly (programme rule)", async () => {
  const { data: amz } = await db.from("merchants").select("id").eq("slug", "amazon").single();
  await admin.goto(`${BASE}/admin/listings/new?product=${productId}`);
  await admin.selectOption("#merchant_id", amz.id);
  await admin.fill("#destination_url", "https://www.amazon.in/dp/B0TESTTEST");
  await admin.fill("#affiliate_url", "https://www.amazon.in/dp/B0TESTTEST?tag=acceptance-21");
  await admin.fill("#current_price", "949");
  await admin.check('input[name="price_verified_now"]');
  await submitAndWaitToast(admin, "Add listing");
  const warned = await admin.getByText(/NOT shown publicly/).first().isVisible();
  check("Manual Amazon price is saved but hidden publicly (programme rule)", warned);
});

await step("Admin publishes the product", async () => {
  await admin.goto(`${BASE}/admin/products/${productId}`);
  await admin.selectOption('select[name="status"]', "published");
  await submitAndWaitToast(admin, "Save product");
  const { data } = await db.from("products").select("status, slug").eq("id", productId).single();
  check("Admin publishes the product", data?.status === "published", data?.slug);
});

// Public product page as a guest --------------------------------------------
const guestCtx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const guest = await guestCtx.newPage();
guest.on("pageerror", (e) => console.log("  [guest pageerror]", e.message));

await step("Public product page shows verified price, discount and merchant buttons", async () => {
  await guest.goto(`${BASE}/products/${productSlug}`);
  await guest.getByRole("heading", { level: 1, name: productName }).waitFor({ timeout: 20000 });
  const text = await guest.locator("main").innerText();
  const flipkartBtn = guest.locator('a[href*="affid=acceptance"]').first();
  const rel = await flipkartBtn.getAttribute("rel");
  const amazonCheck = guest.locator('a[href*="tag=acceptance-21"]').first();
  const amazonLabel = (await amazonCheck.textContent()) ?? "";
  check("Price ₹999 and 33% discount shown", text.includes("₹999") && text.includes("33% off"));
  check("Buy button uses direct affiliate URL with rel=sponsored nofollow", rel?.includes("sponsored") && rel?.includes("nofollow"), rel ?? "");
  check("Amazon manual price hidden (shows Check Price)", /Check Price/i.test(amazonLabel) && !text.includes("₹949"), amazonLabel.trim());
  check("Amazon Associates disclosure near buttons", text.includes("As an Amazon Associate I earn from qualifying purchases."));
  const ld = await guest.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => JSON.parse(e.textContent)));
  const flat = ld.flat();
  const product = flat.find((x) => x["@type"] === "Product");
  check("Product JSON-LD with offer, no ratings", Boolean(product?.offers) && !JSON.stringify(flat).includes("aggregateRating"));
  check("BreadcrumbList JSON-LD present", flat.some((x) => x["@type"] === "BreadcrumbList"));
  await guest.screenshot({ path: `${SHOTS}/product-desktop.png`, fullPage: true });
});

await step("Guest Buy Now opens the merchant and logs a click (no login required)", async () => {
  const before = (await db.from("affiliate_click_events").select("id", { count: "exact", head: true }).eq("product_id", productId)).count ?? 0;
  await guestCtx.route(/flipkart\.com/, (route) => route.fulfill({ status: 200, body: "merchant stub" }));
  const [popup] = await Promise.all([guest.waitForEvent("popup"), guest.locator('a[href*="affid=acceptance"]').first().click()]);
  const url = popup.url();
  await popup.close();
  await guest.waitForTimeout(1500);
  const after = (await db.from("affiliate_click_events").select("id", { count: "exact", head: true }).eq("product_id", productId)).count ?? 0;
  check("Buy Now opens the exact affiliate URL in a new tab", url.includes("affid=acceptance"), url);
  check("Affiliate click event recorded", after === before + 1, `${before} → ${after}`);
});

await step("Guest wishlist works without login", async () => {
  await guest.getByRole("button", { name: /Save to wishlist/ }).first().click();
  await guest.goto(`${BASE}/wishlist`);
  await guest.getByText(productName).first().waitFor({ timeout: 15000 });
  check("Guest wishlist works without login", true);
});

await step("Guest wishlist merges into the account after sign-up", async () => {
  await signUp(guest, userEmail, "Sam Shopper");
  await guest.goto(`${BASE}/account/wishlist`);
  await guest.getByText(productName).first().waitFor({ timeout: 15000 });
  const { data: profile } = await db.from("profiles").select("id").eq("email", userEmail).single();
  const { data: wl } = await db.from("wishlists").select("id").eq("user_id", profile.id).single();
  const { count } = await db.from("wishlist_items").select("product_id", { count: "exact", head: true }).eq("wishlist_id", wl.id);
  check("Guest wishlist merges into the account after sign-up", count === 1, `${count} item(s) in DB`);
});

await step("Signed-in user removes an item from the wishlist", async () => {
  await guest.getByRole("button", { name: new RegExp(`Remove ${productName}`) }).first().click();
  await guest.waitForTimeout(1500);
  const { data: profile } = await db.from("profiles").select("id").eq("email", userEmail).single();
  const { data: wl } = await db.from("wishlists").select("id").eq("user_id", profile.id).single();
  const { count } = await db.from("wishlist_items").select("product_id", { count: "exact", head: true }).eq("wishlist_id", wl.id);
  check("Signed-in user removes an item from the wishlist", count === 0);
});

await step("Non-staff users cannot open the admin panel", async () => {
  await guest.goto(`${BASE}/admin`);
  await guest.waitForURL(/\/account\?denied=admin/, { timeout: 15000 });
  check("Non-staff users cannot open the admin panel", true);
});

await step("Logout and login", async () => {
  await guest.goto(`${BASE}/account`);
  await guest.getByRole("button", { name: "Log out" }).first().click();
  await guest.waitForURL(`${BASE}/`, { timeout: 15000 });
  await guest.goto(`${BASE}/account`);
  await guest.waitForURL(/\/login\?next=/, { timeout: 15000 });
  check("Signed-out visitors are redirected from /account to /login", true);
  await guest.fill("#login-email", userEmail);
  await guest.fill("#login-password", password);
  await guest.getByRole("button", { name: "Log in", exact: true }).click();
  await guest.waitForURL(/\/account/, { timeout: 15000 });
  check("Login redirects back to the account", true);
});

await step("Password reset via email link", async () => {
  await guest.getByRole("button", { name: "Log out" }).first().click();
  await guest.waitForURL(`${BASE}/`, { timeout: 15000 });
  await guest.goto(`${BASE}/forgot-password`);
  await guest.fill("#fp-email", userEmail);
  await guest.getByRole("button", { name: "Send reset link" }).click();
  await guest.getByText(/Check your email/).waitFor({ timeout: 15000 });
  let link = null;
  for (let i = 0; i < 10 && !link; i++) {
    await guest.waitForTimeout(1000);
    const list = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${userEmail}`)}`)).json();
    const id = list.messages?.[0]?.ID;
    if (id) {
      const msg = await (await fetch(`${MAILPIT}/api/v1/message/${id}`)).json();
      link = (msg.HTML || msg.Text).match(/href="([^"]+verify[^"]+)"/)?.[1]?.replace(/&amp;/g, "&") ?? null;
    }
  }
  if (!link) throw new Error("No reset email found in Mailpit");
  await guest.goto(link);
  await guest.waitForURL(/\/reset-password/, { timeout: 20000 });
  await guest.fill("#rp-password", "NewPass456");
  await guest.fill("#rp-confirm", "NewPass456");
  await guest.getByRole("button", { name: "Update password" }).click();
  await guest.waitForURL(/\/account/, { timeout: 20000 });
  check("Password reset via email link", true);
});

// Blog publishing ----------------------------------------------------------
let publishedPostSlug = "";
await step("AI-assisted draft cannot be published before review, then publishes after sign-off", async () => {
  // Pick an imported AI-assisted draft that hasn't been reviewed yet (keeps the test repeatable).
  const { data: post } = await db
    .from("blog_posts")
    .select("id, slug")
    .eq("ai_assisted", true)
    .is("reviewed_at", null)
    .order("slug")
    .limit(1)
    .single();
  if (!post) throw new Error("No unreviewed AI-assisted draft left — run npm run seed:content -- --force");
  publishedPostSlug = post.slug;
  await admin.goto(`${BASE}/admin/blog/${post.id}`);
  await admin.selectOption('select[name="status"]', "published");
  await submitAndWaitToast(admin, "Save post");
  const blocked = await admin.getByText(/must review it/).first().isVisible();
  check("Unreviewed AI-assisted draft is blocked from publishing", blocked);
  admin.once("dialog", (d) => d.accept());
  await admin.getByRole("button", { name: "Mark as editorially reviewed" }).click();
  await admin.waitForTimeout(1500);
  await admin.reload();
  await admin.selectOption('select[name="status"]', "published");
  await submitAndWaitToast(admin, "Save post");
  const { data: after } = await db.from("blog_posts").select("status").eq("id", post.id).single();
  check("Reviewed article publishes", after?.status === "published");
  await guest.goto(`${BASE}/blog/${post.slug}`);
  await guest.getByRole("heading", { level: 1 }).waitFor({ timeout: 15000 });
  const ld = (await guest.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => JSON.parse(e.textContent)))).flat();
  check("Published article renders with Article + FAQPage JSON-LD", ld.some((x) => x["@type"] === "Article") && ld.some((x) => x["@type"] === "FAQPage"));
});

// Discovery, SEO and mobile -------------------------------------------------
await step("Search, category, store and sitemap include the product", async () => {
  const visible = (text) =>
    guest
      .getByText(text)
      .first()
      .waitFor({ timeout: 15000 })
      .then(() => true, () => false);
  await guest.goto(`${BASE}/search?q=${encodeURIComponent("Acceptance Test Earbuds")}`);
  check("Search finds the product", await visible(productName));
  const robots = await guest.locator('meta[name="robots"]').getAttribute("content");
  check("Search results are noindex", /noindex/.test(robots ?? ""), robots ?? "");
  await guest.goto(`${BASE}/categories/headphones-earbuds`);
  check("Category page lists the product", await visible(productName));
  await guest.goto(`${BASE}/stores/flipkart`);
  check("Store page lists the product", await visible(productName));
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  check("Sitemap includes the product and published article", sitemap.includes(`/products/${productSlug}`) && sitemap.includes(`/blog/${publishedPostSlug}`));
  const canonical = await (await guestCtx.newPage()).goto(`${BASE}/products?sort=price_asc`).then(async (r) => r && (await r.text()));
  check("Filtered listing pages are noindex", /noindex/.test(canonical ?? ""));
});

await step("Mobile layouts have no horizontal overflow", async () => {
  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const page = await mobile.newPage();
  const overflowing = [];
  for (const path of ["/", `/products/${productSlug}`, "/products", "/categories", "/deals", "/stores", "/blog", `/blog/${publishedPostSlug}`, "/login", "/compare"]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (over) overflowing.push(path);
  }
  await page.goto(`${BASE}/products/${productSlug}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${SHOTS}/product-mobile.png`, fullPage: true });
  check("Mobile layouts have no horizontal overflow", overflowing.length === 0, overflowing.join(", "));
  await mobile.close();
});

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
