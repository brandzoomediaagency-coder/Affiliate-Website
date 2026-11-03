import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/clients";
import { isSupabaseConfigured } from "@/lib/env";

export type AppRole = "admin" | "editor";

export type SessionUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  roles: AppRole[];
  isAdmin: boolean;
  isStaff: boolean;
};

/**
 * Data Access Layer: resolves the signed-in user from the verified session
 * (JWT claims) and loads roles from the database. Never trust client-side
 * role information. Memoised per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSessionClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (error || !userId) return null;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, avatar_url, status").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  // Disabled accounts are treated as signed out everywhere.
  if (!profile || profile.status !== "active") return null;

  const roleList = (roles ?? []).map((r) => r.role).filter((r): r is AppRole => r === "admin" || r === "editor");
  return {
    id: userId,
    email: profile.email ?? (claimsData.claims.email as string | undefined) ?? null,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    roles: roleList,
    isAdmin: roleList.includes("admin"),
    isStaff: roleList.includes("admin") || roleList.includes("editor"),
  };
});

export async function requireUser(nextPath = "/account"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function requireStaff(nextPath = "/admin"): Promise<SessionUser> {
  const user = await requireUser(nextPath);
  if (!user.isStaff) redirect("/account?denied=admin");
  return user;
}

export async function requireAdmin(nextPath = "/admin"): Promise<SessionUser> {
  const user = await requireStaff(nextPath);
  if (!user.isAdmin) redirect("/admin?denied=admin-only");
  return user;
}

export class AuthorizationError extends Error {
  constructor(message = "You are not allowed to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/** For Server Actions: returns the user + session client or throws. */
export async function assertStaff() {
  const user = await getSessionUser();
  if (!user?.isStaff) throw new AuthorizationError();
  const supabase = await createSessionClient();
  return { user, supabase };
}

export async function assertAdmin() {
  const user = await getSessionUser();
  if (!user?.isAdmin) throw new AuthorizationError("Administrator access is required.");
  const supabase = await createSessionClient();
  return { user, supabase };
}

export async function assertUser() {
  const user = await getSessionUser();
  if (!user) throw new AuthorizationError("Please sign in to continue.");
  const supabase = await createSessionClient();
  return { user, supabase };
}

export { safeNextPath } from "@/lib/safe-redirect";
