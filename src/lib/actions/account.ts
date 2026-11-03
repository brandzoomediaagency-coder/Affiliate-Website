"use server";

import { refresh } from "next/cache";
import { assertUser, AuthorizationError } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/clients";
import { getSiteSettings } from "@/lib/data/settings";
import { getProductCardsByIds } from "@/lib/data/products";
import type { ProductCard } from "@/lib/data/types";
import { profileSchema } from "@/lib/validation/schemas";
import { fromZodError, getBool, getString, type ActionResult } from "@/lib/validation/form";
import { validateImageUpload } from "@/lib/security/uploads";
import { syncSubscriberToProvider } from "@/lib/newsletter";
import { rateLimit } from "@/lib/security/request";

function authFail(e: unknown): ActionResult {
  if (e instanceof AuthorizationError) return { ok: false, message: e.message };
  console.error(e);
  return { ok: false, message: "Something went wrong. Please try again." };
}

/** Public: product cards for a list of ids (used by client-rendered wishlists). */
export async function fetchProductCards(ids: string[]): Promise<ProductCard[]> {
  const clean = (Array.isArray(ids) ? ids : [])
    .filter((id) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id))
    .slice(0, 60);
  return getProductCardsByIds(clean);
}

export async function updateProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { user, supabase } = await assertUser();
    const parsed = profileSchema.safeParse({
      full_name: getString(formData, "full_name"),
      newsletter_opt_in: getBool(formData, "newsletter_opt_in"),
      notification_prefs: {
        product_updates: getBool(formData, "product_updates"),
        editorial_digest: getBool(formData, "editorial_digest"),
      },
      privacy_prefs: { track_recently_viewed: getBool(formData, "track_recently_viewed") },
    });
    if (!parsed.success) return fromZodError(parsed.error);

    const { data: before } = await supabase.from("profiles").select("newsletter_opt_in").eq("id", user.id).single();
    const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
    if (error) return { ok: false, message: "Could not save your profile. Please try again." };

    // Keep auth metadata name in sync (used by the header avatar).
    await supabase.auth.updateUser({ data: { full_name: parsed.data.full_name ?? "" } });

    if (!parsed.data.privacy_prefs.track_recently_viewed) {
      await supabase.from("recently_viewed").delete().eq("user_id", user.id);
    }

    // Newsletter opt-in/out from the profile is recorded with consent.
    if (before && before.newsletter_opt_in !== parsed.data.newsletter_opt_in && user.email) {
      const db = createServiceClient();
      const settings = await getSiteSettings();
      if (db) {
        const email = user.email.toLowerCase();
        if (parsed.data.newsletter_opt_in) {
          const record = {
            email,
            status: "subscribed" as const,
            consent_text: settings.newsletterConsentText,
            consent_at: new Date().toISOString(),
            consent_source: "/account/profile",
            user_id: user.id,
            unsubscribed_at: null,
          };
          const { data: existing } = await db.from("newsletter_subscribers").select("id").eq("email", email).maybeSingle();
          if (existing) await db.from("newsletter_subscribers").update(record).eq("id", existing.id);
          else await db.from("newsletter_subscribers").insert(record);
          await syncSubscriberToProvider(email, "subscribe");
        } else {
          await db
            .from("newsletter_subscribers")
            .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
            .eq("email", email);
          await syncSubscriberToProvider(email, "unsubscribe");
        }
      }
    }
    refresh();
    return { ok: true, message: "Your profile has been saved." };
  } catch (e) {
    return authFail(e);
  }
}

export async function uploadAvatar(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { user, supabase } = await assertUser();
    if (!(await rateLimit(`avatar:${user.id}`, 10, 3600))) return { ok: false, message: "Too many uploads. Try again later." };
    const file = formData.get("avatar");
    const checked = await validateImageUpload(file instanceof File ? file : null, {
      maxBytes: 2 * 1024 * 1024,
      allowed: ["image/jpeg", "image/png", "image/webp"],
    });
    if (!checked.ok) return { ok: false, message: checked.error };

    const path = `${user.id}/avatar-${Date.now()}.${checked.value.extension}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, checked.value.bytes, { contentType: checked.value.mime, upsert: false, cacheControl: "31536000" });
    if (error) return { ok: false, message: "Upload failed. Please try a different image." };
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);

    // Remove previous avatars to avoid storing unnecessary personal data.
    const { data: existing } = await supabase.storage.from("avatars").list(user.id);
    const stale = (existing ?? []).map((o) => `${user.id}/${o.name}`).filter((p) => p !== path);
    if (stale.length) await supabase.storage.from("avatars").remove(stale);

    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
    refresh();
    return { ok: true, message: "Profile photo updated." };
  } catch (e) {
    return authFail(e);
  }
}

export async function removeAvatar(): Promise<ActionResult> {
  try {
    const { user, supabase } = await assertUser();
    const { data: existing } = await supabase.storage.from("avatars").list(user.id);
    if (existing?.length) await supabase.storage.from("avatars").remove(existing.map((o) => `${user.id}/${o.name}`));
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    refresh();
    return { ok: true, message: "Profile photo removed." };
  } catch (e) {
    return authFail(e);
  }
}

export async function requestAccountDeletion(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { user, supabase } = await assertUser();
    if (getString(formData, "confirm") !== "DELETE") {
      return { ok: false, message: 'Type DELETE in capital letters to confirm.' };
    }
    const reason = getString(formData, "reason").slice(0, 1000) || null;
    const { error } = await supabase
      .from("profiles")
      .update({ deletion_requested_at: new Date().toISOString(), deletion_reason: reason })
      .eq("id", user.id);
    if (error) return { ok: false, message: "Could not submit your request. Please try again." };
    refresh();
    return {
      ok: true,
      message: "Your deletion request has been received. Your account and personal data will be deleted by our team, usually within 7 days.",
    };
  } catch (e) {
    return authFail(e);
  }
}

export async function cancelAccountDeletion(): Promise<ActionResult> {
  try {
    const { user, supabase } = await assertUser();
    await supabase.from("profiles").update({ deletion_requested_at: null, deletion_reason: null }).eq("id", user.id);
    refresh();
    return { ok: true, message: "Your deletion request has been cancelled." };
  } catch (e) {
    return authFail(e);
  }
}

export async function clearRecentlyViewed(): Promise<ActionResult> {
  try {
    const { user, supabase } = await assertUser();
    await supabase.from("recently_viewed").delete().eq("user_id", user.id);
    refresh();
    return { ok: true, message: "Recently viewed history cleared." };
  } catch (e) {
    return authFail(e);
  }
}
