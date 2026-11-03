/**
 * Public (browser-safe) environment values. Server-only secrets are read in
 * `src/lib/env.server.ts`, which is guarded by `server-only`.
 */

function trimSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const publicEnv = {
  siteUrl: trimSlash(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? trimSlash(process.env.NEXT_PUBLIC_SUPABASE_URL) : "",
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
  googleAuthEnabled: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true",
};

export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabasePublishableKey);
}

/** Absolute URL for a site path. */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${publicEnv.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
