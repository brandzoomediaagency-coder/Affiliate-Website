import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/clients";
import { AdminHeader, Table, Td, Th } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";

export default async function AdminBannersPage() {
  const supabase = await createSessionClient();
  const { data } = await supabase.from("banners").select("*").order("placement").order("sort_order");
  return (
    <div>
      <AdminHeader
        title="Banners & hero"
        description="Edit the homepage hero, promotional cards and the deals banner."
        actions={
          <Link href="/admin/banners/new" className={buttonVariants({ size: "sm" })}>
            Add banner
          </Link>
        }
      />
      <Table>
        <thead>
          <tr>
            <Th>Headline</Th>
            <Th>Placement</Th>
            <Th>Order</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((b) => (
            <tr key={b.id}>
              <Td>
                <Link href={`/admin/banners/${b.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                  {b.title}
                </Link>
              </Td>
              <Td>{b.placement.replace(/_/g, " ")}</Td>
              <Td>{b.sort_order}</Td>
              <Td>{b.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Inactive</Badge>}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
