import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { isServiceRoleConfigured, serverEnv } from "@/lib/env.server";
import { listAdapters } from "@/lib/affiliate/registry";
import { formatDateTime } from "@/lib/utils";
import { formatINR } from "@/lib/pricing";
import { AdminHeader, BarChart, HBarList, Panel, StatCard, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { Notice } from "@/components/ui/misc";
import { buttonVariants } from "@/components/ui/button";

type Stats = Record<string, number>;

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const [user, sp] = await Promise.all([getSessionUser(), searchParams]);
  const supabase = await createSessionClient();
  const [statsRes, trendRes, byMerchantRes, topProductsRes, recentListingsRes, brokenRes] = await Promise.all([
    supabase.rpc("admin_overview_stats"),
    supabase.rpc("admin_click_trend", { p_days: 30 }),
    supabase.rpc("admin_clicks_by_merchant", { p_days: 30 }),
    supabase.rpc("admin_top_clicked_products", { p_days: 30, p_limit: 8 }),
    supabase
      .from("product_listings")
      .select("id, updated_at, current_price, price_checked_at, url_status, is_active, merchant:merchants(name), product:products(id, name)")
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase.from("product_listings").select("id", { count: "exact", head: true }).eq("url_status", "broken"),
  ]);
  const stats = (statsRes.data ?? {}) as Stats;
  const trend = (trendRes.data ?? []).map((d) => ({ label: new Date(d.day).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), value: Number(d.clicks) }));
  const deletionRequests = user?.isAdmin
    ? (await supabase.from("profiles").select("id", { count: "exact", head: true }).not("deletion_requested_at", "is", null)).count ?? 0
    : 0;
  const unconfiguredApis = listAdapters().filter((a) => a.supportsApi && !a.isConfigured());

  return (
    <div className="space-y-6">
      <AdminHeader
        title={`Welcome${user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}`}
        description="Overview of your catalogue, content and outbound affiliate clicks."
        actions={
          <>
            <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
              Add product
            </Link>
            <Link href="/admin/blog/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
              New article
            </Link>
          </>
        }
      />

      {sp.denied === "admin-only" && <Notice tone="warning">That section is limited to administrators.</Notice>}
      {!isServiceRoleConfigured() && (
        <Notice tone="error" title="SUPABASE_SECRET_KEY is not set">
          Click tracking, newsletter sign-ups, contact messages, rate limiting and user management need the server-side secret key.
        </Notice>
      )}
      {!serverEnv.ipHashSalt && <Notice tone="warning">Set IP_HASH_SALT so analytics IP hashes are properly salted.</Notice>}
      {(deletionRequests > 0 || (stats.messages_new ?? 0) > 0 || (brokenRes.count ?? 0) > 0) && (
        <div className="grid gap-3 md:grid-cols-3">
          {deletionRequests > 0 && (
            <Notice tone="warning" title="Account deletion requests">
              <Link href="/admin/users?filter=deletion" className="underline">
                {deletionRequests} pending
              </Link>
            </Notice>
          )}
          {(stats.messages_new ?? 0) > 0 && (
            <Notice tone="info" title="New contact messages">
              <Link href="/admin/messages" className="underline">
                {stats.messages_new} unread
              </Link>
            </Notice>
          )}
          {(brokenRes.count ?? 0) > 0 && (
            <Notice tone="error" title="Broken affiliate links">
              <Link href="/admin/listings?url_status=broken" className="underline">
                {brokenRes.count} listing(s) need attention
              </Link>
            </Notice>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Products" value={stats.products_total ?? 0} hint={`${stats.products_published ?? 0} published`} />
        <StatCard label="Categories" value={stats.categories_total ?? 0} />
        <StatCard label="Merchants" value={stats.merchants_total ?? 0} hint={`${stats.merchants_active ?? 0} active`} />
        <StatCard label="Listings" value={stats.listings_total ?? 0} hint={`${stats.listings_active ?? 0} active`} />
        <StatCard label="Live offers" value={stats.offers_live ?? 0} />
        <StatCard label="Published posts" value={stats.posts_published ?? 0} hint={`${stats.posts_drafts ?? 0} drafts`} />
        <StatCard label="Clicks (30d)" value={(stats.clicks_30d ?? 0).toLocaleString("en-IN")} hint={`${stats.clicks_7d ?? 0} in 7 days`} />
        <StatCard label="Users" value={stats.users_total ?? 0} hint={`${stats.subscribers_total ?? 0} subscribers`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel
          title="Outbound affiliate clicks — last 30 days"
          description="Clicks on Buy Now / Visit Store links. A click is not a sale or commission — see partner reports in Analytics."
        >
          <BarChart data={trend} label="Daily outbound clicks" />
        </Panel>
        <Panel title="Clicks by merchant (30 days)">
          <HBarList items={(byMerchantRes.data ?? []).map((m) => ({ key: m.merchant_id, label: m.merchant_name, value: Number(m.clicks) }))} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Most-clicked products (30 days)">
          <HBarList
            items={(topProductsRes.data ?? []).map((p) => ({
              key: p.product_id,
              label: (
                <Link href={`/admin/products/${p.product_id}`} className="hover:text-brand-700">
                  {p.product_name}
                </Link>
              ),
              value: Number(p.clicks),
            }))}
          />
        </Panel>
        <Panel title="Recently updated listings" actions={<Link href="/admin/listings" className="text-sm font-semibold text-brand-700">All listings →</Link>}>
          <Table className="shadow-none">
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Merchant</Th>
                <Th>Price</Th>
                <Th>Link</Th>
              </tr>
            </thead>
            <tbody>
              {(recentListingsRes.data ?? []).map((l) => (
                <tr key={l.id}>
                  <Td>
                    {l.product && (
                      <Link href={`/admin/listings/${l.id}`} className="font-medium text-ink-900 hover:text-brand-700">
                        {l.product.name}
                      </Link>
                    )}
                    <p className="text-xs text-ink-400">{formatDateTime(l.updated_at)}</p>
                  </Td>
                  <Td>{l.merchant?.name}</Td>
                  <Td>{l.current_price !== null ? formatINR(l.current_price) : <span className="text-ink-400">—</span>}</Td>
                  <Td>
                    <StatusBadge status={l.url_status} />
                  </Td>
                </tr>
              ))}
              {(recentListingsRes.data ?? []).length === 0 && (
                <tr>
                  <Td className="text-ink-400">No listings yet.</Td>
                </tr>
              )}
            </tbody>
          </Table>
        </Panel>
      </div>

      {unconfiguredApis.length > 0 && (
        <Panel title="Merchant API integrations" description="Manual affiliate links work without APIs. APIs add automatic price/availability refresh.">
          <ul className="space-y-2 text-sm">
            {unconfiguredApis.map((a) => (
              <li key={a.key} className="flex flex-wrap items-center gap-2">
                <StatusBadge status="not_configured" /> <strong>{a.label}</strong>
                <span className="text-ink-500">— set {a.requiredEnv.join(", ")}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
