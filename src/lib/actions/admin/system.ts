"use server";

import { assertAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/clients";
import { settingsSchema } from "@/lib/validation/schemas";
import { fromZodError, getBool, getOptionalString, getString, type ActionResult } from "@/lib/validation/form";
import { socialPlatforms } from "@/config/site";
import { actionError, audit, dbError, invalidate } from "./common";

/* ------------------------------ Settings ------------------------------ */

export async function saveSettings(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const social: Record<string, string> = {};
    for (const p of socialPlatforms) {
      const v = getString(formData, `social_${p}`);
      if (v) social[p] = v;
    }
    const parsed = settingsSchema.safeParse({
      brand_name: getString(formData, "brand_name"),
      tagline: getOptionalString(formData, "tagline"),
      logo_url: getOptionalString(formData, "logo_url"),
      favicon_url: getOptionalString(formData, "favicon_url"),
      footer_about: getOptionalString(formData, "footer_about"),
      social_links: social,
      contact_email: getOptionalString(formData, "contact_email"),
      contact_phone: getOptionalString(formData, "contact_phone"),
      contact_address: getOptionalString(formData, "contact_address"),
      seo_default_title: getOptionalString(formData, "seo_default_title"),
      seo_title_template: getOptionalString(formData, "seo_title_template"),
      seo_default_description: getOptionalString(formData, "seo_default_description"),
      default_og_image_url: getOptionalString(formData, "default_og_image_url"),
      affiliate_disclosure_short: getOptionalString(formData, "affiliate_disclosure_short"),
      affiliate_disclosure_content: getOptionalString(formData, "affiliate_disclosure_content"),
      amazon_associate_statement: getString(formData, "amazon_associate_statement"),
      newsletter_enabled: getBool(formData, "newsletter_enabled"),
      newsletter_heading: getOptionalString(formData, "newsletter_heading"),
      newsletter_subheading: getOptionalString(formData, "newsletter_subheading"),
      newsletter_consent_text: getOptionalString(formData, "newsletter_consent_text"),
      announcement_text: getOptionalString(formData, "announcement_text"),
      announcement_url: getOptionalString(formData, "announcement_url"),
      google_site_verification: getOptionalString(formData, "google_site_verification"),
    });
    if (!parsed.success) return fromZodError(parsed.error);
    const warnings: string[] = [];
    if (!/As an Amazon Associate I earn from qualifying purchases\./.test(parsed.data.amazon_associate_statement)) {
      warnings.push('Amazon requires the exact statement "As an Amazon Associate I earn from qualifying purchases." if you use Amazon links.');
    }
    const { error } = await session.supabase
      .from("site_settings")
      .update({ ...parsed.data, updated_by: session.user.id })
      .eq("id", 1);
    const failure = dbError(error, "settings");
    if (failure) return failure;
    await audit(session, "settings.update", "site_settings", "1", "Updated site settings");
    invalidate("settings");
    return { ok: true, message: "Settings saved.", warnings };
  } catch (e) {
    return actionError(e);
  }
}

/* ------------------------------- Users -------------------------------- */

async function adminCount(db: NonNullable<ReturnType<typeof createServiceClient>>) {
  const { data } = await db.from("user_roles").select("user_id, profiles!inner(status)").eq("role", "admin").eq("profiles.status", "active");
  return data?.length ?? 0;
}

export async function setUserRole(userId: string, role: "admin" | "editor" | "none"): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const db = createServiceClient();
    if (!db) return { ok: false, message: "SUPABASE_SECRET_KEY is required for user management." };
    if (userId === session.user.id && role !== "admin") return { ok: false, message: "You cannot remove your own admin role." };
    const { data: current } = await db.from("user_roles").select("role").eq("user_id", userId);
    const wasAdmin = (current ?? []).some((r) => r.role === "admin");
    if (wasAdmin && role !== "admin" && (await adminCount(db)) <= 1) return { ok: false, message: "At least one active administrator is required." };

    await db.from("user_roles").delete().eq("user_id", userId);
    if (role !== "none") {
      const { error } = await db.from("user_roles").insert({ user_id: userId, role, granted_by: session.user.id });
      const failure = dbError(error, "role");
      if (failure) return failure;
    }
    await audit(session, "user.role", "user", userId, `Role set to ${role}`);
    return { ok: true, message: `Role updated to ${role === "none" ? "user" : role}.` };
  } catch (e) {
    return actionError(e);
  }
}

