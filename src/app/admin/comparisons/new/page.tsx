import { saveComparison } from "@/lib/actions/admin/catalog";
import { getCategoryOptions, getProductOptions } from "@/lib/data/admin";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/ui";
import { ComparisonFields } from "../comparison-fields";

export default async function NewComparisonPage() {
  const [products, categories] = await Promise.all([getProductOptions(), getCategoryOptions()]);
  return (
    <div className="max-w-4xl">
      <AdminHeader title="New comparison" back={{ href: "/admin/comparisons", label: "Comparisons" }} />
      <AdminForm action={saveComparison.bind(null, null)}>
        <ComparisonFields products={products} categories={categories} />
      </AdminForm>
    </div>
  );
}
