"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Prominent product search box. Works without JavaScript (GET form). */
export function ProductSearch({
  defaultValue = "",
  size = "md",
  className,
  autoFocus,
  placeholder = "Search products, brands and categories…",
}: {
  defaultValue?: string;
  size?: "md" | "lg";
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      role="search"
      action="/search"
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
      }}
      className={cn("relative w-full", className)}
    >
      <label htmlFor={`search-${size}`} className="sr-only">
        Search products
      </label>
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-400",
          size === "lg" ? "size-5" : "size-[1.1rem]",
        )}
        aria-hidden="true"
      />
      <input
        id={`search-${size}`}
        name="q"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        maxLength={200}
        autoFocus={autoFocus}
        className={cn(
          "w-full rounded-2xl border border-line-strong bg-white pr-28 text-ink-900 placeholder:text-ink-400 shadow-sm transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none",
          size === "lg" ? "h-14 pl-12 text-base" : "h-11 pl-11 text-sm",
        )}
      />
      <button
        type="submit"
        className={cn(
          "absolute top-1/2 right-1.5 -translate-y-1/2 rounded-xl bg-brand-600 font-semibold text-white transition hover:bg-brand-700",
          size === "lg" ? "h-11 px-5 text-sm" : "h-8 px-3.5 text-xs",
        )}
      >
        Search
      </button>
    </form>
  );
}
