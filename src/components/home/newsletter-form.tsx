"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { subscribeToNewsletter } from "@/lib/actions/public";
import { initialActionResult } from "@/lib/validation/form";
import { gaEvent } from "@/lib/analytics/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/misc";

export function NewsletterForm({ heading, subheading, consentText }: { heading: string; subheading: string; consentText: string }) {
  const [state, action, pending] = useActionState(async (prev: typeof initialActionResult, fd: FormData) => {
    // Read the path at submit time (avoids URL-dependent rendering).
    const path = window.location.pathname;
    fd.set("source", path);
    const result = await subscribeToNewsletter(prev, fd);
    if (result.ok) gaEvent("newsletter_signup", { page_path: path });
    return result;
  }, initialActionResult);

  return (
    <section aria-labelledby="newsletter-heading" className="container-page">
      <div className="relative overflow-hidden rounded-3xl bg-ink-900 px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:gap-12 lg:py-12">
        <div className="pointer-events-none absolute -top-20 -right-20 size-72 rounded-full bg-brand-600/40 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-lg">
          <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-white/10">
            <Mail className="size-5 text-saffron-300" aria-hidden="true" />
          </span>
          <h2 id="newsletter-heading" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {heading}
          </h2>
          <p className="mt-2 leading-relaxed text-white/75">{subheading}</p>
        </div>
        <form action={action} className="relative mt-6 flex-1 space-y-3 lg:mt-0">
          <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-12 flex-1 rounded-xl border border-white/15 bg-white/10 px-4 text-white placeholder:text-white/50 focus:border-saffron-300 focus:ring-4 focus:ring-saffron-300/20 focus:outline-none"
            />
            <Button type="submit" variant="accent" size="lg" disabled={pending}>
              {pending ? "Subscribing…" : "Subscribe"}
            </Button>
          </div>
          <label className="flex items-start gap-2.5 text-xs leading-relaxed text-white/70">
            <Checkbox name="consent" required className="mt-0.5" />
            <span>
              {consentText}{" "}
              <Link href="/privacy-policy" className="underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          {state.message && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
        </form>
      </div>
    </section>
  );
}
