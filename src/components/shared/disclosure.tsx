import Link from "next/link";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Affiliate disclosure shown near affiliate buttons and recommendations. */
export function AffiliateDisclosure({
  text,
  merchantStatements = [],
  className,
  compact = false,
}: {
  text: string;
  merchantStatements?: string[];
  className?: string;
  compact?: boolean;
}) {
  const statements = [...new Set(merchantStatements.filter(Boolean))];
  return (
    <aside
      aria-label="Affiliate disclosure"
      className={cn(
        "flex gap-2.5 rounded-xl border border-line bg-canvas/70 text-ink-600",
        compact ? "p-2.5 text-xs" : "p-3.5 text-[0.8rem]",
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden="true" />
      <p className="leading-relaxed">
        {text}{" "}
        {statements.map((s) => (
          <span key={s} className="font-medium text-ink-800">
            {s}{" "}
          </span>
        ))}
        <Link href="/affiliate-disclosure" className="font-semibold text-brand-700 underline underline-offset-2">
          Learn more
        </Link>
      </p>
    </aside>
  );
}
