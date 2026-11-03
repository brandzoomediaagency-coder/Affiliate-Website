"use server";

import { assertStaff } from "@/lib/auth";
import { authorSchema, blogPostSchema, simpleTaxonomySchema } from "@/lib/validation/schemas";
import { fromZodError, getBool, getDateTime, getJson, getLines, getOptionalString, getString, type ActionResult } from "@/lib/validation/form";
import { actionError, audit, dbError, invalidate } from "./common";

export async function savePost(postId: string | null, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { supabase, user } = session;
    const parsed = blogPostSchema.safeParse({
      title: getString(formData, "title"),
      slug: getString(formData, "slug"),
      excerpt: getOptionalString(formData, "excerpt"),
      answer_summary: getOptionalString(formData, "answer_summary"),
      content: String(formData.get("content") ?? ""),
      featured_image_url: getOptionalString(formData, "featured_image_url"),
      featured_image_alt: getOptionalString(formData, "featured_image_alt"),
      author_id: getOptionalString(formData, "author_id"),
      category_id: getOptionalString(formData, "category_id"),
      product_category_id: getOptionalString(formData, "product_category_id"),
      seo_title: getOptionalString(formData, "seo_title"),
      meta_description: getOptionalString(formData, "meta_description"),
      canonical_url: getOptionalString(formData, "canonical_url"),
      primary_keyword: getOptionalString(formData, "primary_keyword"),
      secondary_keywords: getLines(formData, "secondary_keywords"),
      search_intent: getOptionalString(formData, "search_intent"),
      faqs: getJson(formData, "faqs", []),
      sources: getJson(formData, "sources", []),
      status: getString(formData, "status") || "draft",
      published_at: getDateTime(formData, "published_at"),
      ai_assisted: getBool(formData, "ai_assisted"),
      editor_notes: getOptionalString(formData, "editor_notes"),
      is_featured: getBool(formData, "is_featured"),
      noindex: getBool(formData, "noindex"),
      tag_ids: formData.getAll("tag_ids").map(String),
      product_ids: formData.getAll("product_ids").map(String),
      revision_note: getOptionalString(formData, "revision_note"),
    });
    if (!parsed.success) return fromZodError(parsed.error);
    const { tag_ids, product_ids, revision_note, ...input } = parsed.data;

    let reviewedAt: string | null = null;
    let previousSlug: string | null = null;
    if (postId) {
      const { data: existing } = await supabase.from("blog_posts").select("reviewed_at, slug, published_at").eq("id", postId).single();
      reviewedAt = existing?.reviewed_at ?? null;
      previousSlug = existing?.slug ?? null;
      if (input.status === "published" && !input.published_at) input.published_at = existing?.published_at ?? null;
    }
    const goingLive = input.status === "published" || input.status === "scheduled";
    if (goingLive && input.ai_assisted && !reviewedAt) {
      return {
        ok: false,
        message: "This draft is marked as AI-assisted. An editor must review it and click “Mark as editorially reviewed” before it can be published or scheduled.",
        fieldErrors: { status: ["Editorial review required"] },
      };
    }
    if (goingLive) {
      const words = input.content.trim().split(/\s+/).filter(Boolean).length;
      if (words < 300) return { ok: false, message: `Articles need at least 300 words before publishing (currently ${words}).` };
      if (!input.meta_description && !input.excerpt) return { ok: false, message: "Add an excerpt or meta description before publishing." };
    }
    if (input.status === "published" && !input.published_at) input.published_at = new Date().toISOString();
    if (input.status === "published" && input.published_at && new Date(input.published_at) > new Date()) input.status = "scheduled";

    let id = postId;
    if (postId) {
      const { error } = await supabase.from("blog_posts").update({ ...input, updated_by: user.id }).eq("id", postId);
      const failure = dbError(error, "post");
      if (failure) return failure;
    } else {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert({ ...input, created_by: user.id, updated_by: user.id })
        .select("id")
        .single();
      const failure = dbError(error, "post");
      if (failure) return failure;
      id = data!.id;
    }

    await supabase.from("blog_post_tags").delete().eq("post_id", id!);
    if (tag_ids.length) await supabase.from("blog_post_tags").insert(tag_ids.map((tag_id) => ({ post_id: id!, tag_id })));
    await supabase.from("blog_post_products").delete().eq("post_id", id!);
    if (product_ids.length) {
      await supabase.from("blog_post_products").insert(product_ids.map((product_id, i) => ({ post_id: id!, product_id, sort_order: i })));
    }

    // Revision history: snapshot of every saved version.
    await supabase.from("blog_revisions").insert({
      post_id: id!,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      snapshot: {
        status: input.status,
        seo_title: input.seo_title,
        meta_description: input.meta_description,
        answer_summary: input.answer_summary,
        faqs: input.faqs,
        sources: input.sources,
      },
      note: revision_note ?? (postId ? null : "Initial version"),
      created_by: user.id,
    });

    await audit(session, postId ? "post.update" : "post.create", "blog_post", id, `${input.title} (${input.status})`);
    invalidate("blog", `post:${input.slug}`, ...(previousSlug && previousSlug !== input.slug ? [`post:${previousSlug}`] : []));
    const statusMsg = input.status === "scheduled" ? "Scheduled — it will go live automatically at the publish time." : "Post saved.";
    return { ok: true, message: statusMsg, redirectTo: postId ? undefined : `/admin/blog/${id}` };
  } catch (e) {
    return actionError(e);
  }
}

