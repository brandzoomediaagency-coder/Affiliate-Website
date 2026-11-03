"use client";

/**
 * Client-side analytics helpers.
 * - GA4 events are sent only if GA is loaded (i.e. the visitor consented).
 * - First-party events (outbound clicks, views, searches) go to our own API
 *   via sendBeacon. They never block navigation and never use cookies.
 */

type GtagFn = (command: "event" | "config" | "consent" | "js", ...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

export function gaEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

const ANON_KEY = "kw_anon_id";

/** Random, non-identifying id stored locally to de-duplicate events. */
export function getAnonId(): string | undefined {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID().replace(/-/g, "");
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

const UTM_KEY = "kw_utm";

/** Captures UTM parameters for the session (attribution of outbound clicks). */
export function captureUtm() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const key of ["source", "medium", "campaign", "term", "content"]) {
      const value = params.get(`utm_${key}`);
      if (value) utm[key] = value.slice(0, 120);
    }
    if (Object.keys(utm).length) sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
  } catch {
    // ignore
  }
}

export function getUtm(): Record<string, string> | undefined {
  try {
    const raw = sessionStorage.getItem(UTM_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : undefined;
  } catch {
    return undefined;
  }
}

export function sendBeaconJson(url: string, payload: unknown) {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      if (ok) return;
    }
    void fetch(url, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  } catch {
    // Analytics must never break the page.
  }
}

export type OutboundClick = {
  listingId?: string;
  merchantId?: string;
  offerId?: string;
  merchantName?: string;
  productId?: string;
  productName?: string;
  sourceComponent: string;
};

export function trackOutboundClick(click: OutboundClick) {
  sendBeaconJson("/api/track/click", {
    listingId: click.listingId,
    offerId: click.offerId,
    merchantId: click.merchantId,
    sourcePath: window.location.pathname,
    sourceComponent: click.sourceComponent,
    anonId: getAnonId(),
    referrer: document.referrer || undefined,
    utm: getUtm(),
  });
  gaEvent("affiliate_click", {
    merchant: click.merchantName,
    product_id: click.productId,
    item_name: click.productName,
    listing_id: click.listingId,
    offer_id: click.offerId,
    source_component: click.sourceComponent,
    page_path: window.location.pathname,
    outbound: true,
  });
}
