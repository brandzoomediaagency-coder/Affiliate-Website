import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createSessionClient } from "@/lib/supabase/clients";
import { deleteCategory, saveCategory } from "@/lib/actions/admin/catalog";
import { getCategoryOptions } from "@/lib/data/admin";
import { AdminForm, ConfirmAction } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { CategoryFields } from "../category-fields";

export default async function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSessionClient();
  const [{ data: category }, parents] = await Promise.all([supabase.from("categories").select("*").eq("id", id).maybeSingle(), getCategoryOptions()]);
  if (!category) notFound();
  return (
    <div className="max-w-4xl">
      <AdminHeader
        title={category.name}
        back={{ href: "/admin/categories", label: "Categories" }}
        actions={
          <>
            <Link href={`/categories/${category.slug}`} target="_blank" className={buttonVariants({ variant: "outline", size: "sm" })}>
              View <ExternalLink />
            </Link>
            <ConfirmAction action={deleteCategory.bind(null, id)} confirm={`Delete ${category.name}?`} variant="danger">
              Delete
            </ConfirmAction>
          </>
        }
      />
      <AdminForm action={saveCategory.bind(null, id)}>
        <CategoryFields category={category} parents={parents} />
      </AdminForm>
    </div>
  );
}
