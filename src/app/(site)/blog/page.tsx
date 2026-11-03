import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo/metadata";
import { first } from "@/lib/search-params";
import { BlogCategoryNav, BlogList, BlogListSkeleton } from "@/components/blog/blog-list";
import { Breadcrumbs } from "@/components/shared/navigation";
import { PageHeader } from "@/components/ui/misc";

export async function generateMetadata({ searchParams }: PageProps<"/blog">) {
  const page = Number(first((await searchParams).page) ?? "1");
  return buildMetadata({
    title: page > 1 ? `Buying guides & shopping tips — page ${page}` : "Buying guides, comparisons & smart shopping tips",
    description:
      "Practical buying guides, product comparisons and online shopping tips for Indian shoppers — written to help you decide before you buy.",
    path: page > 1 ? `/blog?page=${page}` : "/blog",
  });
}

export default function BlogIndexPage({ searchParams }: PageProps<"/blog">) {
  return (
    <>
      <PageHeader
        title="Buying guides & shopping tips"
        description="Plain-English guides that explain what matters before you buy — specifications, warranties, returns and how to spot a genuine deal."
      >
        <Breadcrumbs items={[{ name: "Blog", href: "/blog" }]} />
      </PageHeader>
      <div className="container-page py-8">
        <BlogCategoryNav />
        <Suspense fallback={<BlogListSkeleton />}>
          <BlogPage searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function BlogPage({ searchParams }: { searchParams: PageProps<"/blog">["searchParams"] }) {
  const page = Math.max(1, Math.min(500, Number(first((await searchParams).page) ?? "1") || 1));
  return <BlogList query={{ page }} basePath="/blog" />;
}
