import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { deleteReport, importReportsCsv, saveReport } from "@/lib/actions/admin/system";
import { getMerchantOptions } from "@/lib/data/admin";
import { first } from "@/lib/search-params";
import { publicEnv } from "@/lib/env";
import { formatINR } from "@/lib/pricing";
import { formatDate, cn } from "@/lib/utils";
import { AdminForm, ConfirmAction, SubmitButton } from "@/components/admin/admin-form";
import { AdminHeader, BarChart, HBarList, Panel, SelectField, StatCard, Table, Td, Th, TextField } from "@/components/admin/ui";
import { Notice } from "@/components/ui/misc";

const RANGES = [7, 30, 90, 365];

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  const days = Number(first((await searchParams).days) ?? "30");
  const range = RANGES.includes(days) ? days : 30;
  const user = await getSessionUser();
  const supabase = await createSessionClient();

  const [trend, byMerchant, bySource, topProducts, searchTerms, popCats, popPosts, popProducts, popStores] = await Promise.all([
    supabase.rpc("admin_click_trend", { p_days: range }),
    supabase.rpc("admin_clicks_by_merchant", { p_days: range }),
    supabase.rpc("admin_clicks_by_source", { p_days: range }),
    supabase.rpc("admin_top_clicked_products", { p_days: range, p_limit: 10 }),
    supabase.rpc("admin_top_search_terms", { p_days: range, p_limit: 20 }),
    supabase.rpc("admin_popular_content", { p_entity_type: "category", p_days: range, p_limit: 10 }),
    supabase.rpc("admin_popular_content", { p_entity_type: "blog_post", p_days: range, p_limit: 10 }),
    supabase.rpc("admin_popular_content", { p_entity_type: "product", p_days: range, p_limit: 10 }),
    supabase.rpc("admin_popular_content", { p_entity_type: "store", p_days: range, p_limit: 10 }),
  ]);

  const ids = (rows: Array<{ entity_id: string }> | null) => (rows ?? []).map((r) => r.entity_id);
  const [catNames, postNames, productNames, storeNames] = await Promise.all([
    supabase.from("categories").select("id, name").in("id", ids(popCats.data).length ? ids(popCats.data) : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("blog_posts").select("id, title").in("id", ids(popPosts.data).length ? ids(popPosts.data) : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("products").select("id, name").in("id", ids(popProducts.data).length ? ids(popProducts.data) : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("merchants").select("id, name").in("id", ids(popStores.data).length ? ids(popStores.data) : ["00000000-0000-0000-0000-000000000000"]),
  ]);
  const nameOf = (rows: Array<{ id: string; name?: string; title?: string }> | null) => new Map((rows ?? []).map((r) => [r.id, r.name ?? r.title ?? r.id]));
  const catMap = nameOf(catNames.data);
  const postMap = nameOf(postNames.data);
  const productMap = nameOf(productNames.data);
  const storeMap = nameOf(storeNames.data);

  const trendData = (trend.data ?? []).map((d) => ({
    label: new Date(d.day).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    value: Number(d.clicks),
  }));
  const totalClicks = trendData.reduce((a, b) => a + b.value, 0);

  const reports = user?.isAdmin
    ? (await supabase.from("affiliate_performance_reports").select("*, merchant:merchants(name)").order("period_start", { ascending: false }).limit(50)).data ?? []
    : [];
  const merchants = user?.isAdmin ? await getMerchantOptions() : [];

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Analytics"
        description="First-party engagement data. Outbound clicks are not sales or commissions."
        actions={
          <nav className="flex gap-1 rounded-xl border border-line bg-white p-1" aria-label="Date range">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin/analytics?days=${r}`}
                className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", r === range ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-canvas")}
              >
                {r === 365 ? "1 year" : `${r} days`}
              </Link>
            ))}
          </nav>
        }
      />
      {!publicEnv.gaMeasurementId && (
        <Notice tone="info">Google Analytics 4 is not configured. Set NEXT_PUBLIC_GA_MEASUREMENT_ID for audience, acquisition and conversion reports in GA4.</Notice>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={`Outbound clicks (${range}d)`} value={totalClicks.toLocaleString("en-IN")} hint="Excludes suspected bots" />
        <StatCard label="Merchants clicked" value={(byMerchant.data ?? []).length} />
        <StatCard label="Unique search terms" value={(searchTerms.data ?? []).length} hint="Top 20 shown below" />
      </div>

      <Panel title="Click trend">
        <BarChart data={trendData} label="Outbound clicks per day" height={180} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Most-clicked merchants">
          <HBarList items={(byMerchant.data ?? []).map((m) => ({ key: m.merchant_id, label: m.merchant_name, value: Number(m.clicks) }))} />
        </Panel>
        <Panel title="Clicks by placement" description="Where on the site visitors clicked Buy Now / Visit Store.">
          <HBarList items={(bySource.data ?? []).map((s) => ({ key: s.source_component, label: s.source_component.replace(/_/g, " "), value: Number(s.clicks) }))} />
        </Panel>
        <Panel title="Most-clicked products">
          <HBarList
            items={(topProducts.data ?? []).map((p) => ({
              key: p.product_id,
              label: <Link href={`/admin/products/${p.product_id}`}>{p.product_name}</Link>,
              value: Number(p.clicks),
            }))}
          />
        </Panel>
        <Panel title="Most-viewed products">
          <HBarList items={(popProducts.data ?? []).map((r) => ({ key: r.entity_id, label: productMap.get(r.entity_id) ?? "Deleted product", value: Number(r.views) }))} />
        </Panel>
        <Panel title="Popular categories">
          <HBarList items={(popCats.data ?? []).map((r) => ({ key: r.entity_id, label: catMap.get(r.entity_id) ?? "Deleted category", value: Number(r.views) }))} />
        </Panel>
        <Panel title="Popular blog posts">
          <HBarList items={(popPosts.data ?? []).map((r) => ({ key: r.entity_id, label: postMap.get(r.entity_id) ?? "Deleted post", value: Number(r.views) }))} />
        </Panel>
        <Panel title="Popular store pages">
          <HBarList items={(popStores.data ?? []).map((r) => ({ key: r.entity_id, label: storeMap.get(r.entity_id) ?? "Deleted store", value: Number(r.views) }))} />
        </Panel>
        <Panel title="Top internal search terms" description="Low average results suggest products or content to add.">
          {(searchTerms.data ?? []).length === 0 ? (
            <p className="text-sm text-ink-400">No searches yet.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {(searchTerms.data ?? []).map((t) => (
                <li key={t.term} className="flex justify-between gap-3 py-1.5">
                  <span className="truncate text-ink-800">{t.term}</span>
                  <span className="shrink-0 text-ink-500">
                    {Number(t.searches)} searches · {Number(t.avg_results)} avg results
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {user?.isAdmin && (
        <Panel
          title="Partner-reported results"
          description="Orders and commissions as reported by each affiliate programme (Amazon Associates, Flipkart Affiliate, networks). Enter them manually or import a CSV — they are never derived from click counts."
        >
          <div className="space-y-6">
            {reports.length > 0 && (
              <Table className="shadow-none">
                <thead>
                  <tr>
                    <Th>Merchant</Th>
                    <Th>Period</Th>
                    <Th>Orders</Th>
                    <Th>Items shipped</Th>
                    <Th>Revenue</Th>
                    <Th>Commission</Th>
                    <Th>Source</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <Td>{r.merchant?.name}</Td>
                      <Td className="text-xs whitespace-nowrap">
                        {formatDate(r.period_start)} – {formatDate(r.period_end)}
                      </Td>
                      <Td>{r.orders ?? "—"}</Td>
                      <Td>{r.items_shipped ?? "—"}</Td>
                      <Td>{r.revenue !== null ? formatINR(r.revenue) : "—"}</Td>
                      <Td>{r.commission !== null ? formatINR(r.commission) : "—"}</Td>
                      <Td className="text-xs">{r.source}</Td>
                      <Td>
                        <ConfirmAction action={deleteReport.bind(null, r.id)} confirm="Delete this report row?" variant="ghost">
                          Delete
                        </ConfirmAction>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            <div className="grid gap-6 lg:grid-cols-2">
              <AdminForm action={saveReport} className="space-y-3 rounded-xl border border-line p-4" resetOnSuccess>
                <p className="font-semibold text-ink-900">Add a report manually</p>
                <SelectField name="merchant_id" label="Merchant" options={merchants.map((m) => ({ value: m.id, label: m.name }))} />
                <div className="grid grid-cols-2 gap-3">
                  <TextField name="period_start" label="From" type="date" required />
                  <TextField name="period_end" label="To" type="date" required />
                  <TextField name="orders" label="Orders" type="number" min={0} />
                  <TextField name="items_shipped" label="Items shipped" type="number" min={0} />
                  <TextField name="revenue" label="Revenue (₹)" />
                  <TextField name="commission" label="Commission (₹)" />
                  <TextField name="clicks_reported" label="Clicks (partner-reported)" type="number" min={0} className="col-span-2" />
                </div>
                <TextField name="notes" label="Notes" />
                <SubmitButton size="sm">Save report</SubmitButton>
              </AdminForm>
              <AdminForm action={importReportsCsv} className="space-y-3 rounded-xl border border-line p-4">
                <p className="font-semibold text-ink-900">Import CSV</p>
                <p className="text-xs text-ink-500">
                  Header: <code>merchant_slug,period_start,period_end,clicks,orders,items_shipped,revenue,commission</code> (dates as YYYY-MM-DD). Re-importing the same
                  merchant and period updates the row.
                </p>
                <input type="file" name="file" accept=".csv,text/csv" required className="block text-sm" />
                <SubmitButton size="sm">Import</SubmitButton>
              </AdminForm>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
