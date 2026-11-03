import Link from "next/link";
import { SearchX } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container-page flex flex-1 flex-col items-center justify-center py-24 text-center">
        <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <SearchX className="size-8" aria-hidden="true" />
        </span>
        <p className="text-sm font-bold tracking-widest text-brand-600 uppercase">Error 404</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">We couldn&apos;t find that page</h1>
        <p className="mt-3 max-w-md text-ink-500">The page may have moved, or the product is no longer listed. Try searching or browse our categories.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonVariants()}>
            Go to homepage
          </Link>
          <Link href="/categories" className={buttonVariants({ variant: "outline" })}>
            Browse categories
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
