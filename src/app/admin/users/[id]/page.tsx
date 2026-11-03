import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { deleteUserAccount, setUserRole, setUserStatus } from "@/lib/actions/admin/system";
import { formatDateTime } from "@/lib/utils";
import { ConfirmAction } from "@/components/admin/admin-form";
import { AdminHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { Notice } from "@/components/ui/misc";

export default async function AdminUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSessionClient();
  const [{ data: user }, { data: roles }, { count: wishlistCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("user_roles").select("role, created_at").eq("user_id", id),
    supabase.from("wishlist_items").select("product_id, wishlists!inner(user_id)", { count: "exact", head: true }).eq("wishlists.user_id", id),
  ]);
  if (!user) notFound();
  const role = roles?.find((r) => r.role === "admin") ? "admin" : roles?.find((r) => r.role === "editor") ? "editor" : "none";
  const self = admin.id === id;

  return (
    <div className="max-w-3xl space-y-6">
      <AdminHeader title={user.email ?? "User"} back={{ href: "/admin/users", label: "Users" }} description={<StatusBadge status={user.status} />} />
      {user.deletion_requested_at && (
        <Notice tone="warning" title="Account deletion requested">
          Requested {formatDateTime(user.deletion_requested_at)}.{user.deletion_reason ? ` Reason: “${user.deletion_reason}”` : ""} Use “Delete account permanently” below to fulfil it.
        </Notice>
      )}
      <Panel title="Account">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-500">Name</dt>
            <dd className="font-medium text-ink-900">{user.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Joined</dt>
            <dd className="font-medium text-ink-900">{formatDateTime(user.created_at)}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Newsletter</dt>
            <dd className="font-medium text-ink-900">{user.newsletter_opt_in ? "Opted in" : "Not subscribed"}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Wishlist items</dt>
            <dd className="font-medium text-ink-900">{wishlistCount ?? 0}</dd>
          </div>
        </dl>
      </Panel>
      <Panel title="Role" description="Admins manage everything. Editors manage catalogue and content but not users, merchants or settings.">
        <div className="flex flex-wrap gap-2">
          {(["none", "editor", "admin"] as const).map((r) => (
            <ConfirmAction
              key={r}
              action={setUserRole.bind(null, id, r)}
              confirm={`Set role to ${r === "none" ? "regular user" : r}?`}
              variant={role === r ? "primary" : "outline"}
            >
              {r === "none" ? "Regular user" : r[0]!.toUpperCase() + r.slice(1)}
            </ConfirmAction>
          ))}
        </div>
        {self && <p className="mt-2 text-xs text-ink-500">You cannot remove your own admin role.</p>}
      </Panel>
      {!self && (
        <Panel title="Account controls">
          <div className="flex flex-wrap gap-2">
            {user.status === "active" ? (
              <ConfirmAction action={setUserStatus.bind(null, id, "disabled")} confirm="Disable this account? The user will be signed out and blocked from signing in.">
                Disable account
              </ConfirmAction>
            ) : (
              <ConfirmAction action={setUserStatus.bind(null, id, "active")}>Re-enable account</ConfirmAction>
            )}
            <ConfirmAction action={deleteUserAccount.bind(null, id)} confirm="Permanently delete this account and its personal data? This cannot be undone." variant="danger">
              Delete account permanently
            </ConfirmAction>
          </div>
        </Panel>
      )}
    </div>
  );
}
