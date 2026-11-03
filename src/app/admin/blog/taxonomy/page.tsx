import { createSessionClient } from "@/lib/supabase/clients";
import { deleteAuthor, deleteBlogTaxonomy, saveAuthor, saveBlogTaxonomy } from "@/lib/actions/admin/blog";
import { AdminForm, ConfirmAction, SubmitButton } from "@/components/admin/admin-form";
import { ImageUrlField, NameSlugFields } from "@/components/admin/fields";
import { AdminHeader, CheckField, Panel, TextAreaField, TextField } from "@/components/admin/ui";

export default async function BlogTaxonomyPage() {
  const supabase = await createSessionClient();
  const [{ data: authors }, { data: categories }, { data: tags }] = await Promise.all([
    supabase.from("blog_authors").select("*").order("name"),
    supabase.from("blog_categories").select("*").order("sort_order"),
    supabase.from("blog_tags").select("*").order("name"),
  ]);
  return (
    <div className="max-w-4xl space-y-6">
      <AdminHeader title="Authors, categories & tags" back={{ href: "/admin/blog", label: "Blog posts" }} />

      <Panel title="Authors" description="Real people (or your editorial team) with accurate credentials. Never invent experts.">
        <div className="space-y-3">
          {(authors ?? []).map((a) => (
            <details key={a.id} className="rounded-xl border border-line p-3">
              <summary className="cursor-pointer text-sm font-semibold text-ink-900">
                {a.name} {!a.is_active && <span className="text-xs text-ink-400">(inactive)</span>}
              </summary>
              <AdminForm action={saveAuthor.bind(null, a.id)} className="mt-3 space-y-3">
                <NameSlugFields defaultName={a.name} defaultSlug={a.slug} />
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField name="job_title" label="Job title" defaultValue={a.job_title} />
                  <TextField name="website_url" label="Website / profile URL" type="url" defaultValue={a.website_url} />
                  <TextField name="expertise" label="Expertise (comma separated)" defaultValue={a.expertise.join(", ")} className="md:col-span-2" />
                  <TextAreaField name="bio" label="Bio" defaultValue={a.bio} rows={3} className="md:col-span-2" />
                  <ImageUrlField name="avatar_url" label="Photo" defaultValue={a.avatar_url} folder="authors" />
                  <CheckField name="is_active" label="Active" defaultChecked={a.is_active} />
                </div>
                <div className="flex gap-2">
                  <SubmitButton size="sm">Save author</SubmitButton>
                  <ConfirmAction action={deleteAuthor.bind(null, a.id)} confirm={`Delete ${a.name}?`} variant="ghost">
                    Delete
                  </ConfirmAction>
                </div>
              </AdminForm>
            </details>
          ))}
          <details className="rounded-xl border border-dashed border-line-strong p-3">
            <summary className="cursor-pointer text-sm font-semibold text-brand-700">+ Add author</summary>
            <AdminForm action={saveAuthor.bind(null, null)} className="mt-3 space-y-3" resetOnSuccess>
              <NameSlugFields />
              <div className="grid gap-3 md:grid-cols-2">
                <TextField name="job_title" label="Job title" />
                <TextField name="website_url" label="Website / profile URL" type="url" />
                <TextField name="expertise" label="Expertise (comma separated)" className="md:col-span-2" />
                <TextAreaField name="bio" label="Bio" rows={3} className="md:col-span-2" />
                <CheckField name="is_active" label="Active" defaultChecked />
              </div>
              <SubmitButton size="sm">Add author</SubmitButton>
            </AdminForm>
          </details>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Blog categories">
          <div className="space-y-3">
            {(categories ?? []).map((c) => (
              <details key={c.id} className="rounded-xl border border-line p-3">
                <summary className="cursor-pointer text-sm font-semibold text-ink-900">{c.name}</summary>
                <AdminForm action={saveBlogTaxonomy.bind(null, "category", c.id)} className="mt-3 space-y-3">
                  <NameSlugFields defaultName={c.name} defaultSlug={c.slug} />
                  <TextAreaField name="description" label="Description" defaultValue={c.description} rows={2} />
                  <div className="flex gap-2">
                    <SubmitButton size="sm">Save</SubmitButton>
                    <ConfirmAction action={deleteBlogTaxonomy.bind(null, "category", c.id)} confirm="Delete this category?" variant="ghost">
                      Delete
                    </ConfirmAction>
                  </div>
                </AdminForm>
              </details>
            ))}
            <details className="rounded-xl border border-dashed border-line-strong p-3">
              <summary className="cursor-pointer text-sm font-semibold text-brand-700">+ Add category</summary>
              <AdminForm action={saveBlogTaxonomy.bind(null, "category", null)} className="mt-3 space-y-3" resetOnSuccess>
                <NameSlugFields />
                <TextAreaField name="description" label="Description" rows={2} />
                <SubmitButton size="sm">Add</SubmitButton>
              </AdminForm>
            </details>
          </div>
        </Panel>
        <Panel title="Tags">
          <ul className="mb-4 flex flex-wrap gap-2">
            {(tags ?? []).map((t) => (
              <li key={t.id} className="flex items-center gap-1 rounded-full border border-line py-0.5 pr-1 pl-3 text-sm">
                {t.name}
                <ConfirmAction action={deleteBlogTaxonomy.bind(null, "tag", t.id)} confirm={`Delete tag ${t.name}?`} variant="ghost" size="icon-sm">
                  ×
                </ConfirmAction>
              </li>
            ))}
          </ul>
          <AdminForm action={saveBlogTaxonomy.bind(null, "tag", null)} className="space-y-3" resetOnSuccess>
            <NameSlugFields nameLabel="New tag" />
            <SubmitButton size="sm">Add tag</SubmitButton>
          </AdminForm>
        </Panel>
      </div>
    </div>
  );
}
