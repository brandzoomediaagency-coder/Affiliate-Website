import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { getAdapter } from "@/lib/affiliate/registry";
import { AdminHeader, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";

export default async function AdminMerchantsPage() {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("merchants")
    .select("id, name, slug, is_active, allow_manual_prices, allowed_domains, listings:product_listings(count), programs:affiliate_programs(id, name, status, adapter_key, api_status, is_default)")
    .order("sort_order")
    .order("name");
  return (
    <div>
      <AdminHeader
        title="Merchants & affiliate programmes"
        description="Stores you link to, their allowed link domains, pricing rules and affiliate programme integrations."
        actions={
          <Link href="/admin/merchants/new" className={buttonVariants({ size: "sm" })}>
            Add merchant
          </Link>
        }
      />
      <Table>
        <thead>
          <tr>
            <Th>Merchant</Th>
            <Th>Default programme</Th>
            <Th>Integration</Th>
            <Th>Listings</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((m) => {
            const program = m.programs.find((p) => p.is_default) ?? m.programs[0];
            const adapter = getAdapter(program?.adapter_key);
            return (
              <tr key={m.id}>
                <Td>
                  <Link href={`/admin/merchants/${m.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                    {m.name}
                  </Link>
                  <p className="text-xs text-ink-400">{m.allowed_domains.join(", ") || "No allowed domains"}</p>
                </Td>
                <Td>
                  {program ? (
                    <>
                      {program.name} <StatusBadge status={program.status} />
                    </>
                  ) : (
                    <span className="text-ink-400">None</span>
                  )}
                </Td>
                <Td>
                  <p>{adapter.label}</p>
                  {adapter.supportsApi && (
                    <span className="text-xs">
                      API: {adapter.isConfigured() ? <Badge variant="success">credentials set</Badge> : <Badge variant="neutral">not configured</Badge>}
                    </span>
                  )}
                  {!m.allow_manual_prices && <p className="text-xs text-saffron-700">Manual prices hidden</p>}
                </Td>
                <Td>{m.listings?.[0]?.count ?? 0}</Td>
                <Td>{m.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Inactive</Badge>}</Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