export async function setUserStatus(userId: string, status: "active" | "disabled"): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const db = createServiceClient();
    if (!db) return { ok: false, message: "SUPABASE_SECRET_KEY is required for user management." };
    if (userId === session.user.id) return { ok: false, message: "You cannot disable your own account." };
    const { error } = await db.from("profiles").update({ status }).eq("id", userId);
    const failure = dbError(error, "profile");
    if (failure) return failure;
    // Also block sign-in at the auth layer (and revoke sessions on refresh).
    const { error: authError } = await db.auth.admin.updateUserById(userId, { ban_duration: status === "disabled" ? "876000h" : "none" });
    if (authError) console.warn("[users] ban update failed:", authError.message);
    await audit(session, "user.status", "user", userId, `Status set to ${status}`);
    return { ok: true, message: status === "disabled" ? "Account disabled." : "Account re-enabled." };
  } catch (e) {
    return actionError(e);
  }
}

/** Permanently deletes a user (e.g. to fulfil a deletion request). */
export async function deleteUserAccount(userId: string): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const db = createServiceClient();
    if (!db) return { ok: false, message: "SUPABASE_SECRET_KEY is required for user management." };
    if (userId === session.user.id) return { ok: false, message: "You cannot delete your own account from the admin panel." };
    const { data: roles } = await db.from("user_roles").select("role").eq("user_id", userId);
    if ((roles ?? []).some((r) => r.role === "admin") && (await adminCount(db)) <= 1) {
      return { ok: false, message: "At least one active administrator is required." };
    }
    const { data: objects } = await db.storage.from("avatars").list(userId);
    if (objects?.length) await db.storage.from("avatars").remove(objects.map((o) => `${userId}/${o.name}`));
    const { data: profile } = await db.from("profiles").select("email").eq("id", userId).maybeSingle();
    if (profile?.email) await db.from("newsletter_subscribers").delete().eq("email", profile.email.toLowerCase());
    const { error } = await db.auth.admin.deleteUser(userId);
    if (error) return { ok: false, message: `Could not delete user: ${error.message}` };
    await audit(session, "user.delete", "user", userId, "Deleted user account and personal data");
    return { ok: true, message: "User account and personal data deleted.", redirectTo: "/admin/users" };
  } catch (e) {
    return actionError(e);
  }
}

/* -------------------------- Messages & newsletter --------------------- */

export async function setMessageStatus(messageId: string, status: "new" | "read" | "archived"): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const { error } = await session.supabase.from("contact_messages").update({ status }).eq("id", messageId);
    const failure = dbError(error, "message");
    if (failure) return failure;
    return { ok: true, message: `Marked as ${status}.` };
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteMessage(messageId: string): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const { error } = await session.supabase.from("contact_messages").delete().eq("id", messageId);
    const failure = dbError(error, "message");
    if (failure) return failure;
    return { ok: true, message: "Message deleted." };
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteSubscriber(subscriberId: string): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const { error } = await session.supabase.from("newsletter_subscribers").delete().eq("id", subscriberId);
    const failure = dbError(error, "subscriber");
    if (failure) return failure;
    await audit(session, "subscriber.delete", "newsletter_subscriber", subscriberId);
    return { ok: true, message: "Subscriber removed." };
  } catch (e) {
    return actionError(e);
  }
}

/* ----------------------- Partner-reported performance ------------------ */

