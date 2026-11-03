"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  Bold,
  Eye,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pencil,
  Plus,
  Quote,
  Table,
  Trash2,
  Upload,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { previewMarkdown, uploadMedia } from "@/lib/actions/admin/media";
import { slugify, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form-controls";
import { useToast } from "@/components/providers/toast-provider";

/** Name + slug pair that auto-generates the slug until it is edited manually. */
export function NameSlugFields({
  nameLabel = "Name",
  nameField = "name",
  defaultName = "",
  defaultSlug = "",
  errors,
}: {
  nameLabel?: string;
  nameField?: string;
  defaultName?: string;
  defaultSlug?: string;
  errors?: Record<string, string[] | undefined>;
}) {
  const [name, setName] = useState(defaultName);
  const [slug, setSlug] = useState(defaultSlug);
  const [touched, setTouched] = useState(Boolean(defaultSlug));
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor={nameField} className="mb-1.5 block text-sm font-semibold text-ink-800">
          {nameLabel} <span className="text-red-500">*</span>
        </label>
        <Input
          id={nameField}
          name={nameField}
          value={name}
          required
          onChange={(e) => {
            setName(e.target.value);
            if (!touched) setSlug(slugify(e.target.value));
          }}
          aria-invalid={Boolean(errors?.[nameField])}
        />
        {errors?.[nameField] && <p className="mt-1 text-sm text-red-600">{errors[nameField]![0]}</p>}
      </div>
      <div>
        <label htmlFor="slug" className="mb-1.5 block text-sm font-semibold text-ink-800">
          URL slug <span className="text-red-500">*</span>
        </label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          onChange={(e) => {
            setTouched(true);
            setSlug(e.target.value.toLowerCase());
          }}
          aria-invalid={Boolean(errors?.slug)}
        />
        <p className="mt-1 text-xs text-ink-500">Lowercase letters, numbers and hyphens. Changing a live slug changes its URL.</p>
        {errors?.slug && <p className="mt-1 text-sm text-red-600">{errors.slug[0]}</p>}
      </div>
    </div>
  );
}

export type RowColumn = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "url";
  width?: string;
};

/**
 * Repeatable rows editor (FAQs, sources, specifications, links…). Serialises
 * the rows to JSON in a hidden input named `name`.
 */
export function RowsEditor({
  name,
  columns,
  defaultRows = [],
  addLabel = "Add row",
  emptyText = "No rows yet.",
  max = 100,
}: {
  name: string;
  columns: RowColumn[];
  defaultRows?: Array<Record<string, string | null | undefined>>;
  addLabel?: string;
  emptyText?: string;
  max?: number;
}) {
  const blank = () => Object.fromEntries(columns.map((c) => [c.key, ""]));
  const [rows, setRows] = useState<Array<Record<string, string>>>(
    defaultRows.map((r) => Object.fromEntries(columns.map((c) => [c.key, String(r[c.key] ?? "")]))),
  );
  const cleaned = rows.filter((r) => columns.some((c) => r[c.key]?.trim()));
  const move = (i: number, dir: -1 | 1) =>
    setRows((all) => {
      const next = [...all];
      const j = i + dir;
      if (j < 0 || j >= next.length) return all;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(cleaned)} />
      {rows.length === 0 && <p className="text-sm text-ink-400">{emptyText}</p>}
      {rows.map((row, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-xl border border-line bg-canvas/50 p-2.5 sm:flex-row sm:items-start">
          <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: columns.map((c) => c.width ?? "1fr").join(" ") }}>
            {columns.map((c) =>
              c.type === "textarea" ? (
                <Textarea
                  key={c.key}
                  aria-label={c.label}
                  placeholder={c.placeholder ?? c.label}
                  value={row[c.key]}
                  rows={2}
                  className="min-h-16 text-sm"
                  onChange={(e) => setRows((all) => all.map((r, j) => (j === i ? { ...r, [c.key]: e.target.value } : r)))}
                />
              ) : (
                <Input
                  key={c.key}
                  aria-label={c.label}
                  placeholder={c.placeholder ?? c.label}
                  type={c.type === "url" ? "url" : "text"}
                  value={row[c.key]}
                  className="h-10 text-sm"
                  onChange={(e) => setRows((all) => all.map((r, j) => (j === i ? { ...r, [c.key]: e.target.value } : r)))}
                />
              ),
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => move(i, -1)} aria-label="Move up" disabled={i === 0}>
              <ArrowUp />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => move(i, 1)} aria-label="Move down" disabled={i === rows.length - 1}>
              <ArrowDown />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setRows((all) => all.filter((_, j) => j !== i))} aria-label="Remove row">
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
      {rows.length < max && (
        <Button variant="soft" size="sm" onClick={() => setRows((all) => [...all, blank()])}>
          <Plus /> {addLabel}
        </Button>
      )}
    </div>
  );
}

