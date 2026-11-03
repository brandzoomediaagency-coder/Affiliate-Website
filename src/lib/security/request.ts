import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { serverEnv } from "@/lib/env.server";
import { createServiceClient } from "@/lib/supabase/clients";

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") || "0.0.0.0";
}

/**
 * One-way, salted hash of the IP. Raw IP addresses are never stored.
 * The salt rotates daily so hashes cannot be linked across days.
 */
export function hashIp(ip: string, scope = "default"): string {
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${serverEnv.ipHashSalt || "unsalted"}:${scope}:${day}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pagespeed|curl|wget|python-requests|axios|go-http-client|httpclient|java\//i;

export function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent) return true;
  return BOT_PATTERN.test(userAgent);
}

export function deviceTypeFromUA(userAgent: string | null): "mobile" | "tablet" | "desktop" | "bot" | "unknown" {
  if (!userAgent) return "unknown";
  if (isLikelyBot(userAgent)) return "bot";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

/**
 * Database-backed fixed-window rate limiter (works across serverless
 * instances). Returns true when the request is allowed. Fails open only when
 * the service role is not configured (development), and logs a warning.
 */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const db = createServiceClient();
  if (!db) {
    console.warn("[rate-limit] SUPABASE_SECRET_KEY is not configured; rate limiting is disabled.");
    return true;
  }
  const { data, error } = await db.rpc("check_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit] check failed:", error.message);
    return true;
  }
  return data === true;
}

/** Rate limit keyed by the hashed client IP and an action name. */
export async function rateLimitByIp(action: string, max: number, windowSeconds: number) {
  const ip = await getClientIp();
  return rateLimit(`${action}:${hashIp(ip, "ratelimit")}`, max, windowSeconds);
}
