import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgePercent, Heart, Scale, ShieldCheck, Store } from "lucide-react";
import type { Banner } from "@/lib/data/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themes: Record<Banner["theme"], string> = {
  violet: "bg-hero-violet",
  saffron: "bg-gradient-to-br from-saffron-500 via-saffron-600 to-saffron-700",
  navy: "bg-gradient-to-br from-ink-950 via-ink-900 to-brand-900",
  emerald: "bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600",
  rose: "bg-gradient-to-br from-rose-700 via-rose-600 to-fuchsia-600",
};

export const defaultHero: Banner = {
  id: "default",
  placement: "home_hero",
  eyebrow: "Product discovery across India's favourite stores",
  title: "Discover Better Products. Shop Smarter.",
  subtitle: "Explore products, compare shopping options and find great deals from your favourite online stores.",
  ctaLabel: "Explore Products",
  ctaUrl: "/products",
  secondaryCtaLabel: "Discover Today's Deals",
  secondaryCtaUrl: "/deals",
  imageUrl: null,
  imageAlt: null,
  theme: "violet",
};

export function Hero({ banner }: { banner: Banner }) {
  return (
    <section className={cn("relative overflow-hidden text-white", themes[banner.theme])}>
      <div className="container-page grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <div className="animate-fade-up">
          {banner.eyebrow && (
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold tracking-wide ring-1 ring-white/20 backdrop-blur">
              <span className="size-1.5 rounded-full bg-saffron-300" aria-hidden="true" /> {banner.eyebrow}
            </p>
          )}
          <h1 className="text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]">
            {banner.title}
          </h1>
          {banner.subtitle && <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">{banner.subtitle}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            {banner.ctaLabel && banner.ctaUrl && (
              <Link href={banner.ctaUrl} className={buttonVariants({ variant: "accent", size: "lg" })}>
                {banner.ctaLabel} <ArrowRight aria-hidden="true" />
              </Link>
            )}
            {banner.secondaryCtaLabel && banner.secondaryCtaUrl && (
              <Link
                href={banner.secondaryCtaUrl}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50")}
              >
                {banner.secondaryCtaLabel}
              </Link>
            )}
          </div>
          <ul className="mt-8 grid max-w-xl gap-3 text-sm text-white/85 sm:grid-cols-3">
            {[
              { Icon: Scale, text: "Compare listings across stores" },
              { Icon: ShieldCheck, text: "Clear affiliate disclosures" },
              { Icon: Store, text: "Checkout on the store's site" },
            ].map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="size-4 shrink-0 text-saffron-300" aria-hidden="true" /> {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          {banner.imageUrl ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-white/20">
              <Image src={banner.imageUrl} alt={banner.imageAlt || ""} fill priority sizes="(min-width: 1024px) 560px, 90vw" className="object-cover" />
            </div>
          ) : (
            <HeroIllustration />
          )}
        </div>
      </div>
    </section>
  );
}

/** Original, lightweight illustration (pure SVG/CSS — no stock or merchant imagery). */
function HeroIllustration() {
  return (
    <div className="relative aspect-[4/3.4]" aria-hidden="true">
      <div className="absolute inset-[6%] rounded-[2rem] bg-white/10 ring-1 ring-white/20 backdrop-blur-sm" />
      {/* Main product card */}
      <div className="absolute top-[12%] left-[14%] w-[58%] rotate-[-4deg] rounded-3xl bg-white p-4 text-ink-900 shadow-pop">
        <div className="grid aspect-square place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-saffron-50">
          <svg viewBox="0 0 120 120" className="w-3/4">
            <defs>
              <linearGradient id="hp" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#7258fa" />
                <stop offset="1" stopColor="#3d299e" />
              </linearGradient>
            </defs>
            <path d="M24 70V58a36 36 0 0 1 72 0v12" fill="none" stroke="url(#hp)" strokeWidth="9" strokeLinecap="round" />
            <rect x="14" y="62" width="24" height="38" rx="11" fill="url(#hp)" />
            <rect x="82" y="62" width="24" height="38" rx="11" fill="url(#hp)" />
            <circle cx="26" cy="81" r="5" fill="#ffbb33" />
            <circle cx="94" cy="81" r="5" fill="#ffbb33" />
          </svg>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-2.5 w-4/5 rounded-full bg-ink-900/80" />
          <div className="h-2 w-3/5 rounded-full bg-ink-300/60" />
        </div>
        <div className="mt-3 flex gap-2">
          <div className="h-7 flex-1 rounded-lg border border-line" />
          <div className="h-7 flex-1 rounded-lg bg-brand-600" />
        </div>
      </div>
      {/* Compare chip */}
      <div className="absolute top-[8%] right-[4%] flex animate-fade-up items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-ink-900 shadow-pop">
        <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Scale className="size-4" />
        </span>
        Compare stores
      </div>
      {/* Store rows */}
      <div className="absolute right-[3%] bottom-[18%] w-[52%] rotate-[3deg] space-y-2 rounded-2xl bg-white p-3 shadow-pop">
        {["bg-ink-800", "bg-brand-600", "bg-rose-500"].map((c, i) => (
          <div key={c} className="flex items-center gap-2">
            <span className={cn("size-6 shrink-0 rounded-lg", c)} />
            <span className="h-2 flex-1 rounded-full bg-ink-900/15" />
            <span className={cn("h-5 w-12 rounded-md", i === 0 ? "bg-saffron-300" : "bg-brand-100")} />
          </div>
        ))}
      </div>
      {/* Deal tag */}
      <div className="absolute bottom-[6%] left-[8%] flex items-center gap-2 rounded-2xl bg-saffron-300 px-3 py-2 text-xs font-extrabold text-ink-950 shadow-pop">
        <BadgePercent className="size-4" /> Verified offers
      </div>
      {/* Wishlist bubble */}
      <div className="absolute top-[44%] left-[2%] grid size-11 place-items-center rounded-full bg-white text-rose-500 shadow-pop">
        <Heart className="size-5 fill-current" />
      </div>
    </div>
  );
}
