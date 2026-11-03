import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/clients";
import { verifyListingUrl } from "@/lib/actions/admin/listings";
import { first } from "@/lib/search-params";
import { formatINR } from "@/lib/pricing";
import { formatDateTime, hoursAgoIso } from "@/lib/utils";
import { getMerchantOptions } from "@/lib/data/admin";
import { AdminHeader, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/admin-form";
import { Pagination } from "@/components/shared/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/form-controls";
import { Badge } from "@/components/ui/misc";

const PAGE_SIZE = 40;

export default async function AdminListingsPage({ searchParams }: PageProps<"/admin/listings">) {
  const sp = await searchParams;
  const merchant = first(sp.merchant) ?? "";
  const urlStatus = first(sp.url_status) ?? "";
  const stale = first(sp.stale) === "1";
  const page = Math.max(1, Number(first(sp.page) ?? "1") || 1);
  const supabase = await createSessionClient();
  const merchants = await getMerchantOptions();

  let query = supabase
    .from("product_listings")
    .select("id, variant_label, current_price, price_checked_at, price_source, availability, url_status, url_checked_at, is_active, affiliate_url, sync_error, merchant:merchants(name), product:products(id, name, status)", { count: "exact" });
  if (/^[0-9a-f-]{36}$/i.test(merchant)) query = query.eq("merchant_id", merchant);
  if (["unchecked", "ok", "redirected", "broken", "error"].includes(urlStatus)) query = query.eq("url_status", urlStatus);
  if (stale) query = query.not("current_price", "is", null).lt("price_checked_at", hoursAgoIso(72));
  const { data, count } = await query.order("updated_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  return (
    <div>
      <AdminHeader
        title="Affiliate listings"
        description="Every merchant link across all products. Verify links and keep prices fresh."
        actions={
          <Link href="/admin/listings/new" className={buttonVariants({ size: "sm" })}>
            Add listing
          </Link>
        }
      />
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <Select name="merchant" defaultValue={merchant} className="max-w-48">
          <option value="">All merchants</option>
          {merchants.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
        <Select name="url_status" defaultValue={urlStatus} className="max-w-48">
          <option value="">Any link status</option>
          {["unchecked", "ok", "redirected", "broken", "error"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 rounded-xl border border-line-strong bg-white px-3 text-sm">
          <input type="checkbox" name="stale" value="1" defaultChecked={stale} /> Prices older than 72h
        </label>
        <button className={buttonVariants({ variant: "outline" })}>Filter</button>
      </form>
      <Table>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Merchant</Th>
            <Th>Price</Th>
            <Th>Verified</Th>
            <Th>Link</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((l) => (
            <tr key={l.id}>
              <Td>
                {l.product && (
                  <Link href={`/admin/products/${l.product.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                    {l.product.name}
                  </Link>
                )}
                <div className="mt-0.5 flex gap-1.5">
                  {!l.is_active && <Badge variant="outline">Inactive</Badge>}
                  {l.product?.status !== "published" && <Badge variant="neutral">{l.product?.status}</Badge>}
                  {l.variant_label && <span className="text-xs text-ink-500">{l.variant_label}</span>}
                </div>
              </Td>
              <Td>{l.merchant?.name}</Td>
              <Td>
                {l.current_price !== null ? formatINR(l.current_price) : <span className="text-ink-400">—</span>}
                <p className="text-xs text-ink-400">{l.price_source.replace(/_/g, " ")}</p>
                {l.sync_error && <p className="text-xs text-red-600">{l.sync_error}</p>}
              </Td>
              <Td className="text-xs whitespace-nowrap">{l.price_checked_at ? formatDateTime(l.price_checked_at) : "—"}</Td>
              <Td>
                <StatusBadge status={l.url_status} />
                {l.url_checked_at && <p className="text-xs text-ink-400">{formatDateTime(l.url_checked_at)}</p>}
              </Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <ConfirmAction action={verifyListingUrl.bind(null, l.id)} variant="ghost">
                    Verify
                  </ConfirmAction>
                  <Link href={`/admin/listings/${l.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    Edit
                  </Link>
                </div>
              </Td>
            </tr>
          ))}
          {(data ?? []).length === 0 && (
            <tr>
              <Td className="py-10 text-center text-ink-400">No listings match.</Td>
            </tr>
          )}
        </tbody>
      </Table>
      <Pagination page={page} totalPages={Math.ceil((count ?? 0) / PAGE_SIZE)} basePath="/admin/listings" searchParams={{ merchant, url_status: urlStatus, stale: stale ? "1" : undefined }} />
    </div>
  );
}
