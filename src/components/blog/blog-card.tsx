import Link from "next/link";
import Image from "next/image";
import { BookOpen, Clock } from "lucide-react";
import type { BlogPostCard } from "@/lib/data/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/misc";

export function BlogCard({ post, priority = false }: { post: BlogPostCard; priority?: boolean }) {
  const updated = post.contentUpdatedAt && post.publishedAt && post.contentUpdatedAt > post.publishedAt;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-gradient-to-br from-brand-100 via-brand-50 to-saffron-50" tabIndex={-1} aria-hidden="true">
        {post.featuredImageUrl ? (
          <Image
            src={post.featuredImageUrl}
            alt={post.featuredImageAlt || ""}
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="grid size-full place-items-center">
            <BookOpen className="size-10 text-brand-300" />
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        {post.categoryName && (
          <Badge variant="brand" className="w-fit">
            {post.categoryName}
          </Badge>
        )}
        <h3 className="line-clamp-2 text-lg leading-snug font-bold text-ink-900">
          <Link href={`/blog/${post.slug}`} className="hover:text-brand-700">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="line-clamp-3 text-sm leading-relaxed text-ink-500">{post.excerpt}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-ink-500">
          {post.authorName && <span className="font-semibold text-ink-700">{post.authorName}</span>}
          {post.publishedAt && (
            <time dateTime={updated ? post.contentUpdatedAt! : post.publishedAt}>
              {updated ? `Updated ${formatDate(post.contentUpdatedAt)}` : formatDate(post.publishedAt)}
            </time>
          )}
          {post.readingTimeMinutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" aria-hidden="true" /> {post.readingTimeMinutes} min read
            </span>
          )}
        </div>
        <Link href={`/blog/${post.slug}`} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
          Read More <span aria-hidden="true">→</span>
          <span className="sr-only"> about {post.title}</span>
        </Link>
      </div>
    </article>
  );
}
