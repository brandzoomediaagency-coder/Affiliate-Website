"use client";

import { useEffect, useState } from "react";

/**
 * Hides time-limited content (coupon codes, offers) once its expiry passes,
 * even if the surrounding page was served from cache. Server queries already
 * exclude expired offers; this closes the gap between cache refreshes.
 */
export function HideAfter({
  expiresAt,
  children,
  fallback = null,
}: {
  expiresAt: string | null | undefined;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms >= 2_147_000_000) return; // beyond setTimeout's range; cache refresh handles it
    const t = setTimeout(() => setExpired(true), Math.max(0, ms));
    return () => clearTimeout(t);
  }, [expiresAt]);

  return <>{expired ? fallback : children}</>;
}
