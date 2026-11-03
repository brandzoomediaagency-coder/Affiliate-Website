import type { NextConfig } from "next";

/**
 * Image hosts that may be optimised by next/image.
 * - Supabase Storage (public buckets) for uploaded product, category, blog and logo images.
 * - Local Supabase in development.
 * Merchant-API images (e.g. Amazon) are rendered with `unoptimized` so that they are
 * served directly from the merchant-provided URL, as programme policies require.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const remotePatterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [
  { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
];

let isLocalSupabase = false;
if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    isLocalSupabase = ["127.0.0.1", "localhost"].includes(url.hostname);
    if (!url.hostname.endsWith(".supabase.co")) {
      remotePatterns.push({
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        port: url.port || undefined,
        pathname: "/storage/v1/object/public/**",
      });
    }
  } catch {
    // Invalid URL: ignored here, reported by env validation at runtime.
  }
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  cacheLife: {
    // Catalogue data: refreshed frequently so price freshness rules stay accurate.
    catalog: { stale: 60, revalidate: 600, expire: 3600 },
    // Editorial content and settings change less often.
    content: { stale: 300, revalidate: 3600, expire: 86400 },
  },
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85],
    // Only needed when developing against a local Supabase instance.
    dangerouslyAllowLocalIP: isLocalSupabase && process.env.NODE_ENV !== "production",
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/terms", destination: "/terms-and-conditions", permanent: true },
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      { source: "/disclosure", destination: "/affiliate-disclosure", permanent: true },
      { source: "/register", destination: "/signup", permanent: true },
      { source: "/store/:slug", destination: "/stores/:slug", permanent: true },
      { source: "/category/:slug", destination: "/categories/:slug", permanent: true },
      { source: "/product/:slug", destination: "/products/:slug", permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
