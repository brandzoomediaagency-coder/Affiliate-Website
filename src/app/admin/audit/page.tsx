import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { formatDateTime } from "@/lib/utils";
import { AdminHeader, Table, Td, Th } from "@/components/admin/ui";

export default async function AuditPage() {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data } = await supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(300);
  const actorIds = [...new Set((data ?? []).map((d) => d.actor_id).filter((x): x is string => Boolean(x)))];
  const { data: actors } = actorIds.length ? await supabase.from("profiles").select("id, email").in("id", actorIds) : { data: [] };
  const emails = new Map((actors ?? []).map((a) => [a.id, a.email]));
  return (
    <div>
      <AdminHeader title="Audit log" description="The latest 300 administrative actions." />
      <Table>
        <thead>
          <tr>
            <Th>When</Th>
            <Th>Who</Th>
            <Th>Action</Th>
            <Th>Summary</Th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((a) => (
            <tr key={a.id}>
              <Td className="text-xs whitespace-nowrap">{formatDateTime(a.created_at)}</Td>
              <Td className="text-xs">{(a.actor_id && emails.get(a.actor_id)) ?? "—"}</Td>
              <Td className="font-mono text-xs">{a.action}</Td>
              <Td className="text-xs">{a.summary}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
