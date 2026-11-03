"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/env";
import { gaEvent } from "@/lib/analytics/client";

type AuthState = {
  user: User | null;
  /** UI hint only (shows the Admin link). Authorisation is enforced on the server. */
  isStaff: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({ user: null, isStaff: false, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(() => isSupabaseConfigured());

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let active = true;

    const loadRoles = async (u: User | null) => {
      if (!u) {
        setIsStaff(false);
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
      if (active) setIsStaff((data ?? []).some((r) => r.role === "admin" || r.role === "editor"));
    };

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setLoading(false);
      void loadRoles(data.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      const next = session?.user ?? null;
      setUser(next);
      setLoading(false);
      if (event === "SIGNED_IN") gaEvent("login", { method: next?.app_metadata?.provider ?? "email" });
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void loadRoles(next);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isStaff,
      loading,
      signOut: async () => {
        const supabase = getBrowserSupabase();
        await supabase?.auth.signOut();
        setUser(null);
        setIsStaff(false);
      },
    }),
    [user, isStaff, loading],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  return useContext(AuthContext);
}
