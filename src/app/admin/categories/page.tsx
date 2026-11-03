import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/clients";
import { deleteBrand, saveBrand, saveHomeCategoryOrder } from "@/lib/actions/admin/catalog";
import { AdminForm, ConfirmAction, SubmitButton } from "@/components/admin/admin-form";
import { NameSlugFields } from "@/components/admin/fields";
import { AdminHeader, Panel, Table, Td, Th, TextField } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";

export default async function AdminCategoriesPage() {
  const supabase = await createSessionClient();
  const [{ data: categories }, { data: brands }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, parent_id, is_active, show_on_home, home_sort_order, sort_order, products(count)").order("sort_order").order("name"),
    supabase.from("brands").select("id, name, slug, website_url, products(count)").order("name"),
  ]);
  const rows = categories ?? [];
  const ordered: Array<(typeof rows)[number] & { depth: number }> = [];
  const walk = (parent: string | null, depth: number) => {
    for (const c of rows.filter((r) => r.parent_id === parent)) {
      ordered.push({ ...c, depth });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  const homeCats = rows.filter((c) => c.show_on_home).sort((a, b) => a.home_sort_order - b.home_sort_order);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Categories & brands"
        description="Unlimited categories and subcategories. Each category gets its own SEO landing page."
        actions={
          <Link href="/admin/categories/new" className={buttonVariants({ size: "sm" })}>
            Add category
          </Link>
        }
      />
      <Table>
        <thead>
          <tr>
            <Th>Category</Th>
            <Th>Slug</Th>
            <Th>Products</Th>
            <Th>Flags</Th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((c) => (
            <tr key={c.id}>
              <Td>
                <span style={{ paddingLeft: `${c.depth * 1.25}rem` }} className="inline-block">
                  {c.depth > 0 && <span className="mr-1 text-ink-300">└</span>}
                  <Link href={`/admin/categories/${c.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                    {c.name}
                  </Link>
                </span>
              </Td>
              <Td className="font-mono text-xs">{c.slug}</Td>
              <Td>{c.products?.[0]?.count ?? 0}</Td>
              <Td>
                <div className="flex gap-1">
                  {!c.is_active && <Badge variant="outline">Inactive</Badge>}
                  {c.show_on_home && <Badge variant="brand">Homepage</Badge>}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Panel title="Homepage category order" description="Lower numbers appear first. Untick to remove from the homepage.">
        <AdminForm action={saveHomeCategoryOrder}>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {homeCats.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-line p-2.5">
                <input type="hidden" name="category_id" value={c.id} />
                <input type="checkbox" name={`home_${c.id}`} defaultChecked aria-label={`Show ${c.name} on homepage`} />
                <span className="flex-1 truncate text-sm font-medium">{c.name}</span>
                <input
                  type="number"
                  name={`order_${c.id}`}
                  defaultValue={c.home_sort_order}
                  className="h-9 w-20 rounded-lg border border-line-strong px-2 text-sm"
                  aria-label={`Homepage order for ${c.name}`}
                />
              </div>
            ))}
          </div>
          <SubmitButton size="sm">Save order</SubmitButton>
        </AdminForm>
      </Panel>

      <Panel title={`Brands (${brands?.length ?? 0})`}>
        <div className="space-y-3">
          {(brands ?? []).map((b) => (
            <details key={b.id} className="rounded-xl border border-line p-3">
              <summary className="cursor-pointer text-sm font-semibold text-ink-900">
                {b.name} <span className="font-normal text-ink-400">· {b.products?.[0]?.count ?? 0} products</span>
              </summary>
              <AdminForm action={saveBrand.bind(null, b.id)} className="mt-3 space-y-3">
                <NameSlugFields defaultName={b.name} defaultSlug={b.slug} />
                <TextField name="website_url" label="Official website" defaultValue={b.website_url} type="url" />
                <div className="flex gap-2">
                  <SubmitButton size="sm">Save brand</SubmitButton>
                  <ConfirmAction action={deleteBrand.bind(null, b.id)} confirm={`Delete brand ${b.name}?`} variant="ghost">
                    Delete
                  </ConfirmAction>
                </div>
              </AdminForm>
            </details>
          ))}
          <details className="rounded-xl border border-dashed border-line-strong p-3">
            <summary className="cursor-pointer text-sm font-semibold text-brand-700">+ Add brand</summary>
            <AdminForm action={saveBrand.bind(null, null)} className="mt-3 space-y-3" resetOnSuccess>
              <NameSlugFields />
              <TextField name="website_url" label="Official website" type="url" />
              <SubmitButton size="sm">Add brand</SubmitButton>
            </AdminForm>
          </details>
        </div>
      </Panel>
    </div>
  );
}
