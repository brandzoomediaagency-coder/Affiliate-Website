/**
 * Row Level Security / permission tests against a Supabase instance.
 *   node tests/e2e/rls.mjs
 * Creates two throwaway users and verifies that regular users and anonymous
 * visitors cannot read private data, escalate privileges or modify catalogue
 * data (prices, affiliate URLs).
 */
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(URL, SERVICE, opts);
const anon = createClient(URL, ANON, opts);

let passed = 0;
let failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "✔" : "✘"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function makeUser(tag) {
  const email = `rls-${tag}-${Date.now().toString(36)}@example.com`;
  const { error } = await admin.auth.admin.createUser({ email, password: "TestPass123", email_confirm: true });
  if (error) throw error;
  const client = createClient(URL, ANON, opts);
  const { data, error: signInError } = await client.auth.signInWithPassword({ email, password: "TestPass123" });
  if (signInError) throw signInError;
  return { client, id: data.user.id, email };
}

const a = await makeUser("a");
const b = await makeUser("b");

// Wishlists are private
const { data: product } = await admin.from("products").select("id").eq("status", "published").limit(1).maybeSingle();
const { data: wlB } = await b.client.from("wishlists").select("id").eq("user_id", b.id).single();
if (product) await b.client.from("wishlist_items").insert({ wishlist_id: wlB.id, product_id: product.id });
const { data: aSeesB } = await a.client.from("wishlist_items").select("*").eq("wishlist_id", wlB.id);
check("User A cannot read user B's wishlist items", (aSeesB ?? []).length === 0);
const { error: aWritesB } = await a.client.from("wishlist_items").insert({ wishlist_id: wlB.id, product_id: product?.id ?? "00000000-0000-0000-0000-000000000000" });
check("User A cannot add items to user B's wishlist", Boolean(aWritesB));
const { data: profiles } = await a.client.from("profiles").select("id");
check("User A can only read their own profile", (profiles ?? []).length === 1 && profiles[0].id === a.id);

// Privilege escalation
const { error: roleErr } = await a.client.from("user_roles").insert({ user_id: a.id, role: "admin" });
check("User cannot grant themselves the admin role", Boolean(roleErr));
const { error: statusErr } = await a.client.from("profiles").update({ status: "active", email: "x@example.com" }).eq("id", a.id);
check("User cannot change admin-controlled profile columns", Boolean(statusErr));
const { error: nameErr } = await a.client.from("profiles").update({ full_name: "Allowed Name" }).eq("id", a.id);
check("User can update their own name", !nameErr);
const { error: rpcErr } = await a.client.rpc("admin_overview_stats");
check("User cannot call admin analytics functions", Boolean(rpcErr));
const { error: rlErr } = await a.client.rpc("check_rate_limit", { p_key: "x", p_max: 1, p_window_seconds: 1 });
check("User cannot call service-only functions", Boolean(rlErr));

// Catalogue integrity
const { data: listing } = await admin.from("product_listings").select("id, affiliate_url, current_price").limit(1).maybeSingle();
if (listing) {
  await a.client.from("product_listings").update({ affiliate_url: "https://evil.example/", current_price: 1 }).eq("id", listing.id);
  await anon.from("product_listings").update({ affiliate_url: "https://evil.example/" }).eq("id", listing.id);
  const { data: after } = await admin.from("product_listings").select("affiliate_url, current_price").eq("id", listing.id).single();
  check("Users/anon cannot modify affiliate URLs or prices", after.affiliate_url === listing.affiliate_url && String(after.current_price) === String(listing.current_price));
}
const { error: prodErr } = await a.client.from("products").insert({ name: "Hack", slug: `hack-${Date.now()}` });
check("Users cannot create products", Boolean(prodErr));
const { error: clickErr } = await anon.from("affiliate_click_events").insert({ source_path: "/" });
check("Anonymous visitors cannot write click events directly", Boolean(clickErr));

// Private/admin data
for (const table of ["affiliate_programs", "newsletter_subscribers", "contact_messages", "admin_audit_log", "affiliate_click_events", "search_queries", "blog_revisions", "rate_limits"]) {
  const { data } = await a.client.from(table).select("*").limit(5);
  const { data: anonData } = await anon.from(table).select("*").limit(5);
  check(`Private table "${table}" is not readable by users or anon`, (data ?? []).length === 0 && (anonData ?? []).length === 0);
}
const { data: drafts } = await anon.from("blog_posts").select("id").in("status", ["draft", "in_review"]);
check("Draft blog posts are not public", (drafts ?? []).length === 0);
const { data: draftProducts } = await anon.from("products").select("id").neq("status", "published");
check("Draft products are not public", (draftProducts ?? []).length === 0);

// Cleanup
await admin.auth.admin.deleteUser(a.id);
await admin.auth.admin.deleteUser(b.id);
console.log(`\n${passed}/${passed + failed} permission checks passed.`);
process.exit(failed ? 1 : 0);
