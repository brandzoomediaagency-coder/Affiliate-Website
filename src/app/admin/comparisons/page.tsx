import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/clients";
import { formatDate } from "@/lib/utils";
import { AdminHeader, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminComparisonsPage() {
  const supabase = await createSessionClient();
  const { data } = await supabase.from("comparisons").select("id, title, slug, status, updated_at, items:comparison_items(count)").order("updated_at", { ascending: false });
  return (
    <div>
      <AdminHeader
        title="Comparisons"
        description="Side-by-side editorial comparisons (e.g. budget smartphones, earbuds under ₹2,000)."
        actions={
          <Link href="/admin/comparisons/new" className={buttonVariants({ size: "sm" })}>
            New comparison
          </Link>
        }
      />
      <Table>
        <thead>
          <tr>
            <Th>Title</Th>
            <Th>Products</Th>
            <Th>Status</Th>
            <Th>Updated</Th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((c) => (
            <tr key={c.id}>
              <Td>
                <Link href={`/admin/comparisons/${c.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                  {c.title}
                </Link>
              </Td>
              <Td>{c.items?.[0]?.count ?? 0}</Td>
              <Td>
                <StatusBadge status={c.status} />
              </Td>
              <Td>{formatDate(c.updated_at)}</Td>
            </tr>
          ))}
          {(data ?? []).length === 0 && (
            <tr>
              <Td className="py-10 text-center text-ink-400">No comparisons yet.</Td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
