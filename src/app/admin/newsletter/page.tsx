import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { serverEnv } from "@/lib/env.server";
import { deleteSubscriber } from "@/lib/actions/admin/system";
import { formatDateTime } from "@/lib/utils";
import { ConfirmAction } from "@/components/admin/admin-form";
import { AdminHeader, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";

export default async function AdminNewsletterPage() {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, count } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, status, consent_at, consent_source, provider_synced_at, provider_error", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(300);
  return (
    <div>
      <AdminHeader
        title="Newsletter subscribers"
        description={`${count ?? 0} records. Consent text and time are stored for every subscriber.`}
        actions={
          <a href="/admin/newsletter/export" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Export CSV (subscribed)
          </a>
        }
      />
      <Notice tone="info" className="mb-4">
        Provider: <strong>{serverEnv.newsletter.provider}</strong>. {serverEnv.newsletter.provider === "none" ? "Subscribers are stored here only; export them to your email tool. Never email people who haven't consented." : "New consented subscribers are synced automatically."}
      </Notice>
      <Table>
        <thead>
          <tr>
            <Th>Email</Th>
            <Th>Status</Th>
            <Th>Consent</Th>
            <Th>Provider sync</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((s) => (
            <tr key={s.id}>
              <Td className="font-medium text-ink-900">{s.email}</Td>
              <Td>
                <StatusBadge status={s.status} />
              </Td>
              <Td className="text-xs">
                {formatDateTime(s.consent_at)}
                <p className="text-ink-400">{s.consent_source}</p>
              </Td>
              <Td className="text-xs">{s.provider_error ? <span className="text-red-600">{s.provider_error}</span> : s.provider_synced_at ? formatDateTime(s.provider_synced_at) : "—"}</Td>
              <Td>
                <ConfirmAction action={deleteSubscriber.bind(null, s.id)} confirm={`Remove ${s.email}?`} variant="ghost">
                  Remove
                </ConfirmAction>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
