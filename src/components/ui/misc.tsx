import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      variant: {
        brand: "bg-brand-50 text-brand-700",
        saffron: "bg-saffron-100 text-saffron-700",
        success: "bg-emerald-50 text-emerald-700",
        danger: "bg-red-50 text-red-700",
        neutral: "bg-ink-900/5 text-ink-700",
        dark: "bg-ink-900 text-white",
        outline: "border border-line-strong text-ink-700 bg-white",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-line bg-white shadow-card", className)} {...props} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

const noticeStyles = {
  info: { cls: "border-brand-100 bg-brand-50 text-brand-900", Icon: Info },
  success: { cls: "border-emerald-100 bg-emerald-50 text-emerald-900", Icon: CircleCheck },
  warning: { cls: "border-saffron-200 bg-saffron-50 text-saffron-700", Icon: TriangleAlert },
  error: { cls: "border-red-100 bg-red-50 text-red-800", Icon: CircleAlert },
} as const;

export function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof noticeStyles;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { cls, Icon } = noticeStyles[tone];
  return (
    <div className={cn("flex gap-3 rounded-xl border p-3.5 text-sm", cls, className)} role={tone === "error" ? "alert" : "status"}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 space-y-1 leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  hrefLabel = "View all",
  as: Tag = "h2",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-1.5 text-xs font-bold tracking-[0.14em] text-brand-600 uppercase">{eyebrow}</p>}
        <Tag className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-[1.75rem]">{title}</Tag>
        {description && <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-500">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 rounded-lg px-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          {hrefLabel} <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-white/60 px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 [&_svg]:size-6">{icon}</div>
      )}
      <p className="text-lg font-bold text-ink-900">{title}</p>
      {description && <div className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-500">{description}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-line bg-white", className)}>
      <div className="container-page py-8 sm:py-10">
        {children}
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{title}</h1>
        {description && <div className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-ink-500">{description}</div>}
      </div>
    </div>
  );
}
