import "server-only";
import { createSessionClient } from "@/lib/supabase/clients";

/** Admin lookups (session client; RLS restricts to staff). */
export async function getCategoryOptions() {
  const supabase = await createSessionClient();
  const { data } = await supabase.from("categories").select("id, name, parent_id, sort_order").order("sort_order").order("name");
  const rows = data ?? [];
  const out: Array<{ id: string; name: string; depth: number }> = [];
  const walk = (parent: string | null, depth: number) => {
    for (const c of rows.filter((r) => r.parent_id === parent)) {
      out.push({ id: c.id, name: c.name, depth });
      if (depth < 8) walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

export async function getBrandOptions() {
  const supabase = await createSessionClient();
  const { data } = await supabase.from("brands").select("id, name").order("name");
  return data ?? [];
}

export async function getMerchantOptions() {
  const supabase = await createSessionClient();
  const { data } = await supabase.from("merchants").select("id, name, is_active").order("sort_order").order("name");
  return data ?? [];
}

export async function getProductOptions() {
  const supabase = await createSessionClient();
  const { data } = await supabase.from("products").select("id, name, status").order("name").limit(2000);
  return data ?? [];
}