/** URL input with an "Upload" button that stores the file in Supabase Storage. */
export function ImageUrlField({
  name,
  label,
  defaultValue = "",
  folder,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  folder: string;
  hint?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-ink-800">
        {label}
      </label>
      <div className="flex gap-2">
        <Input id={name} name={name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" type="url" />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.set("file", file);
            fd.set("folder", folder);
            start(async () => {
              const res = await uploadMedia(fd);
              if (res.ok && res.url) {
                setUrl(res.url);
                toast({ tone: "success", title: "Image uploaded" });
              } else toast({ tone: "error", title: res.message ?? "Upload failed" });
              if (fileRef.current) fileRef.current.value = "";
            });
          }}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={pending}>
          <Upload /> {pending ? "Uploading…" : "Upload"}
        </Button>
      </div>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      {url && /^https?:\/\//.test(url) && (
        <div className="relative mt-2 h-24 w-40 overflow-hidden rounded-xl border border-line bg-white">
          <Image src={url} alt="" fill sizes="160px" className="object-contain" unoptimized />
        </div>
      )}
    </div>
  );
}

const TOOLBAR: Array<{ label: string; Icon: typeof Bold; apply: (sel: string) => string }> = [
  { label: "Heading 2", Icon: Heading2, apply: (s) => `\n## ${s || "Heading"}\n` },
  { label: "Heading 3", Icon: Heading3, apply: (s) => `\n### ${s || "Subheading"}\n` },
  { label: "Bold", Icon: Bold, apply: (s) => `**${s || "bold text"}**` },
  { label: "Italic", Icon: Italic, apply: (s) => `_${s || "italic text"}_` },
  { label: "Link", Icon: Link2, apply: (s) => `[${s || "link text"}](https://)` },
  { label: "Bulleted list", Icon: List, apply: (s) => `\n- ${s || "Item"}\n- Item\n` },
  { label: "Numbered list", Icon: ListOrdered, apply: (s) => `\n1. ${s || "Step"}\n2. Step\n` },
  { label: "Quote", Icon: Quote, apply: (s) => `\n> ${s || "Quote"}\n` },
  { label: "Table", Icon: Table, apply: () => `\n| Column | Column |\n| --- | --- |\n| Value | Value |\n` },
  { label: "Divider", Icon: Minus, apply: () => `\n---\n` },
];

/** Markdown editor with formatting toolbar, image upload and live preview. */
export function MarkdownEditor({
  name,
  defaultValue = "",
  rows = 18,
  label,
  hint,
  folder = "blog",
}: {
  name: string;
  defaultValue?: string | null;
  rows?: number;
  label?: string;
  hint?: string;
  folder?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [html, setHtml] = useState("");
  const [pending, start] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const insert = (fn: (sel: string) => string) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const next = value.slice(0, a) + fn(value.slice(a, b)) + value.slice(b);
    setValue(next);
    requestAnimationFrame(() => el.focus());
  };

  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div>
      {label && <p className="mb-1.5 text-sm font-semibold text-ink-800">{label}</p>}
      <div className="overflow-hidden rounded-xl border border-line-strong bg-white">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-canvas/60 px-2 py-1.5">
          {TOOLBAR.map(({ label: l, Icon, apply }) => (
            <button
              key={l}
              type="button"
              title={l}
              aria-label={l}
              disabled={mode === "preview"}
              onClick={() => insert(apply)}
              className="rounded-lg p-1.5 text-ink-600 hover:bg-white hover:text-ink-900 disabled:opacity-40"
            >
              <Icon className="size-4" />
            </button>
          ))}
          <button
            type="button"
            title="Upload image"
            aria-label="Upload image"
            disabled={mode === "preview" || pending}
            onClick={() => fileRef.current?.click()}
            className="rounded-lg p-1.5 text-ink-600 hover:bg-white hover:text-ink-900 disabled:opacity-40"
          >
            <ImagePlus className="size-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.set("file", file);
              fd.set("folder", folder);
              start(async () => {
                const res = await uploadMedia(fd);
                if (res.ok && res.url) insert(() => `\n![Describe the image](${res.url})\n`);
                else toast({ tone: "error", title: res.message ?? "Upload failed" });
                if (fileRef.current) fileRef.current.value = "";
              });
            }}
          />
          <div className="ml-auto flex rounded-lg bg-white p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode("write")}
              className={cn("flex items-center gap-1 rounded-md px-2.5 py-1", mode === "write" ? "bg-brand-600 text-white" : "text-ink-600")}
            >
              <Pencil className="size-3" /> Write
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("preview");
                start(async () => setHtml(await previewMarkdown(value)));
              }}
              className={cn("flex items-center gap-1 rounded-md px-2.5 py-1", mode === "preview" ? "bg-brand-600 text-white" : "text-ink-600")}
            >
              <Eye className="size-3" /> Preview
            </button>
          </div>
        </div>
        <textarea
          ref={ref}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={rows}
          className={cn("block w-full resize-y p-4 font-mono text-sm leading-relaxed text-ink-900 focus:outline-none", mode === "preview" && "hidden")}
        />
        {mode === "preview" && (
          <div className="prose-content max-h-[70vh] min-h-48 overflow-y-auto p-5" dangerouslySetInnerHTML={{ __html: pending ? "<p>Rendering…</p>" : html }} />
        )}
      </div>
      <p className="mt-1 flex justify-between text-xs text-ink-500">
        <span>{hint ?? "Markdown supported: ## headings, **bold**, lists, tables, [links](https://…)."}</span>
        <span>{words.toLocaleString("en-IN")} words</span>
      </p>
    </div>
  );
}
