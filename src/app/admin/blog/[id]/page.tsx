import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { createSessionClient } from "@/lib/supabase/clients";
import { deletePost, restoreRevision, savePost, setPostReviewed } from "@/lib/actions/admin/blog";
import { formatDateTime } from "@/lib/utils";
import { AdminForm, ConfirmAction } from "@/components/admin/admin-form";
import { AdminHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";
import { PostFields } from "../post-fields";
import { getPostFormOptions } from "../data";

export default async function EditPostPage({ params }: PageProps<"/admin/blog/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSessionClient();
  const [{ data: post }, options, { data: tagLinks }, { data: productLinks }, { data: revisions }] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("id", id).maybeSingle(),
    getPostFormOptions(),
    supabase.from("blog_post_tags").select("tag_id").eq("post_id", id),
    supabase.from("blog_post_products").select("product_id").eq("post_id", id).order("sort_order"),
    supabase.from("blog_revisions").select("id, title, note, created_at").eq("post_id", id).order("created_at", { ascending: false }).limit(30),
  ]);
  if (!post) notFound();
  const live = (post.status === "published" || post.status === "scheduled") && post.published_at && new Date(post.published_at) <= new Date();

  return (
    <div className="space-y-6">
      <AdminHeader
        title={post.title}
        back={{ href: "/admin/blog", label: "Blog posts" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={post.status} /> Updated {formatDateTime(post.updated_at)} · {post.reading_time_minutes ?? 1} min read
          </span>
        }
        actions={
          <>
            {live && (
              <Link href={`/blog/${post.slug}`} target="_blank" className={buttonVariants({ variant: "outline", size: "sm" })}>
                View live <ExternalLink />
              </Link>
            )}
            <ConfirmAction action={deletePost.bind(null, id)} confirm="Delete this post permanently?" variant="danger">
              Delete
            </ConfirmAction>
          </>
        }
      />

      <Panel title="Editorial review" description="Fact-check claims, verify sources, remove anything time-sensitive that can't be verified, then sign off.">
        {post.reviewed_at ? (
          <div className="flex flex-wrap items-center gap-3">
            <Notice tone="success">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4" /> Reviewed {formatDateTime(post.reviewed_at)}
              </span>
            </Notice>
            <ConfirmAction action={setPostReviewed.bind(null, id, false)} variant="ghost">
              Remove sign-off
            </ConfirmAction>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {post.ai_assisted && <Notice tone="warning">AI-assisted draft — cannot be published until reviewed.</Notice>}
            <ConfirmAction action={setPostReviewed.bind(null, id, true)} confirm="Confirm you have fact-checked and edited this article?" variant="primary">
              Mark as editorially reviewed
            </ConfirmAction>
          </div>
        )}
        {post.editor_notes && <p className="mt-3 rounded-xl bg-saffron-50 p-3 text-sm whitespace-pre-wrap text-ink-700">{post.editor_notes}</p>}
      </Panel>

      <AdminForm action={savePost.bind(null, id)}>
        <PostFields
          post={post}
          {...options}
          selectedTagIds={(tagLinks ?? []).map((t) => t.tag_id)}
          selectedProductIds={(productLinks ?? []).map((p) => p.product_id)}
        />
      </AdminForm>

      <Panel title={`Revisions (${revisions?.length ?? 0})`} description="Every save creates a revision. Restoring copies the title, excerpt and content back.">
        <ul className="divide-y divide-line text-sm">
          {(revisions ?? []).map((r, i) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span>
                <strong className="text-ink-900">{formatDateTime(r.created_at)}</strong>
                {i === 0 && <span className="ml-2 text-xs text-emerald-700">current</span>}
                <span className="block text-xs text-ink-500">{r.note ?? r.title}</span>
              </span>
              {i > 0 && (
                <ConfirmAction action={restoreRevision.bind(null, r.id)} confirm="Restore this revision? Current content will be replaced (a new revision is kept)." variant="ghost">
                  Restore
                </ConfirmAction>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
