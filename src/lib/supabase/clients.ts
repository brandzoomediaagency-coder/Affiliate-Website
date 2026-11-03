import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv, isSupabaseConfigured } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import type { Database } from "./database.types";

export type TypedSupabaseClient = ReturnType<typeof createClient<Database>>;

/**
 * Cookie-less client using the publishable key. Safe to use inside
 * `'use cache'` functions because it never reads request data. RLS limits it
 * to public (published) data.
 */
export function createPublicClient(): TypedSupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return createClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/**
 * Request-scoped client authenticated as the current user (via cookies).
 * Use in Server Components behind <Suspense>, Server Actions and Route Handlers.
 */
export async function createSessionClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }
  const cookieStore = await cookies();
  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: cookies are refreshed by proxy.ts instead.
        }
      },
    },
  });
}

/**
 * Service-role client that BYPASSES RLS. Server-only. Use exclusively for
 * trusted operations after explicit authorisation checks (tracking inserts,
 * rate limiting, auth admin API, newsletter/contact storage).
 */
export function createServiceClient(): TypedSupabaseClient | null {
  if (!isSupabaseConfigured() || !serverEnv.supabaseSecretKey) return null;
  return createClient<Database>(publicEnv.supabaseUrl, serverEnv.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
