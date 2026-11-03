import { saveProduct } from "@/lib/actions/admin/products";
import { getBrandOptions, getCategoryOptions } from "@/lib/data/admin";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/ui";
import { ProductFormFields } from "@/components/admin/product-form-fields";
import { Notice } from "@/components/ui/misc";

export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([getBrandOptions(), getCategoryOptions()]);
  return (
    <div className="max-w-5xl">
      <AdminHeader title="Add product" back={{ href: "/admin/products", label: "Products" }} />
      <Notice tone="info" className="mb-6">
        Products start as drafts. After saving, add images, specifications and merchant listings — then publish once the content checklist is complete.
        Never invent prices, ratings or specifications.
      </Notice>
      <AdminForm action={saveProduct.bind(null, null)}>
        <ProductFormFields brands={brands} categories={categories} />
      </AdminForm>
    </div>
  );
}