function parseNum(v: string): number | null {
  const n = Number(v.replace(/[,₹\s]/g, ""));
  return v.trim() === "" || !Number.isFinite(n) ? null : n;
}

export async function saveReport(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const merchantId = getString(formData, "merchant_id");
    const start = getString(formData, "period_start");
    const end = getString(formData, "period_end");
    if (!/^[0-9a-f-]{36}$/i.test(merchantId) || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      return { ok: false, message: "Choose a merchant and a valid period." };
    }
    if (end < start) return { ok: false, message: "Period end must be on or after the start date." };
    const { error } = await session.supabase.from("affiliate_performance_reports").upsert(
      {
        merchant_id: merchantId,
        period_start: start,
        period_end: end,
        clicks_reported: parseNum(getString(formData, "clicks_reported")),
        orders: parseNum(getString(formData, "orders")),
        items_shipped: parseNum(getString(formData, "items_shipped")),
        revenue: parseNum(getString(formData, "revenue")),
        commission: parseNum(getString(formData, "commission")),
        source: "manual",
        notes: getOptionalString(formData, "notes"),
        created_by: session.user.id,
      },
      { onConflict: "merchant_id,period_start,period_end,source" },
    );
    const failure = dbError(error, "report");
    if (failure) return failure;
    await audit(session, "report.save", "affiliate_performance_report", null, `Report ${start}..${end}`);
    return { ok: true, message: "Partner report saved." };
  } catch (e) {
    return actionError(e);
  }
}

/**
 * CSV import of partner-reported results. Expected header:
 * merchant_slug,period_start,period_end,clicks,orders,items_shipped,revenue,commission
 */
export async function importReportsCsv(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a CSV file." };
    if (file.size > 1024 * 1024) return { ok: false, message: "CSV must be under 1 MB." };
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const header = lines.shift()?.toLowerCase().split(",").map((h) => h.trim()) ?? [];
    const expected = ["merchant_slug", "period_start", "period_end", "clicks", "orders", "items_shipped", "revenue", "commission"];
    if (expected.some((h, i) => header[i] !== h)) return { ok: false, message: `Unexpected header. Use: ${expected.join(",")}` };
    const { data: merchants } = await session.supabase.from("merchants").select("id, slug");
    const bySlug = new Map((merchants ?? []).map((m) => [m.slug, m.id]));
    const rows = [];
    for (const [i, line] of lines.entries()) {
      const cols = line.split(",").map((c) => c.trim());
      const merchantId = bySlug.get(cols[0] ?? "");
      if (!merchantId || !/^\d{4}-\d{2}-\d{2}$/.test(cols[1] ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(cols[2] ?? "")) {
        return { ok: false, message: `Row ${i + 2} is invalid (unknown merchant slug or bad date).` };
      }
      rows.push({
        merchant_id: merchantId,
        period_start: cols[1]!,
        period_end: cols[2]!,
        clicks_reported: parseNum(cols[3] ?? ""),
        orders: parseNum(cols[4] ?? ""),
        items_shipped: parseNum(cols[5] ?? ""),
        revenue: parseNum(cols[6] ?? ""),
        commission: parseNum(cols[7] ?? ""),
        source: "csv_import",
        created_by: session.user.id,
      });
    }
    if (rows.length === 0) return { ok: false, message: "The CSV has no data rows." };
    const { error } = await session.supabase
      .from("affiliate_performance_reports")
      .upsert(rows, { onConflict: "merchant_id,period_start,period_end,source" });
    const failure = dbError(error, "report");
    if (failure) return failure;
    await audit(session, "report.import", "affiliate_performance_report", null, `Imported ${rows.length} rows`);
    return { ok: true, message: `Imported ${rows.length} partner report row(s).` };
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteReport(reportId: string): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const { error } = await session.supabase.from("affiliate_performance_reports").delete().eq("id", reportId);
    const failure = dbError(error, "report");
    if (failure) return failure;
    return { ok: true, message: "Report deleted." };
  } catch (e) {
    return actionError(e);
  }
}
