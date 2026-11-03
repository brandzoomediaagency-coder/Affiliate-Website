import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Original geometric mark: a tag shape with a spark — no third-party branding. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden="true">
      <defs>
        <linearGradient id="kw-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7258fa" />
          <stop offset="1" stopColor="#3d299e" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#kw-g)" />
      <path
        d="M11 13.5c0-1.4 1.1-2.5 2.5-2.5h7.3c.7 0 1.3.3 1.8.7l6.7 6.7c1 1 1 2.6 0 3.5l-7.3 7.3c-1 1-2.6 1-3.5 0l-6.7-6.7c-.5-.5-.8-1.1-.8-1.8v-7.2Z"
        fill="#fff"
        opacity=".95"
      />
      <circle cx="16.3" cy="16.3" r="2.1" fill="#5d3fe8" />
      <path d="M29.5 8.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z" fill="#ffbb33" />
    </svg>
  );
}

export function Logo({
  brandName,
  logoUrl,
  className,
  inverted = false,
}: {
  brandName: string;
  logoUrl?: string | null;
  className?: string;
  inverted?: boolean;
}) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 rounded-lg", className)} aria-label={`${brandName} home`}>
      {logoUrl ? (
        <Image src={logoUrl} alt={brandName} width={140} height={36} className="h-9 w-auto object-contain" priority />
      ) : (
        <>
          <BrandMark />
          <span className={cn("text-xl font-extrabold tracking-tight", inverted ? "text-white" : "text-ink-900")}>
            {brandName}
          </span>
        </>
      )}
    </Link>
  );
}
