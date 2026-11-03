import "server-only";
import { createSessionClient } from "@/lib/supabase/clients";
import { getCategoryOptions, getProductOptions } from "@/lib/data/admin";

export async function getPostFormOptions() {
  const supabase = await createSessionClient();
  const [authors, blogCategories, tags, productCategories, products] = await Promise.all([
    supabase.from("blog_authors").select("id, name").order("name"),
    supabase.from("blog_categories").select("id, name").order("sort_order"),
    supabase.from("blog_tags").select("id, name").order("name"),
    getCategoryOptions(),
    getProductOptions(),
  ]);
  return {
    authors: authors.data ?? [],
    blogCategories: blogCategories.data ?? [],
    tags: tags.data ?? [],
    productCategories,
    products,
  };
}
