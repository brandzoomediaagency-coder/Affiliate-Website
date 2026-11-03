import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";

function csvCell(value: string | null) {
  const v = value ?? "";
  // Neutralise spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** CSV export of consented, currently-subscribed emails (admins only). */
export async function GET() {
  const user = await getSessionUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("email, consent_at, consent_text, consent_source, unsubscribe_token")
    .eq("status", "subscribed")
    .order("consent_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = [
    "email,consent_at,consent_text,consent_source,unsubscribe_token",
    ...(data ?? []).map((s) => [s.email, s.consent_at, s.consent_text, s.consent_source, s.unsubscribe_token].map(csvCell).join(",")),
  ];
  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
