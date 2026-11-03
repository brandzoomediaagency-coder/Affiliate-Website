import { ChevronDown, ExternalLink } from "lucide-react";
import type { Faq, SourceRef } from "@/lib/data/types";
import { renderMarkdown } from "@/lib/markdown";
import { JsonLd } from "@/components/seo/json-ld";
import { faqJsonLd } from "@/lib/seo/jsonld";
import { cn } from "@/lib/utils";

export function Markdown({ content, className }: { content: string | null | undefined; className?: string }) {
  const { html } = renderMarkdown(content);
  if (!html) return null;
  return <div className={cn("prose-content", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Visible FAQ accordion; emits FAQPage JSON-LD for the same visible content. */
export function FaqList({ faqs, title = "Frequently asked questions", withSchema = true }: { faqs: Faq[]; title?: string; withSchema?: boolean }) {
  if (faqs.length === 0) return null;
  return (
    <section aria-labelledby="faqs" className="scroll-mt-40">
      <h2 id="faqs" className="mb-4 text-2xl font-extrabold tracking-tight text-ink-900">
        {title}
      </h2>
      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {faqs.map((f) => (
          <details key={f.question} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-semibold text-ink-900 marker:hidden hover:bg-canvas/60 sm:p-5">
              <h3 className="text-base">{f.question}</h3>
              <ChevronDown className="size-5 shrink-0 text-ink-400 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="px-4 pb-5 text-[0.95rem] leading-relaxed whitespace-pre-line text-ink-600 sm:px-5">{f.answer}</p>
          </details>
        ))}
      </div>
      {withSchema && <JsonLd data={faqJsonLd(faqs)} />}
    </section>
  );
}

export function SourcesList({ sources, title = "Sources & references" }: { sources: SourceRef[]; title?: string }) {
  if (sources.length === 0) return null;
  return (
    <section aria-labelledby="sources">
      <h2 id="sources" className="mb-3 text-lg font-bold text-ink-900">
        {title}
      </h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-600">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
              {s.title} <ExternalLink className="size-3" aria-hidden="true" />
            </a>
            {s.note && <span className="text-ink-500"> — {s.note}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
