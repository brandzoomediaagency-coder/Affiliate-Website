import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/clients";
import { formatDateTime } from "@/lib/utils";
import { AdminHeader, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";

export default async function AdminDealsPage() {
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("offers")
    .select("id, title, status, discount_text, expires_at, verified_at, click_count, is_featured, merchant:merchants(name)")
    .order("updated_at", { ascending: false })
    .limit(200);
  const now = new Date().toISOString();
  return (
    <div>
      <AdminHeader
        title="Deals & offers"
        description="Verified merchant offers. Expired offers disappear from the site automatically — no countdown timers."
        actions={
          <Link href="/admin/deals/new" className={buttonVariants({ size: "sm" })}>
            Add offer
          </Link>
        }
      />
      <Table>
        <thead>
          <tr>
            <Th>Offer</Th>
            <Th>Merchant</Th>
            <Th>Status</Th>
            <Th>Expires</Th>
            <Th>Clicks</Th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((o) => (
            <tr key={o.id}>
              <Td>
                <Link href={`/admin/deals/${o.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                  {o.title}
                </Link>
                {o.discount_text && <p className="text-xs text-emerald-700">{o.discount_text}</p>}
                {o.is_featured && <Badge variant="brand">Featured</Badge>}
              </Td>
              <Td>{o.merchant?.name}</Td>
              <Td>
                <StatusBadge status={o.status} /> {o.expires_at && o.expires_at < now && <Badge variant="danger">Expired</Badge>}
              </Td>
              <Td className="text-xs">{o.expires_at ? formatDateTime(o.expires_at) : "No expiry"}</Td>
              <Td>{o.click_count}</Td>
            </tr>
          ))}
          {(data ?? []).length === 0 && (
            <tr>
              <Td className="py-10 text-center text-ink-400">No offers yet.</Td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
