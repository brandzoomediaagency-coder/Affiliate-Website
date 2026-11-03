import type { Tables } from "@/lib/supabase/database.types";
import { asArray } from "@/lib/utils";
import { MarkdownEditor, NameSlugFields, RowsEditor } from "./fields";
import { CheckField, Panel, SelectField, TextAreaField, TextField } from "./ui";
import { SubmitButton } from "./admin-form";

type Product = Tables<"products">;

export function ProductFormFields({
  product,
  brands,
  categories,
}: {
  product?: Product | null;
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; depth: number }>;
}) {
  return (
    <>
      <Panel title="Basics">
        <div className="space-y-4">
          <NameSlugFields nameLabel="Product name" defaultName={product?.name} defaultSlug={product?.slug} />
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              name="category_id"
              label="Category"
              defaultValue={product?.category_id}
              emptyLabel="— Select category —"
              options={categories.map((c) => ({ value: c.id, label: `${"— ".repeat(c.depth)}${c.name}` }))}
            />
            <SelectField name="brand_id" label="Brand" defaultValue={product?.brand_id} emptyLabel="— No brand —" options={brands.map((b) => ({ value: b.id, label: b.name }))} hint="Manage brands under Categories & brands." />
            <TextField name="model_number" label="Model number" defaultValue={product?.model_number} maxLength={120} />
          </div>
          <TextAreaField
            name="short_description"
            label="Short description"
            defaultValue={product?.short_description}
            rows={2}
            maxLength={320}
            hint="1–2 sentences shown on product cards and as the page summary. Write it yourself — never copy the merchant's description."
          />
        </div>
      </Panel>

      <Panel title="Editorial content" description="Original analysis that helps shoppers decide. Required before publishing.">
        <div className="space-y-5">
          <MarkdownEditor name="overview" label="Overview" defaultValue={product?.overview} rows={8} folder="products" />
          <MarkdownEditor name="description" label="Detailed description" defaultValue={product?.description} rows={10} folder="products" />
          <div className="grid gap-4 md:grid-cols-3">
            <TextAreaField name="key_features" label="Key features (one per line)" defaultValue={product?.key_features.join("\n")} rows={6} />
            <TextAreaField name="pros" label="Advantages (one per line)" defaultValue={product?.pros.join("\n")} rows={6} />
            <TextAreaField name="cons" label="Limitations (one per line)" defaultValue={product?.cons.join("\n")} rows={6} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextAreaField name="best_for" label="Who should consider it" defaultValue={product?.best_for} rows={4} hint="Markdown supported." />
            <TextAreaField name="not_ideal_for" label="Who may want an alternative" defaultValue={product?.not_ideal_for} rows={4} />
          </div>
          <MarkdownEditor name="buying_considerations" label="Things to check before buying" defaultValue={product?.buying_considerations} rows={6} />
        </div>
      </Panel>

      <Panel title="FAQs" description="Real questions shoppers ask. Shown on the page and used for FAQ structured data.">
        <RowsEditor
          name="faqs"
          addLabel="Add FAQ"
          columns={[
            { key: "question", label: "Question" },
            { key: "answer", label: "Answer", type: "textarea" },
          ]}
          defaultRows={asArray<Record<string, string>>(product?.faqs)}
        />
      </Panel>

      <Panel title="Sources & references" description="Cite where specifications and claims come from (manufacturer pages, official listings).">
        <RowsEditor
          name="sources"
          addLabel="Add source"
          columns={[
            { key: "title", label: "Title", width: "1.2fr" },
            { key: "url", label: "URL", type: "url", width: "1.5fr" },
            { key: "note", label: "Note (optional)" },
          ]}
          defaultRows={asArray<Record<string, string>>(product?.sources)}
        />
      </Panel>

      <Panel title="SEO">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField name="seo_title" label="SEO title" defaultValue={product?.seo_title} maxLength={120} hint="Defaults to “Name: specs, features & where to buy”." />
          <TextField name="canonical_url" label="Canonical URL (optional)" defaultValue={product?.canonical_url} type="url" />
          <TextAreaField name="meta_description" label="Meta description" defaultValue={product?.meta_description} rows={2} maxLength={320} className="md:col-span-2" />
          <TextField name="search_keywords" label="Internal search keywords" defaultValue={product?.search_keywords} hint="Synonyms and brand names that should find this product (not shown publicly)." className="md:col-span-2" />
        </div>
      </Panel>

      <Panel title="Visibility">
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField
            name="status"
            label="Status"
            defaultValue={product?.status ?? "draft"}
            options={[
              { value: "draft", label: "Draft (not public)" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived (not public)" },
            ]}
          />
          <div className="space-y-3 pt-1">
            <CheckField name="is_featured" label="Featured" defaultChecked={product?.is_featured} hint="Eligible for featured sections." />
            <CheckField name="noindex" label="Hide from search engines (noindex)" defaultChecked={product?.noindex} />
          </div>
          <div className="space-y-3 md:col-span-2">
            <CheckField name="is_trending" label="Show “Trending” label" defaultChecked={product?.is_trending} hint="Only when editorially justified — give the reason below." />
            <TextField name="trending_reason" label="Why is it trending?" defaultValue={product?.trending_reason} maxLength={200} placeholder="e.g. Most-clicked product in Audio this month" />
          </div>
        </div>
      </Panel>

      <div className="sticky bottom-0 z-10 -mx-1 flex justify-end gap-2 border-t border-line bg-canvas/95 px-1 py-3 backdrop-blur">
        <SubmitButton>{product ? "Save product" : "Create draft"}</SubmitButton>
      </div>
    </>
  );
}
