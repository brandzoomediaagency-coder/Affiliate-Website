import type { Tables } from "@/lib/supabase/database.types";
import { asArray } from "@/lib/utils";
import { MarkdownEditor, NameSlugFields, RowsEditor } from "@/components/admin/fields";
import { CheckField, Panel, SelectField, TextAreaField, TextField } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/admin-form";
import { Select } from "@/components/ui/form-controls";

export function ComparisonFields({
  comparison,
  items = [],
  products,
  categories,
}: {
  comparison?: Tables<"comparisons"> | null;
  items?: Array<{ product_id: string; highlight: string | null; note: string | null }>;
  products: Array<{ id: string; name: string; status: string }>;
  categories: Array<{ id: string; name: string; depth: number }>;
}) {
  const slots = [...items, ...Array.from({ length: Math.max(0, 6 - items.length) }, () => ({ product_id: "", highlight: null, note: null }))];
  return (
    <>
      <Panel title="Comparison">
        <div className="space-y-4">
          <NameSlugFields nameField="title" nameLabel="Title" defaultName={comparison?.title} defaultSlug={comparison?.slug} />
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              name="category_id"
              label="Category"
              defaultValue={comparison?.category_id}
              emptyLabel="— None —"
              options={categories.map((c) => ({ value: c.id, label: `${"— ".repeat(c.depth)}${c.name}` }))}
            />
            <TextAreaField name="summary" label="Summary" defaultValue={comparison?.summary} rows={2} maxLength={500} />
          </div>
          <MarkdownEditor name="intro" label="Introduction" defaultValue={comparison?.intro} rows={6} />
        </div>
      </Panel>
      <Panel title="Products to compare" description="Choose 2–8 products. Highlights must be justified by the specs or your research (e.g. “Largest battery per brand specs”).">
        <div className="space-y-3">
          {slots.map((slot, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-line p-3 md:grid-cols-[1.4fr_1fr_1.4fr]">
              <Select name="item_product_id" defaultValue={slot.product_id} aria-label={`Product ${i + 1}`}>
                <option value="">— Product {i + 1} —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.status !== "published" ? `(${p.status})` : ""}
                  </option>
                ))}
              </Select>
              {slot.product_id ? (
                <>
                  <input name={`highlight_${slot.product_id}`} defaultValue={slot.highlight ?? ""} placeholder="Highlight (optional)" className="h-11 rounded-xl border border-line-strong px-3 text-sm" maxLength={120} />
                  <input name={`note_${slot.product_id}`} defaultValue={slot.note ?? ""} placeholder="Note (optional)" className="h-11 rounded-xl border border-line-strong px-3 text-sm" maxLength={500} />
                </>
              ) : (
                <p className="self-center text-xs text-ink-400 md:col-span-2">Save to add a highlight and note for newly added products.</p>
              )}
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Table rows & verdict">
        <div className="space-y-4">
          <TextAreaField
            name="spec_labels"
            label="Specification rows (one label per line, optional)"
            defaultValue={comparison?.spec_labels.join("\n")}
            rows={5}
            hint="Must match product specification labels exactly. Leave empty to show labels shared by the products."
          />
          <MarkdownEditor name="verdict" label="Our take" defaultValue={comparison?.verdict} rows={6} />
        </div>
      </Panel>
      <Panel title="FAQs">
        <RowsEditor
          name="faqs"
          addLabel="Add FAQ"
          columns={[
            { key: "question", label: "Question" },
            { key: "answer", label: "Answer", type: "textarea" },
          ]}
          defaultRows={asArray<Record<string, string>>(comparison?.faqs)}
        />
      </Panel>
      <Panel title="SEO & visibility">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField name="seo_title" label="SEO title" defaultValue={comparison?.seo_title} maxLength={120} />
          <SelectField
            name="status"
            label="Status"
            defaultValue={comparison?.status ?? "draft"}
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
            ]}
          />
          <TextAreaField name="meta_description" label="Meta description" defaultValue={comparison?.meta_description} rows={2} maxLength={320} className="md:col-span-2" />
          <CheckField name="is_featured" label="Featured on homepage" defaultChecked={comparison?.is_featured} />
        </div>
      </Panel>
      <div className="flex justify-end">
        <SubmitButton>{comparison ? "Save comparison" : "Create comparison"}</SubmitButton>
      </div>
    </>
  );
}
