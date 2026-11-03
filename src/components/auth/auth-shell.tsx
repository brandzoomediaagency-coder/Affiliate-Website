import { CircleCheck } from "lucide-react";
import { getSiteSettings } from "@/lib/data/settings";

/** Two-panel auth layout: value proposition + form card. */
export async function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <div className="container-page grid min-h-[70vh] items-center gap-10 py-10 lg:grid-cols-2 lg:py-16">
      <div className="hidden rounded-3xl bg-hero-violet p-10 text-white lg:block">
        <p className="text-sm font-semibold text-white/70">{settings.brandName}</p>
        <p className="mt-3 text-3xl leading-tight font-extrabold">Your shortlist, saved across devices.</p>
        <ul className="mt-8 space-y-3 text-white/85">
          {[
            "Sync your wishlist between phone and laptop",
            "Pick up where you left off with recently viewed products",
            "Browsing and buying never require an account",
            "No cashback gimmicks — just honest product discovery",
          ].map((t) => (
            <li key={t} className="flex gap-2.5">
              <CircleCheck className="mt-0.5 size-5 shrink-0 text-saffron-300" aria-hidden="true" /> {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
