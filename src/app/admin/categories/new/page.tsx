import { saveCategory } from "@/lib/actions/admin/catalog";
import { getCategoryOptions } from "@/lib/data/admin";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/ui";
import { CategoryFields } from "../category-fields";

export default async function NewCategoryPage() {
  const parents = await getCategoryOptions();
  return (
    <div className="max-w-4xl">
      <AdminHeader title="Add category" back={{ href: "/admin/categories", label: "Categories" }} />
      <AdminForm action={saveCategory.bind(null, null)}>
        <CategoryFields parents={parents} />
      </AdminForm>
    </div>
  );
}