export async function setPostReviewed(postId: string, reviewed: boolean): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { data: post } = await session.supabase.from("blog_posts").select("status, ai_assisted").eq("id", postId).single();
    if (!reviewed && post && post.ai_assisted && (post.status === "published" || post.status === "scheduled")) {
      return { ok: false, message: "Unpublish this AI-assisted post (set it to draft) before removing its review sign-off." };
    }
    const { error } = await session.supabase
      .from("blog_posts")
      .update(reviewed ? { reviewed_at: new Date().toISOString(), reviewed_by: session.user.id } : { reviewed_at: null, reviewed_by: null })
      .eq("id", postId);
    const failure = dbError(error, "post");
    if (failure) return failure;
    await audit(session, reviewed ? "post.review" : "post.unreview", "blog_post", postId, reviewed ? "Marked as editorially reviewed" : "Review sign-off removed");
    return { ok: true, message: reviewed ? "Marked as editorially reviewed." : "Review sign-off removed." };
  } catch (e) {
    return actionError(e);
  }
}

export async function restoreRevision(revisionId: string): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { data: rev } = await session.supabase.from("blog_revisions").select("*").eq("id", revisionId).single();
    if (!rev) return { ok: false, message: "Revision not found." };
    const { data: post, error } = await session.supabase
      .from("blog_posts")
      .update({ title: rev.title, excerpt: rev.excerpt, content: rev.content, updated_by: session.user.id })
      .eq("id", rev.post_id)
      .select("slug")
      .single();
    const failure = dbError(error, "post");
    if (failure) return failure;
    await session.supabase.from("blog_revisions").insert({
      post_id: rev.post_id,
      title: rev.title,
      excerpt: rev.excerpt,
      content: rev.content,
      snapshot: rev.snapshot,
      note: `Restored revision from ${new Date(rev.created_at).toISOString().slice(0, 16).replace("T", " ")} UTC`,
      created_by: session.user.id,
    });
    await audit(session, "post.restore", "blog_post", rev.post_id, `Restored revision ${revisionId}`);
    invalidate("blog", ...(post ? [`post:${post.slug}`] : []));
    return { ok: true, message: "Revision restored." };
  } catch (e) {
    return actionError(e);
  }
}

export async function deletePost(postId: string): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { data: post } = await session.supabase.from("blog_posts").select("slug, title").eq("id", postId).single();
    const { error } = await session.supabase.from("blog_posts").delete().eq("id", postId);
    const failure = dbError(error, "post");
    if (failure) return failure;
    await audit(session, "post.delete", "blog_post", postId, post?.title);
    invalidate("blog", ...(post ? [`post:${post.slug}`] : []));
    return { ok: true, message: "Post deleted.", redirectTo: "/admin/blog" };
  } catch (e) {
    return actionError(e);
  }
}

export async function saveAuthor(authorId: string | null, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const parsed = authorSchema.safeParse({
      name: getString(formData, "name"),
      slug: getString(formData, "slug"),
      job_title: getOptionalString(formData, "job_title"),
      bio: getOptionalString(formData, "bio"),
      avatar_url: getOptionalString(formData, "avatar_url"),
      expertise: getString(formData, "expertise")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      website_url: getOptionalString(formData, "website_url"),
      is_active: getBool(formData, "is_active"),
    });
    if (!parsed.success) return fromZodError(parsed.error);
    const { error } = authorId
      ? await session.supabase.from("blog_authors").update(parsed.data).eq("id", authorId)
      : await session.supabase.from("blog_authors").insert(parsed.data);
    const failure = dbError(error, "author");
    if (failure) return failure;
    await audit(session, authorId ? "author.update" : "author.create", "blog_author", authorId, parsed.data.name);
    invalidate("blog");
    return { ok: true, message: "Author saved." };
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteAuthor(authorId: string): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { error } = await session.supabase.from("blog_authors").delete().eq("id", authorId);
    const failure = dbError(error, "author");
    if (failure) return failure;
    invalidate("blog");
    return { ok: true, message: "Author deleted." };
  } catch (e) {
    return actionError(e);
  }
}

export async function saveBlogTaxonomy(
  kind: "category" | "tag",
  id: string | null,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const parsed = simpleTaxonomySchema.safeParse({
      name: getString(formData, "name"),
      slug: getString(formData, "slug"),
      description: getOptionalString(formData, "description"),
    });
    if (!parsed.success) return fromZodError(parsed.error);
    const { error } =
      kind === "category"
        ? id
          ? await session.supabase.from("blog_categories").update(parsed.data).eq("id", id)
          : await session.supabase.from("blog_categories").insert(parsed.data)
        : id
          ? await session.supabase.from("blog_tags").update({ name: parsed.data.name, slug: parsed.data.slug }).eq("id", id)
          : await session.supabase.from("blog_tags").insert({ name: parsed.data.name, slug: parsed.data.slug });
    const failure = dbError(error, kind);
    if (failure) return failure;
    invalidate("blog");
    return { ok: true, message: `${kind === "category" ? "Category" : "Tag"} saved.` };
  } catch (e) {
    return actionError(e);
  }
}

export async function deleteBlogTaxonomy(kind: "category" | "tag", id: string): Promise<ActionResult> {
  try {
    const session = await assertStaff();
    const { error } =
      kind === "category"
        ? await session.supabase.from("blog_categories").delete().eq("id", id)
        : await session.supabase.from("blog_tags").delete().eq("id", id);
    const failure = dbError(error, kind);
    if (failure) return failure;
    invalidate("blog");
    return { ok: true, message: "Deleted." };
  } catch (e) {
    return actionError(e);
  }
}
