"use client";

import { useEffect } from "react";
import { gaEvent, sendBeaconJson } from "@/lib/analytics/client";

/** Logs an internal search once per query per session (first-party + GA4). */
export function SearchLogger({ q, results }: { q: string; results: number }) {
  useEffect(() => {
    const key = `kw_search:${q.toLowerCase()}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore
    }
    sendBeaconJson("/api/track/search", { q, results });
    gaEvent("search", { search_term: q, results });
  }, [q, results]);
  return null;
}
