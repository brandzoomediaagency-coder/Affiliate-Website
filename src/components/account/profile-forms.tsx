"use client";

import { useActionState, useTransition } from "react";
import Image from "next/image";
import {
  cancelAccountDeletion,
  clearRecentlyViewed,
  removeAvatar,
  requestAccountDeletion,
  updateProfile,
  uploadAvatar,
} from "@/lib/actions/account";
import { initialActionResult, type ActionResult } from "@/lib/validation/form";
import { formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form-controls";
import { Card, Notice } from "@/components/ui/misc";
import { useToast } from "@/components/providers/toast-provider";

export type ProfileData = {
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  newsletterOptIn: boolean;
  productUpdates: boolean;
  editorialDigest: boolean;
  trackRecentlyViewed: boolean;
  deletionRequestedAt: string | null;
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold text-ink-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </Card>
  );
}

export function ProfileForms({ profile }: { profile: ProfileData }) {
  const { toast } = useToast();
  const [state, action, pending] = useActionState(updateProfile, initialActionResult);
  const [avatarState, avatarAction, avatarPending] = useActionState(uploadAvatar, initialActionResult);
  const [deleteState, deleteAction, deletePending] = useActionState(requestAccountDeletion, initialActionResult);
  const [busy, startTransition] = useTransition();

  const run = (fn: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const result = await fn();
      toast({ tone: result.ok ? "success" : "error", title: result.message ?? (result.ok ? "Done" : "Failed") });
    });

  return (
    <div className="space-y-6">
      <Section title="Profile photo">
        <div className="flex flex-wrap items-center gap-5">
          <span className="relative grid size-20 place-items-center overflow-hidden rounded-2xl bg-brand-600 text-2xl font-bold text-white">
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt="Your profile photo" fill sizes="80px" className="object-cover" />
            ) : (
              getInitials(profile.fullName || profile.email)
            )}
          </span>
          <form action={avatarAction} className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="avatar">
              Choose a profile photo
            </label>
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className="max-w-56 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-700"
            />
            <Button type="submit" size="sm" disabled={avatarPending}>
              {avatarPending ? "Uploading…" : "Upload"}
            </Button>
            {profile.avatarUrl && (
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => run(removeAvatar)}>
                Remove
              </Button>
            )}
          </form>
        </div>
        <p className="mt-3 text-xs text-ink-500">JPEG, PNG or WebP, up to 2 MB.</p>
        {avatarState.message && (
          <Notice tone={avatarState.ok ? "success" : "error"} className="mt-3">
            {avatarState.message}
          </Notice>
        )}
      </Section>

      <form action={action} className="space-y-6">
        <Section title="Personal details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="full_name" errors={state.fieldErrors?.full_name}>
              <Input id="full_name" name="full_name" defaultValue={profile.fullName ?? ""} autoComplete="name" maxLength={120} />
            </Field>
            <Field label="Email" htmlFor="email" hint="Contact support to change the email on your account.">
              <Input id="email" value={profile.email ?? ""} disabled readOnly />
            </Field>
          </div>
        </Section>

        <Section title="Email preferences" description="We only email you about things you choose below.">
          <div className="space-y-3 text-sm text-ink-700">
            <label className="flex items-start gap-2.5">
              <Checkbox name="newsletter_opt_in" defaultChecked={profile.newsletterOptIn} className="mt-0.5" />
              <span>
                <strong className="text-ink-900">Newsletter</strong> — occasional buying guides and curated picks. You can unsubscribe at any time.
              </span>
            </label>
            <label className="flex items-start gap-2.5">
              <Checkbox name="product_updates" defaultChecked={profile.productUpdates} className="mt-0.5" />
              <span>
                <strong className="text-ink-900">Product updates</strong> — notices about products in your wishlist (when available).
              </span>
            </label>
            <label className="flex items-start gap-2.5">
              <Checkbox name="editorial_digest" defaultChecked={profile.editorialDigest} className="mt-0.5" />
              <span>
                <strong className="text-ink-900">Editorial digest</strong> — a summary of new guides and comparisons.
              </span>
            </label>
          </div>
        </Section>

        <Section title="Privacy">
          <label className="flex items-start gap-2.5 text-sm text-ink-700">
            <Checkbox name="track_recently_viewed" defaultChecked={profile.trackRecentlyViewed} className="mt-0.5" />
            <span>
              <strong className="text-ink-900">Remember products I view</strong> — used for &quot;Recently viewed&quot; in your account.
              Turning this off also deletes your current history.
            </span>
          </label>
          <Button variant="outline" size="sm" className="mt-4" disabled={busy} onClick={() => run(clearRecentlyViewed)}>
            Clear recently viewed now
          </Button>
        </Section>

        {state.message && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <Section title="Delete account" description="Request permanent deletion of your account, wishlist and personal data.">
        {profile.deletionRequestedAt ? (
          <div className="space-y-3">
            <Notice tone="warning" title="Deletion requested">
              You requested account deletion on {formatDate(profile.deletionRequestedAt)}. Our team will complete it shortly.
            </Notice>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => run(cancelAccountDeletion)}>
              Cancel deletion request
            </Button>
          </div>
        ) : (
          <form action={deleteAction} className="space-y-4">
            <Field label="Reason (optional)" htmlFor="reason">
              <Textarea id="reason" name="reason" rows={3} maxLength={1000} />
            </Field>
            <Field label='Type "DELETE" to confirm' htmlFor="confirm">
              <Input id="confirm" name="confirm" autoComplete="off" className="max-w-56" />
            </Field>
            {deleteState.message && <Notice tone={deleteState.ok ? "success" : "error"}>{deleteState.message}</Notice>}
            <Button type="submit" variant="danger" disabled={deletePending}>
              {deletePending ? "Submitting…" : "Request account deletion"}
            </Button>
          </form>
        )}
      </Section>
    </div>
  );
}
