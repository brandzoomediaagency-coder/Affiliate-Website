import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { buildMetadata } from "@/lib/seo/metadata";
import { ProfileForms } from "@/components/account/profile-forms";
import { Skeleton } from "@/components/ui/misc";

export const generateMetadata = () => buildMetadata({ title: "Profile & settings", path: "/account/profile", noindex: true });

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">Profile & settings</h1>
        <p className="mt-1 text-ink-500">Manage your details, email preferences and privacy.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-[40rem] w-full rounded-2xl" />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}

async function ProfileContent() {
  const user = await requireUser("/account/profile");
  const supabase = await createSessionClient();
  const { data: p } = await supabase
    .from("profiles")
    .select("email, full_name, avatar_url, newsletter_opt_in, notification_prefs, privacy_prefs, deletion_requested_at")
    .eq("id", user.id)
    .single();
  const notif = (p?.notification_prefs ?? {}) as { product_updates?: boolean; editorial_digest?: boolean };
  const privacy = (p?.privacy_prefs ?? {}) as { track_recently_viewed?: boolean };
  return (
    <ProfileForms
      profile={{
        email: p?.email ?? user.email,
        fullName: p?.full_name ?? null,
        avatarUrl: p?.avatar_url ?? null,
        newsletterOptIn: Boolean(p?.newsletter_opt_in),
        productUpdates: Boolean(notif.product_updates),
        editorialDigest: Boolean(notif.editorial_digest),
        trackRecentlyViewed: privacy.track_recently_viewed !== false,
        deletionRequestedAt: p?.deletion_requested_at ?? null,
      }}
    />
  );
}
