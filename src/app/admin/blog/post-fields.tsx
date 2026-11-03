import type { Tables } from "@/lib/supabase/database.types";
import { asArray } from "@/lib/utils";
import { ImageUrlField, MarkdownEditor, NameSlugFields, RowsEditor } from "@/components/admin/fields";
import { CheckField, Panel, SelectField, TextAreaField, TextField, toLocalInput } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/admin-form";

export function PostFields({
  post,
  authors,
  blogCategories,
  productCategories,
  tags,
  selectedTagIds = [],
  products,
  selectedProductIds = [],
}: {
  post?: Tables<"blog_posts"> | null;
  authors: Array<{ id: string; name: string }>;
  blogCategories: Array<{ id: string; name: string }>;
  productCategories: Array<{ id: string; name: string; depth: number }>;
  tags: Array<{ id: string; name: string }>;
  selectedTagIds?: string[];
  products: Array<{ id: string; name: string; status: string }>;
  selectedProductIds?: string[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-6">
        <Panel>
          <div className="space-y-4">
            <NameSlugFields nameField="title" nameLabel="Title" defaultName={post?.title} defaultSlug={post?.slug} />
            <TextAreaField name="excerpt" label="Excerpt / introduction summary" defaultValue={post?.excerpt} rows={2} maxLength={400} />
            <TextAreaField
              name="answer_summary"
              label="Quick answer (AEO)"
              defaultValue={post?.answer_summary}
              rows={3}
              maxLength={800}
              hint="A direct, stand-alone 2–4 sentence answer to the article's main question, shown near the top."
            />
            <MarkdownEditor
              name="content"
              label="Article"
              defaultValue={post?.content}
              rows={26}
              hint="Use ## for main sections and ### for sub-sections (they build the table of contents). Add tables, steps and internal links like [compare products](/products)."
            />
          </div>
        </Panel>
        <Panel title="FAQs" description="Shown at the end of the article (with FAQ structured data). Answer real questions concisely.">
          <RowsEditor
            name="faqs"
            addLabel="Add FAQ"
            columns={[
              { key: "question", label: "Question" },
              { key: "answer", label: "Answer", type: "textarea" },
            ]}
            defaultRows={asArray<Record<string, string>>(post?.faqs)}
          />
        </Panel>
        <Panel title="Sources & references" description="Credible sources for facts, figures and policies cited in the article.">
          <RowsEditor
            name="sources"
            addLabel="Add source"
            columns={[
              { key: "title", label: "Title", width: "1.2fr" },
              { key: "url", label: "URL", type: "url", width: "1.5fr" },
              { key: "note", label: "Note" },
            ]}
            defaultRows={asArray<Record<string, string>>(post?.sources)}
          />
        </Panel>
        <Panel title="SEO">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField name="seo_title" label="SEO title" defaultValue={post?.seo_title} maxLength={120} />
            <TextField name="canonical_url" label="Canonical URL (optional)" type="url" defaultValue={post?.canonical_url} />
            <TextAreaField name="meta_description" label="Meta description" defaultValue={post?.meta_description} rows={2} maxLength={320} className="md:col-span-2" />
            <TextField name="primary_keyword" label="Primary keyword" defaultValue={post?.primary_keyword} />
            <SelectField
              name="search_intent"
              label="Search intent"
              defaultValue={post?.search_intent}
              emptyLabel="— Not set —"
              options={["informational", "commercial", "transactional", "navigational"].map((s) => ({ value: s, label: s }))}
            />
            <TextAreaField name="secondary_keywords" label="Secondary keywords (one per line)" defaultValue={post?.secondary_keywords.join("\n")} rows={3} className="md:col-span-2" />
          </div>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Publishing">
          <div className="space-y-4">
            <SelectField
              name="status"
              label="Status"
              defaultValue={post?.status ?? "draft"}
              options={[
                { value: "draft", label: "Draft" },
                { value: "in_review", label: "In editorial review" },
                { value: "scheduled", label: "Scheduled" },
                { value: "published", label: "Published" },
                { value: "archived", label: "Archived" },
              ]}
            />
            <TextField
              name="published_at"
              label="Publish date (IST)"
              type="datetime-local"
              defaultValue={toLocalInput(post?.published_at)}
              hint="For scheduled posts, choose a future time — the post goes live automatically."
            />
            <CheckField name="ai_assisted" label="AI-assisted draft" defaultChecked={post?.ai_assisted ?? false} hint="Requires a recorded editorial review before publishing." />
            <CheckField name="is_featured" label="Featured" defaultChecked={post?.is_featured} />
            <CheckField name="noindex" label="Hide from search engines" defaultChecked={post?.noindex} />
            <TextField name="revision_note" label="Revision note (optional)" placeholder="What changed?" />
            <SubmitButton block>{post ? "Save post" : "Create draft"}</SubmitButton>
          </div>
        </Panel>
        <Panel title="Organisation">
          <div className="space-y-4">
            <SelectField name="author_id" label="Author" defaultValue={post?.author_id} emptyLabel="— None —" options={authors.map((a) => ({ value: a.id, label: a.name }))} />
            <SelectField name="category_id" label="Blog category" defaultValue={post?.category_id} emptyLabel="— None —" options={blogCategories.map((c) => ({ value: c.id, label: c.name }))} />
            <SelectField
              name="product_category_id"
              label="Related shop category"
              defaultValue={post?.product_category_id}
              emptyLabel="— None —"
              options={productCategories.map((c) => ({ value: c.id, label: `${"— ".repeat(c.depth)}${c.name}` }))}
              hint="Shows this guide on that category's page."
            />
            <div>
              <p className="mb-1.5 text-sm font-semibold text-ink-800">Tags</p>
              <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                {tags.map((t) => (
                  <label key={t.id} className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs">
                    <input type="checkbox" name="tag_ids" value={t.id} defaultChecked={selectedTagIds.includes(t.id)} /> {t.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="product_ids" className="mb-1.5 block text-sm font-semibold text-ink-800">
                Products mentioned
              </label>
              <select id="product_ids" name="product_ids" multiple size={6} defaultValue={selectedProductIds} className="w-full rounded-xl border border-line-strong p-2 text-sm">
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.status !== "published" ? `(${p.status})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Panel>
        <Panel title="Featured image">
          <div className="space-y-3">
            <ImageUrlField name="featured_image_url" label="Image" defaultValue={post?.featured_image_url} folder="blog" />
            <TextField name="featured_image_alt" label="Alt text" defaultValue={post?.featured_image_alt} />
          </div>
        </Panel>
        <Panel title="Editor notes (internal)">
          <TextAreaField name="editor_notes" label="Notes" defaultValue={post?.editor_notes} rows={6} hint="Never shown publicly." />
        </Panel>
      </div>
    </div>
  );
}
