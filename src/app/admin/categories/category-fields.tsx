import type { Tables } from "@/lib/supabase/database.types";
import { asArray } from "@/lib/utils";
import { CATEGORY_ICONS } from "@/components/shared/icons";
import { ImageUrlField, MarkdownEditor, NameSlugFields, RowsEditor } from "@/components/admin/fields";
import { CheckField, Panel, SelectField, TextAreaField, TextField } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/admin-form";

export function CategoryFields({
  category,
  parents,
}: {
  category?: Tables<"categories"> | null;
  parents: Array<{ id: string; name: string; depth: number }>;
}) {
  return (
    <>
      <Panel title="Category">
        <div className="space-y-4">
          <NameSlugFields defaultName={category?.name} defaultSlug={category?.slug} />
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              name="parent_id"
              label="Parent category"
              defaultValue={category?.parent_id}
              emptyLabel="— None (top level) —"
              options={parents.filter((p) => p.id !== category?.id).map((p) => ({ value: p.id, label: `${"— ".repeat(p.depth)}${p.name}` }))}
            />
            <SelectField
              name="icon"
              label="Icon"
              defaultValue={category?.icon ?? "package"}
              options={Object.keys(CATEGORY_ICONS).map((k) => ({ value: k, label: k }))}
            />
            <TextField name="sort_order" label="Sort order" type="number" defaultValue={category?.sort_order ?? 0} />
          </div>
          <TextAreaField name="short_description" label="Short description" defaultValue={category?.short_description} rows={2} maxLength={300} />
          <MarkdownEditor
            name="description"
            label="Category guide (unique description)"
            defaultValue={category?.description}
            rows={8}
            folder="categories"
            hint="Unique, helpful copy for this category — what to check, key specs, common pitfalls. Avoid near-duplicate text across categories."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <ImageUrlField name="image_url" label="Category image (optional)" defaultValue={category?.image_url} folder="categories" />
            <TextField name="image_alt" label="Image alt text" defaultValue={category?.image_alt} />
          </div>
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
          defaultRows={asArray<Record<string, string>>(category?.faqs)}
        />
      </Panel>
      <Panel title="SEO & visibility">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField name="seo_title" label="SEO title" defaultValue={category?.seo_title} maxLength={120} />
          <TextField name="home_sort_order" label="Homepage order" type="number" defaultValue={category?.home_sort_order ?? 0} />
          <TextAreaField name="meta_description" label="Meta description" defaultValue={category?.meta_description} rows={2} maxLength={320} className="md:col-span-2" />
          <CheckField name="is_active" label="Active" defaultChecked={category?.is_active ?? true} />
          <CheckField name="show_on_home" label="Show in homepage “Popular categories”" defaultChecked={category?.show_on_home} />
          <CheckField name="noindex" label="Hide from search engines (noindex)" defaultChecked={category?.noindex} />
        </div>
      </Panel>
      <div className="flex justify-end">
        <SubmitButton>{category ? "Save category" : "Create category"}</SubmitButton>
      </div>
    </>
  );
}
