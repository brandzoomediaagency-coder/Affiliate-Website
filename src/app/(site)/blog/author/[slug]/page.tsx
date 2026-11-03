import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getActiveAuthorSlugs, getAuthorBySlug } from "@/lib/data/blog";
import { buildMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/env";
import { getInitials } from "@/lib/utils";
import { BlogList, BlogListSkeleton } from "@/components/blog/blog-list";
import { Breadcrumbs } from "@/components/shared/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge, Skeleton } from "@/components/ui/misc";

export async function generateStaticParams() {
  const slugs = await getActiveAuthorSlugs();
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/author/[slug]">) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return { title: "Author not found", robots: { index: false } };
  return buildMetadata({
    title: `${author.name}${author.jobTitle ? ` — ${author.jobTitle}` : ""}`,
    description: author.bio?.slice(0, 155) || `Articles by ${author.name}.`,
    path: `/blog/author/${author.slug}`,
  });
}

export default function AuthorPage(props: PageProps<"/blog/author/[slug]">) {
  return (
    <Suspense fallback={<div className="container-page py-10"><Skeleton className="mb-6 h-32 w-full rounded-2xl" /><BlogListSkeleton /></div>}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params }: PageProps<"/blog/author/[slug]">) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();
  const isOrg = author.slug === "editorial-team";
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": isOrg ? "Organization" : "Person",
          name: author.name,
          url: absoluteUrl(`/blog/author/${author.slug}`),
          ...(author.jobTitle && !isOrg ? { jobTitle: author.jobTitle } : {}),
          ...(author.bio ? { description: author.bio } : {}),
          ...(author.websiteUrl ? { sameAs: [author.websiteUrl, ...Object.values(author.socialLinks).filter(Boolean)] } : {}),
        }}
      />
      <div className="border-b border-line bg-white">
        <div className="container-page py-8 sm:py-10">
          <Breadcrumbs items={[{ name: "Blog", href: "/blog" }, { name: author.name, href: `/blog/author/${author.slug}` }]} />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-600 text-2xl font-extrabold text-white">
              {author.avatarUrl ? <Image src={author.avatarUrl} alt={author.name} fill sizes="80px" className="object-cover" /> : getInitials(author.name)}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">{author.name}</h1>
              {author.jobTitle && <p className="mt-1 text-ink-500">{author.jobTitle}</p>}
              {author.expertise.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {author.expertise.map((e) => (
                    <Badge key={e} variant="brand">
                      {e}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          {author.bio && <p className="mt-5 max-w-3xl leading-relaxed text-ink-600">{author.bio}</p>}
        </div>
      </div>
      <div className="container-page py-8">
        <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-ink-900">Articles by {author.name}</h2>
        <BlogList query={{ authorId: author.id }} basePath={`/blog/author/${author.slug}`} />
      </div>
    </>
  );
}
