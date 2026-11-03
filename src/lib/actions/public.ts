"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/clients";
import { getSiteSettings } from "@/lib/data/settings";
import { getSessionUser } from "@/lib/auth";
import { getClientIp, hashIp, rateLimit } from "@/lib/security/request";
import { contactSchema, newsletterSchema } from "@/lib/validation/schemas";
import { fromZodError, getBool, getString, type ActionResult } from "@/lib/validation/form";
import { syncSubscriberToProvider } from "@/lib/newsletter";

/** Newsletter sign-up: explicit consent required; consent text and time are recorded. */
export async function subscribeToNewsletter(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = newsletterSchema.safeParse({
    email: getString(formData, "email"),
    consent: getBool(formData, "consent"),
    source: getString(formData, "source") || undefined,
  });
  if (!parsed.success) return fromZodError(parsed.error);
  if (getString(formData, "company")) return { ok: true, message: "Thanks! You're subscribed." }; // honeypot

  const ip = await getClientIp();
  const allowed = await rateLimit(`newsletter:${hashIp(ip, "ratelimit")}`, 5, 3600);
  if (!allowed) return { ok: false, message: "Too many attempts. Please try again later." };

  const db = createServiceClient();
  if (!db) return { ok: false, message: "Newsletter sign-up is temporarily unavailable." };

  const [settings, user] = await Promise.all([getSiteSettings(), getSessionUser().catch(() => null)]);
  if (!settings.newsletterEnabled) return { ok: false, message: "The newsletter is not accepting sign-ups right now." };

  const { email, source } = parsed.data;
  const { data: existing } = await db.from("newsletter_subscribers").select("id, status").eq("email", email).maybeSingle();
  const record = {
    email,
    status: "subscribed" as const,
    consent_text: settings.newsletterConsentText,
    consent_at: new Date().toISOString(),
    consent_source: source ?? null,
    ip_hash: hashIp(ip, "newsletter"),
    user_id: user?.id ?? null,
    unsubscribed_at: null,
  };
  const { error } = existing
    ? await db.from("newsletter_subscribers").update(record).eq("id", existing.id)
    : await db.from("newsletter_subscribers").insert(record);
  if (error) {
    console.error("[newsletter] save failed", error.message);
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  const sync = await syncSubscriberToProvider(email, "subscribe");
  if (!sync.skipped) {
    await db
      .from("newsletter_subscribers")
      .update(sync.ok ? { provider_synced_at: new Date().toISOString(), provider_error: null } : { provider_error: sync.error ?? "sync failed" })
      .eq("email", email);
  }
  return { ok: true, message: "Thanks! You're subscribed. You can unsubscribe at any time." };
}

/** One-click unsubscribe via the token included in newsletter emails. */
export async function unsubscribeFromNewsletter(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const token = getString(formData, "token");
  if (!/^[0-9a-f-]{36}$/i.test(token)) return { ok: false, message: "This unsubscribe link is invalid." };
  const db = createServiceClient();
  if (!db) return { ok: false, message: "Unsubscribe is temporarily unavailable." };
  const { data } = await db
    .from("newsletter_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .select("email")
    .maybeSingle();
  if (!data) return { ok: false, message: "This unsubscribe link is invalid or has already been used." };
  await syncSubscriberToProvider(data.email, "unsubscribe");
  return { ok: true, message: "You have been unsubscribed. You will not receive further newsletter emails." };
}

export async function submitContactMessage(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = contactSchema.safeParse({
    name: getString(formData, "name"),
    email: getString(formData, "email"),
    subject: getString(formData, "subject"),
    message: getString(formData, "message"),
    website: getString(formData, "website"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const ip = await getClientIp();
  if (!(await rateLimit(`contact:${hashIp(ip, "ratelimit")}`, 5, 3600))) {
    return { ok: false, message: "Too many messages. Please try again later." };
  }
  const db = createServiceClient();
  if (!db) return { ok: false, message: "The contact form is temporarily unavailable. Please email us instead." };
  const user = await getSessionUser().catch(() => null);
  const ua = (await headers()).get("user-agent");
  const { error } = await db.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    ip_hash: hashIp(ip, "contact"),
    user_id: user?.id ?? null,
  });
  if (error) {
    console.error("[contact] save failed", error.message, ua?.slice(0, 80));
    return { ok: false, message: "Something went wrong. Please try again." };
  }
  return { ok: true, message: "Thanks for reaching out! We'll reply by email as soon as we can." };
}
