import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSessionClient } from "@/lib/supabase/clients";
import { safeNextPath } from "@/lib/safe-redirect";

/**
 * Completes OAuth (Google) and email link flows:
 *  - `?code=` (PKCE) from OAuth or email links
 *  - `?token_hash=&type=` from Supabase email templates (signup, recovery, email change)
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(url.searchParams.get("next"), type === "recovery" ? "/reset-password" : "/account");

  const supabase = await createSessionClient();
  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  const target = new URL(ok ? (type === "recovery" ? "/reset-password" : next) : "/login?error=link", url.origin);
  return NextResponse.redirect(target);
}
