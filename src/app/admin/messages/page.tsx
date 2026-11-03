import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { deleteMessage, setMessageStatus } from "@/lib/actions/admin/system";
import { formatDateTime } from "@/lib/utils";
import { ConfirmAction } from "@/components/admin/admin-form";
import { AdminHeader, StatusBadge } from "@/components/admin/ui";
import { EmptyState } from "@/components/ui/misc";

export default async function AdminMessagesPage() {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data } = await supabase.from("contact_messages").select("*").neq("status", "archived").order("created_at", { ascending: false }).limit(200);
  return (
    <div className="max-w-4xl">
      <AdminHeader title="Contact messages" description="Messages from the contact form. Reply from your own email client." />
      {(data ?? []).length === 0 ? (
        <EmptyState title="No messages" />
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((m) => (
            <article key={m.id} className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-ink-900">{m.subject}</p>
                  <p className="text-sm text-ink-500">
                    {m.name} · <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="text-brand-700 underline">{m.email}</a> · {formatDateTime(m.created_at)}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </div>
              <p className="mt-3 text-sm whitespace-pre-wrap text-ink-700">{m.message}</p>
              <div className="mt-4 flex gap-2">
                {m.status === "new" && <ConfirmAction action={setMessageStatus.bind(null, m.id, "read")}>Mark read</ConfirmAction>}
                <ConfirmAction action={setMessageStatus.bind(null, m.id, "archived")} variant="ghost">
                  Archive
                </ConfirmAction>
                <ConfirmAction action={deleteMessage.bind(null, m.id)} confirm="Delete this message?" variant="ghost">
                  Delete
                </ConfirmAction>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
