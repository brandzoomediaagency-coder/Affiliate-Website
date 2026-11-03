import { saveOffer } from "@/lib/actions/admin/catalog";
import { getCategoryOptions, getMerchantOptions, getProductOptions } from "@/lib/data/admin";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/ui";
import { OfferFields } from "../offer-fields";

export default async function NewOfferPage() {
  const [merchants, products, categories] = await Promise.all([getMerchantOptions(), getProductOptions(), getCategoryOptions()]);
  return (
    <div className="max-w-4xl">
      <AdminHeader title="Add offer" back={{ href: "/admin/deals", label: "Deals" }} />
      <AdminForm action={saveOffer.bind(null, null)}>
        <OfferFields merchants={merchants} products={products} categories={categories} />
      </AdminForm>
    </div>
  );
}
