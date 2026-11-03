"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { captureUtm } from "@/lib/analytics/client";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "kw_analytics_consent";
type Consent = "granted" | "denied" | null;

function readConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

/**
 * Loads Google Analytics 4 ONLY after the visitor accepts analytics cookies.
 * First-party outbound-click analytics (no cookies, hashed IP) are always on
 * and are described in the Privacy Policy.
 */
export function Analytics({ measurementId }: { measurementId: string }) {
  const [consent, setConsent] = useState<Consent>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    setMounted(true);
    captureUtm();
    const onChange = () => setConsent(readConsent());
    window.addEventListener("kw-consent-change", onChange);
    return () => window.removeEventListener("kw-consent-change", onChange);
  }, []);

  const choose = (value: Exclude<Consent, null>) => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // ignore
    }
    setConsent(value);
  };

  return (
    <>
      {measurementId && consent === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${measurementId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {mounted && measurementId && consent === null && (
        <div
          role="dialog"
          aria-label="Analytics cookie preferences"
          className="fixed inset-x-3 bottom-20 z-[90] mx-auto max-w-xl animate-fade-up rounded-2xl border border-line bg-white p-4 shadow-pop md:bottom-5"
        >
          <p className="text-sm leading-relaxed text-ink-700">
            We use optional analytics cookies (Google Analytics) to understand how the site is used. You can browse and
            shop without them.{" "}
            <Link href="/privacy-policy#cookies" className="font-semibold text-brand-700 underline">
              Learn more
            </Link>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => choose("granted")}>
              Accept analytics
            </Button>
            <Button size="sm" variant="outline" onClick={() => choose("denied")}>
              Decline
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/** Lets visitors change their analytics choice later (used in the footer). */
export function ConsentResetButton() {
  return (
    <button
      type="button"
      className="text-left hover:text-white"
      onClick={() => {
        try {
          localStorage.removeItem(CONSENT_KEY);
        } catch {
          // ignore
        }
        window.dispatchEvent(new Event("kw-consent-change"));
        window.location.reload();
      }}
    >
      Cookie preferences
    </button>
  );
}
