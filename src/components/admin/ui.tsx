import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/misc";
import { Checkbox, Input, Label, Select, Textarea } from "@/components/ui/form-controls";
import { ErrorFor } from "./admin-form";

export function AdminHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-1 inline-block text-sm font-semibold text-brand-700 hover:underline">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">{title}</h1>
        {description && <div className="mt-1 text-sm text-ink-500">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className,
  actions,
}: {
  title?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-line bg-white p-5 shadow-card", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-bold text-ink-900">{title}</h2>}
            {description && <div className="mt-0.5 text-sm text-ink-500">{description}</div>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

/** Labeled input bound to AdminForm field errors. */
export function TextField({
  name,
  label,
  defaultValue,
  hint,
  required,
  type = "text",
  placeholder,
  maxLength,
  className,
  step,
  min,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  hint?: React.ReactNode;
  required?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  step?: string;
  min?: number;
}) {
  return (
    <div className={className}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        step={step}
        min={min}
      />
      {hint && <p className="mt-1 text-xs leading-relaxed text-ink-500">{hint}</p>}
      <ErrorFor name={name} />
    </div>
  );
}

export function TextAreaField({
  name,
  label,
  defaultValue,
  hint,
  rows = 4,
  maxLength,
  className,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  hint?: React.ReactNode;
  rows?: number;
  maxLength?: number;
  className?: string;
  placeholder?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} defaultValue={defaultValue ?? ""} rows={rows} maxLength={maxLength} placeholder={placeholder} />
      {hint && <p className="mt-1 text-xs leading-relaxed text-ink-500">{hint}</p>}
      <ErrorFor name={name} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  defaultValue,
  options,
  hint,
  required,
  className,
  emptyLabel,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  options: Array<{ value: string; label: string }>;
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  emptyLabel?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      <Select id={name} name={name} defaultValue={defaultValue ?? ""} required={required}>
        {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      {hint && <p className="mt-1 text-xs leading-relaxed text-ink-500">{hint}</p>}
      <ErrorFor name={name} />
    </div>
  );
}

export function CheckField({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex items-start gap-2.5 text-sm text-ink-800">
      <Checkbox name={name} defaultChecked={defaultChecked} className="mt-0.5" />
      <span>
        <span className="font-semibold">{label}</span>
        {hint && <span className="block text-xs text-ink-500">{hint}</span>}
      </span>
    </label>
  );
}

const statusVariants: Record<string, "success" | "neutral" | "saffron" | "danger" | "brand" | "outline"> = {
  published: "success",
  active: "success",
  approved: "success",
  ok: "success",
  subscribed: "success",
  draft: "neutral",
  in_review: "saffron",
  scheduled: "brand",
  archived: "outline",
  inactive: "outline",
  disabled: "danger",
  broken: "danger",
  error: "danger",
  rejected: "danger",
  paused: "saffron",
  pending: "saffron",
  applied: "saffron",
  unchecked: "neutral",
  redirected: "saffron",
  not_configured: "neutral",
  credentials_added: "brand",
  unsubscribed: "outline",
  new: "brand",
  read: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusVariants[status] ?? "neutral"}>{status.replace(/_/g, " ")}</Badge>;
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-line bg-white shadow-card", className)}>
      <table className="w-full min-w-[40rem] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("border-b border-line bg-canvas/70 px-4 py-3 text-left text-xs font-bold tracking-wide text-ink-500 uppercase", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-line px-4 py-3 align-middle text-ink-700", className)}>{children}</td>;
}

/** Lightweight bar chart (no chart library). */
export function BarChart({
  data,
  height = 160,
  label,
}: {
  data: Array<{ label: string; value: number }>;
  height?: number;
  label: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure aria-label={label}>
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-brand-500/80 transition group-hover:bg-brand-600"
              style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 3 : 0.5)}%` }}
            />
            <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded bg-ink-900 px-1.5 py-0.5 text-[0.65rem] whitespace-nowrap text-white group-hover:block">
              {d.label}: {d.value}
            </span>
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex justify-between text-[0.7rem] text-ink-400">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </figcaption>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th>{d.label}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function HBarList({ items, empty = "No data yet." }: { items: Array<{ label: React.ReactNode; value: number; key: string }>; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return <p className="text-sm text-ink-400">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.key}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate text-ink-700">{i.label}</span>
            <span className="font-semibold text-ink-900">{i.value.toLocaleString("en-IN")}</span>
          </div>
          <div className="h-2 rounded-full bg-canvas">
            <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">{label}</p>
      <p className="mt-1.5 text-2xl font-extrabold text-ink-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

/** Formats a timestamp for datetime-local inputs in IST. */
export function toLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 16);
}
