/**
 * Loads the editorial blog drafts from content/blog/*.md into the database.
 * Every article is created as a DRAFT, marked AI-assisted, and therefore
 * cannot be published until an editor records an editorial review.
 *
 *   npm run seed:content            # insert missing articles
 *   npm run seed:content -- --force # overwrite existing drafts with the files (never touches published posts)
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { serviceClient } from "./_env";

type Meta = {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  productCategory: string | null;
  excerpt: string;
  answerSummary: string;
  seoTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: "informational" | "commercial" | "transactional" | "navigational";
  faqs: Array<{ question: string; answer: string }>;
  sources: Array<{ title: string; url: string; note?: string }>;
  editorNotes: string;
};

function parse(file: string): { meta: Meta; content: string } {
  const raw = readFileSync(file, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing JSON front matter`);
  return { meta: JSON.parse(match[1]!) as Meta, content: match[2]!.trim() };
}

async function main() {
  const force = process.argv.includes("--force");
  const db = serviceClient();
  const dir = path.join(process.cwd(), "content", "blog");
  const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();

  const [{ data: author }, { data: categories }, { data: tags }, { data: productCategories }] = await Promise.all([
    db.from("blog_authors").select("id").eq("slug", "editorial-team").maybeSingle(),
    db.from("blog_categories").select("id, slug"),
    db.from("blog_tags").select("id, slug"),
    db.from("categories").select("id, slug"),
  ]);
  const catId = new Map((categories ?? []).map((c) => [c.slug, c.id]));
  const tagId = new Map((tags ?? []).map((t) => [t.slug, t.id]));
  const pcatId = new Map((productCategories ?? []).map((c) => [c.slug, c.id]));

  let created = 0;
  let updated = 0;
  let skipped = 0;
  for (const file of files) {
    const { meta, content } = parse(path.join(dir, file));
    const { data: existing } = await db.from("blog_posts").select("id, status").eq("slug", meta.slug).maybeSingle();
    if (existing && (!force || existing.status === "published" || existing.status === "scheduled")) {
      skipped++;
      continue;
    }
    const record = {
      title: meta.title,
      slug: meta.slug,
      excerpt: meta.excerpt,
      answer_summary: meta.answerSummary,
      content,
      author_id: author?.id ?? null,
      category_id: catId.get(meta.category) ?? null,
      product_category_id: meta.productCategory ? pcatId.get(meta.productCategory) ?? null : null,
      seo_title: meta.seoTitle,
      meta_description: meta.metaDescription,
      primary_keyword: meta.primaryKeyword,
      secondary_keywords: meta.secondaryKeywords,
      search_intent: meta.searchIntent,
      faqs: meta.faqs,
      sources: meta.sources,
      status: "draft",
      ai_assisted: true,
      reviewed_at: null,
      reviewed_by: null,
      editor_notes: meta.editorNotes,
    };
    let id = existing?.id;
    if (existing) {
      const { error } = await db.from("blog_posts").update(record).eq("id", existing.id);
      if (error) throw new Error(`${file}: ${error.message}`);
      updated++;
    } else {
      const { data, error } = await db.from("blog_posts").insert(record).select("id").single();
      if (error) throw new Error(`${file}: ${error.message}`);
      id = data.id;
      created++;
    }
    await db.from("blog_post_tags").delete().eq("post_id", id!);
    const tagRows = meta.tags.map((t) => tagId.get(t)).filter((t): t is string => Boolean(t)).map((tag_id) => ({ post_id: id!, tag_id }));
    if (tagRows.length) await db.from("blog_post_tags").insert(tagRows);
    await db.from("blog_revisions").insert({ post_id: id!, title: meta.title, excerpt: meta.excerpt, content, note: "Imported editorial draft" });
    console.log(`${existing ? "↻" : "✚"} ${meta.slug}`);
  }
  console.log(`\nDone: ${created} created, ${updated} updated, ${skipped} skipped. All imported articles are drafts that require editorial review before publishing.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
