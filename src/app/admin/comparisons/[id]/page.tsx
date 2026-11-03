import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createSessionClient } from "@/lib/supabase/clients";
import { deleteComparison, saveComparison } from "@/lib/actions/admin/catalog";
import { getCategoryOptions, getProductOptions } from "@/lib/data/admin";
import { AdminForm, ConfirmAction } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { ComparisonFields } from "../comparison-fields";

export default async function EditComparisonPage({ params }: PageProps<"/admin/comparisons/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSessionClient();
  const [{ data: comparison }, { data: items }, products, categories] = await Promise.all([
    supabase.from("comparisons").select("*").eq("id", id).maybeSingle(),
    supabase.from("comparison_items").select("product_id, highlight, note, sort_order").eq("comparison_id", id).order("sort_order"),
    getProductOptions(),
    getCategoryOptions(),
  ]);
  if (!comparison) notFound();
  return (
    <div className="max-w-4xl">
      <AdminHeader
        title={comparison.title}
        back={{ href: "/admin/comparisons", label: "Comparisons" }}
        actions={
          <>
            {comparison.status === "published" && (
              <Link href={`/compare/${comparison.slug}`} target="_blank" className={buttonVariants({ variant: "outline", size: "sm" })}>
                View <ExternalLink />
              </Link>
            )}
            <ConfirmAction action={deleteComparison.bind(null, id)} confirm="Delete this comparison?" variant="danger">
              Delete
            </ConfirmAction>
          </>
        }
      />
      <AdminForm action={saveComparison.bind(null, id)}>
        <ComparisonFields comparison={comparison} items={items ?? []} products={products} categories={categories} />
      </AdminForm>
    </div>
  );
}
