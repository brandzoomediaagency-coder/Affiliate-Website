import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { first } from "@/lib/search-params";
import { formatDate } from "@/lib/utils";
import { AdminHeader, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { Pagination } from "@/components/shared/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { Badge } from "@/components/ui/misc";

const PAGE_SIZE = 40;

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = first(sp.q)?.trim() ?? "";
  const filter = first(sp.filter) ?? "";
  const page = Math.max(1, Number(first(sp.page) ?? "1") || 1);
  const supabase = await createSessionClient();
  let query = supabase
    .from("profiles")
    .select("id, email, full_name, status, created_at, deletion_requested_at, user_roles(role)", { count: "exact" });
  if (q) query = query.ilike("email", `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`);
  if (filter === "deletion") query = query.not("deletion_requested_at", "is", null);
  if (filter === "disabled") query = query.eq("status", "disabled");
  const { data, count } = await query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  return (
    <div>
      <AdminHeader title="Users & roles" description={`${count ?? 0} accounts. Passwords and auth secrets are never visible here.`} />
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <Input name="q" defaultValue={q} placeholder="Search email…" className="max-w-xs" />
        <select name="filter" defaultValue={filter} className="h-11 rounded-xl border border-line-strong bg-white px-3 text-sm">
          <option value="">All users</option>
          <option value="deletion">Deletion requested</option>
          <option value="disabled">Disabled</option>
        </select>
        <button className={buttonVariants({ variant: "outline" })}>Filter</button>
      </form>
      <Table>
        <thead>
          <tr>
            <Th>User</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Joined</Th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((u) => (
            <tr key={u.id}>
              <Td>
                <Link href={`/admin/users/${u.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                  {u.email ?? u.id}
                </Link>
                {u.full_name && <p className="text-xs text-ink-500">{u.full_name}</p>}
              </Td>
              <Td>
                {u.user_roles.length ? u.user_roles.map((r) => <Badge key={r.role} variant="brand">{r.role}</Badge>) : <span className="text-xs text-ink-400">user</span>}
              </Td>
              <Td>
                <StatusBadge status={u.status} /> {u.deletion_requested_at && <Badge variant="danger">Deletion requested</Badge>}
              </Td>
              <Td>{formatDate(u.created_at)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} totalPages={Math.ceil((count ?? 0) / PAGE_SIZE)} basePath="/admin/users" searchParams={{ q, filter }} />
    </div>
  );
}
