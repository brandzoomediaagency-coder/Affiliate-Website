"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-red-50 text-red-600">
        <TriangleAlert className="size-8" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">Something went wrong</h1>
      <p className="mt-3 max-w-md text-ink-500">We couldn&apos;t load this page right now. Please try again in a moment.</p>
      {error.digest && <p className="mt-2 text-xs text-ink-400">Reference: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Go home
        </Link>
      </div>
    </div>
  );
}
