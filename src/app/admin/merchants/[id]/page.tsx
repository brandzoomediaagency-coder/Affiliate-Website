import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { deleteMerchant, deleteProgram, saveMerchant, saveProgram, syncMerchantNow, testProgramConnection } from "@/lib/actions/admin/merchants";
import { getAdapter, listAdapters } from "@/lib/affiliate/registry";
import { formatDateTime } from "@/lib/utils";
import { AdminForm, ConfirmAction, SubmitButton } from "@/components/admin/admin-form";
import { AdminHeader, CheckField, Panel, SelectField, StatusBadge, TextAreaField, TextField } from "@/components/admin/ui";
import { Badge, Notice } from "@/components/ui/misc";
import { MerchantFields } from "../merchant-fields";
import type { Tables } from "@/lib/supabase/database.types";

function ProgramFields({ merchantId, program }: { merchantId: string; program?: Tables<"affiliate_programs"> }) {
  return (
    <>
      <input type="hidden" name="merchant_id" value={merchantId} />
      <div className="grid gap-4 md:grid-cols-3">
        <TextField name="name" label="Programme name" defaultValue={program?.name} required />
        <TextField name="network" label="Network" defaultValue={program?.network} placeholder="Direct, or the network name" />
        <TextField name="tracking_id_ref" label="Tracking id (reference only)" defaultValue={program?.tracking_id_ref} hint="Not a secret. Secrets belong in server env vars." />
        <SelectField
          name="status"
          label="Programme status"
          defaultValue={program?.status ?? "not_applied"}
          options={["not_applied", "applied", "approved", "paused", "rejected", "inactive"].map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
        />
        <SelectField
          name="integration_type"
          label="Integration type"
          defaultValue={program?.integration_type ?? "manual"}
          options={["manual", "api", "feed", "network"].map((s) => ({ value: s, label: s }))}
        />
        <SelectField
          name="adapter_key"
          label="Adapter"
          defaultValue={program?.adapter_key ?? "generic"}
          options={listAdapters().map((a) => ({ value: a.key, label: a.label }))}
        />
        <SelectField
          name="api_status"
          label="API status"
          defaultValue={program?.api_status ?? "not_configured"}
          options={["not_configured", "credentials_added", "active", "error", "disabled"].map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
          hint="“Active” is only allowed when credentials are configured."
        />
        <TextField name="documentation_url" label="Documentation URL" defaultValue={program?.documentation_url} type="url" />
        <TextField name="terms_url" label="Programme terms URL" defaultValue={program?.terms_url} type="url" />
        <TextAreaField name="notes" label="Notes" defaultValue={program?.notes} rows={3} className="md:col-span-3" />
        <CheckField name="is_default" label="Default programme for this merchant" defaultChecked={program?.is_default ?? false} />
      </div>
    </>
  );
}

export default async function EditMerchantPage({ params }: PageProps<"/admin/merchants/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSessionClient();
  const [{ data: merchant }, { data: programs }] = await Promise.all([
    supabase.from("merchants").select("*").eq("id", id).maybeSingle(),
    supabase.from("affiliate_programs").select("*").eq("merchant_id", id).order("created_at"),
  ]);
  if (!merchant) notFound();
  const defaultProgram = (programs ?? []).find((p) => p.is_default);
  const adapter = getAdapter(defaultProgram?.adapter_key);

  return (
    <div className="max-w-4xl space-y-6">
      <AdminHeader
        title={merchant.name}
        back={{ href: "/admin/merchants", label: "Merchants" }}
        actions={
          <ConfirmAction action={deleteMerchant.bind(null, id)} confirm={`Delete ${merchant.name}?`} variant="danger">
            Delete
          </ConfirmAction>
        }
      />

      <Panel title="Integration" description={adapter.description}>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant="brand">{adapter.label}</Badge>
          {adapter.supportsApi ? (
            adapter.isConfigured() ? (
              <Badge variant="success">Credentials configured</Badge>
            ) : (
              <Badge variant="neutral">Credentials not configured</Badge>
            )
          ) : (
            <Badge variant="outline">Manual links only</Badge>
          )}
          {defaultProgram?.last_sync_at && (
            <span className="text-ink-500">
              Last sync {formatDateTime(defaultProgram.last_sync_at)} — {defaultProgram.last_sync_status}
            </span>
          )}
        </div>
        {adapter.supportsApi && !adapter.isConfigured() && (
          <Notice tone="info" className="mt-3">
            Manual affiliate listings are fully functional. To enable API refresh, set these server environment variables: {adapter.requiredEnv.join(", ")}.
          </Notice>
        )}
        {defaultProgram?.last_sync_message && <p className="mt-3 text-xs whitespace-pre-wrap text-ink-500">{defaultProgram.last_sync_message}</p>}
        {defaultProgram && adapter.supportsApi && (
          <div className="mt-4 flex gap-2">
            <ConfirmAction action={testProgramConnection.bind(null, defaultProgram.id)}>Test API connection</ConfirmAction>
            <ConfirmAction action={syncMerchantNow.bind(null, id)} confirm="Refresh all listings for this merchant from the official API now?">
              Sync listings now
            </ConfirmAction>
          </div>
        )}
      </Panel>

      <Panel title="Affiliate programmes">
        <div className="space-y-4">
          {(programs ?? []).map((p) => (
            <details key={p.id} className="rounded-xl border border-line p-4">
              <summary className="flex cursor-pointer flex-wrap items-center gap-2 font-semibold text-ink-900">
                {p.name} <StatusBadge status={p.status} /> <StatusBadge status={p.api_status} /> {p.is_default && <Badge variant="brand">Default</Badge>}
              </summary>
              <AdminForm action={saveProgram.bind(null, p.id)} className="mt-4 space-y-4">
                <ProgramFields merchantId={id} program={p} />
                <div className="flex gap-2">
                  <SubmitButton size="sm">Save programme</SubmitButton>
                  <ConfirmAction action={deleteProgram.bind(null, p.id)} confirm="Delete this programme?" variant="ghost">
                    Delete
                  </ConfirmAction>
                </div>
              </AdminForm>
            </details>
          ))}
          <details className="rounded-xl border border-dashed border-line-strong p-4">
            <summary className="cursor-pointer font-semibold text-brand-700">+ Add programme (e.g. a network)</summary>
            <AdminForm action={saveProgram.bind(null, null)} className="mt-4 space-y-4">
              <ProgramFields merchantId={id} />
              <SubmitButton size="sm">Add programme</SubmitButton>
            </AdminForm>
          </details>
        </div>
      </Panel>

      <AdminForm action={saveMerchant.bind(null, id)}>
        <MerchantFields merchant={merchant} />
      </AdminForm>
    </div>
  );
}
