import "server-only";
import { createHash } from "node:crypto";
import { serverEnv } from "@/lib/env.server";

/**
 * Optional email-marketing provider sync. Only called for subscribers who
 * gave explicit consent. With NEWSLETTER_PROVIDER=none (default), consented
 * subscribers are stored in the database only and can be exported from the
 * admin panel. This module never sends emails itself.
 */
export async function syncSubscriberToProvider(
  email: string,
  action: "subscribe" | "unsubscribe",
): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const cfg = serverEnv.newsletter;
  try {
    if (cfg.provider === "brevo") {
      if (!cfg.brevoApiKey || !cfg.brevoListId) return { ok: false, error: "Brevo is not fully configured." };
      const listId = Number(cfg.brevoListId);
      const res =
        action === "subscribe"
          ? await fetch("https://api.brevo.com/v3/contacts", {
              method: "POST",
              headers: { "api-key": cfg.brevoApiKey, "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({ email, listIds: [listId], updateEnabled: true }),
              cache: "no-store",
            })
          : await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
              method: "PUT",
              headers: { "api-key": cfg.brevoApiKey, "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({ unlinkListIds: [listId] }),
              cache: "no-store",
            });
      if (!res.ok && res.status !== 204) return { ok: false, error: `Brevo responded ${res.status}` };
      return { ok: true };
    }

    if (cfg.provider === "mailchimp") {
      if (!cfg.mailchimpApiKey || !cfg.mailchimpServerPrefix || !cfg.mailchimpAudienceId) {
        return { ok: false, error: "Mailchimp is not fully configured." };
      }
      const hash = createHash("md5").update(email.toLowerCase()).digest("hex");
      const res = await fetch(
        `https://${cfg.mailchimpServerPrefix}.api.mailchimp.com/3.0/lists/${cfg.mailchimpAudienceId}/members/${hash}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Basic ${Buffer.from(`anystring:${cfg.mailchimpApiKey}`).toString("base64")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            action === "subscribe"
              ? { email_address: email, status_if_new: "subscribed", status: "subscribed" }
              : { email_address: email, status_if_new: "unsubscribed", status: "unsubscribed" },
          ),
          cache: "no-store",
        },
      );
      if (!res.ok) return { ok: false, error: `Mailchimp responded ${res.status}` };
      return { ok: true };
    }

    return { ok: true, skipped: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
