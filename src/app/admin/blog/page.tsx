import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/clients";
import { first } from "@/lib/search-params";
import { formatDateTime } from "@/lib/utils";
import { AdminHeader, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

const STATUSES = ["draft", "in_review", "scheduled", "published", "archived"];

export default async function AdminBlogPage({ searchParams }: PageProps<"/admin/blog">) {
  const status = first((await searchParams).status) ?? "";
  const supabase = await createSessionClient();
  let query = supabase
    .from("blog_posts")
    .select("id, title, slug, status, published_at, updated_at, ai_assisted, reviewed_at, reading_time_minutes, view_count, author:blog_authors(name)")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (STATUSES.includes(status)) query = query.eq("status", status);
  const { data } = await query;
  return (
    <div>
      <AdminHeader
        title="Blog posts"
        description="Write, review, schedule and publish articles. AI-assisted drafts require editorial review before publishing."
        actions={
          <Link href="/admin/blog/new" className={buttonVariants({ size: "sm" })}>
            New article
          </Link>
        }
      />
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Filter by status">
        {["", ...STATUSES].map((s) => (
          <Link
            key={s || "all"}
            href={s ? `/admin/blog?status=${s}` : "/admin/blog"}
            className={cn("rounded-full border px-3 py-1 text-sm font-semibold", status === s ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-ink-700")}
          >
            {s ? s.replace("_", " ") : "All"}
          </Link>
        ))}
      </nav>
      <Table>
        <thead>
          <tr>
            <Th>Title</Th>
            <Th>Status</Th>
            <Th>Review</Th>
            <Th>Published</Th>
            <Th>Views</Th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((p) => (
            <tr key={p.id}>
              <Td>
                <Link href={`/admin/blog/${p.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                  {p.title}
                </Link>
                <p className="text-xs text-ink-400">
                  {p.author?.name ?? "No author"} · {p.reading_time_minutes ?? 1} min read
                </p>
              </Td>
              <Td>
                <StatusBadge status={p.status} />
              </Td>
              <Td>
                {p.ai_assisted ? (
                  p.reviewed_at ? (
                    <Badge variant="success">Reviewed</Badge>
                  ) : (
                    <Badge variant="saffron">Needs review</Badge>
                  )
                ) : (
                  <span className="text-xs text-ink-400">—</span>
                )}
              </Td>
              <Td className="text-xs">{p.published_at ? formatDateTime(p.published_at) : "—"}</Td>
              <Td>{p.view_count}</Td>
            </tr>
          ))}
          {(data ?? []).length === 0 && (
            <tr>
              <Td className="py-10 text-center text-ink-400">No posts. Run “npm run seed:content” to load the editorial drafts.</Td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
