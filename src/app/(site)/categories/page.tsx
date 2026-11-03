import Link from "next/link";
import { buildCategoryTree, getAllCategories } from "@/lib/data/categories";
import { buildMetadata } from "@/lib/seo/metadata";
import { CategoryIcon } from "@/components/shared/icons";
import { Breadcrumbs } from "@/components/shared/navigation";
import { EmptyState, PageHeader } from "@/components/ui/misc";

export async function generateMetadata() {
  return buildMetadata({
    title: "Shop by category — electronics, fashion, home & more",
    description:
      "Browse every product category, from electronics and mobiles to fashion, home & kitchen and beauty, and compare listings across Indian online stores.",
    path: "/categories",
  });
}

export default async function CategoriesPage() {
  const tree = buildCategoryTree(await getAllCategories());
  return (
    <>
      <PageHeader title="All categories" description="Choose a category to explore products, buying guides and comparisons.">
        <Breadcrumbs items={[{ name: "Categories", href: "/categories" }]} />
      </PageHeader>
      <div className="container-page py-10">
        {tree.length === 0 ? (
          <EmptyState title="No categories yet" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tree.map((c) => (
              <section key={c.id} className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card">
                <Link href={`/categories/${c.slug}`} className="group flex items-start gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <CategoryIcon name={c.icon} className="size-6" />
                  </span>
                  <span>
                    <h2 className="text-lg font-bold text-ink-900 group-hover:text-brand-700">{c.name}</h2>
                    {c.shortDescription && <p className="mt-1 text-sm leading-relaxed text-ink-500">{c.shortDescription}</p>}
                  </span>
                </Link>
                {c.children.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                    {c.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/categories/${child.slug}`}
                          className="inline-block rounded-full border border-line bg-canvas px-3 py-1 text-sm font-medium text-ink-700 hover:border-brand-200 hover:text-brand-700"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
