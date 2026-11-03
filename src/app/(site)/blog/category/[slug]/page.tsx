import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getBlogCategories } from "@/lib/data/blog";
import { buildMetadata } from "@/lib/seo/metadata";
import { first } from "@/lib/search-params";
import { BlogCategoryNav, BlogList, BlogListSkeleton } from "@/components/blog/blog-list";
import { Breadcrumbs } from "@/components/shared/navigation";
import { Skeleton } from "@/components/ui/misc";

export async function generateStaticParams() {
  const cats = await getBlogCategories();
  return cats.length ? cats.map((c) => ({ slug: c.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/category/[slug]">) {
  const { slug } = await params;
  const category = (await getBlogCategories()).find((c) => c.slug === slug);
  if (!category) return { title: "Category not found", robots: { index: false } };
  return buildMetadata({
    title: `${category.name} — articles & guides`,
    description: category.description || `${category.name} articles and buying guides.`,
    path: `/blog/category/${category.slug}`,
  });
}

export default function BlogCategoryPage(props: PageProps<"/blog/category/[slug]">) {
  return (
    <Suspense fallback={<div className="container-page py-10"><Skeleton className="mb-6 h-10 w-64" /><BlogListSkeleton /></div>}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params, searchParams }: PageProps<"/blog/category/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = (await getBlogCategories()).find((c) => c.slug === slug);
  if (!category) notFound();
  const page = Math.max(1, Number(first(sp.page) ?? "1") || 1);
  return (
    <>
      <div className="border-b border-line bg-white">
        <div className="container-page py-8 sm:py-10">
          <Breadcrumbs items={[{ name: "Blog", href: "/blog" }, { name: category.name, href: `/blog/category/${category.slug}` }]} />
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{category.name}</h1>
          {category.description && <p className="mt-3 max-w-3xl text-lg text-ink-500">{category.description}</p>}
        </div>
      </div>
      <div className="container-page py-8">
        <BlogCategoryNav active={category.slug} />
        <BlogList query={{ categorySlug: category.slug, page }} basePath={`/blog/category/${category.slug}`} />
      </div>
    </>
  );
}
