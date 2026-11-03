"use client";

import { useEffect } from "react";
import { gaEvent, sendBeaconJson } from "@/lib/analytics/client";
import { useWishlist } from "@/components/providers/wishlist-provider";

type ViewType = "home" | "product" | "category" | "store" | "blog_post" | "comparison" | "deals";

/**
 * Records one first-party view per entity per browser session, sends a GA4
 * event (if consented) and, for products, updates "recently viewed".
 */
export function ViewTracker({ type, id, name }: { type: ViewType; id?: string; name?: string }) {
  const { recordView } = useWishlist();

  useEffect(() => {
    const key = `kw_view:${type}:${id ?? "-"}`;
    let seen = false;
    try {
      seen = sessionStorage.getItem(key) === "1";
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore
    }
    if (!seen) sendBeaconJson("/api/track/view", { type, id });

    const gaName =
      type === "product" ? "view_item" : type === "blog_post" ? "view_article" : type === "category" ? "view_item_list" : `view_${type}`;
    gaEvent(gaName, { item_id: id, item_name: name, content_type: type });

    if (type === "product" && id) recordView(id);
  }, [type, id, name, recordView]);

  return null;
}
