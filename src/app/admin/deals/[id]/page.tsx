import { notFound } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/clients";
import { deleteOffer, saveOffer } from "@/lib/actions/admin/catalog";
import { getCategoryOptions, getMerchantOptions, getProductOptions } from "@/lib/data/admin";
import { AdminForm, ConfirmAction } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/ui";
import { OfferFields } from "../offer-fields";

export default async function EditOfferPage({ params }: PageProps<"/admin/deals/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSessionClient();
  const [{ data: offer }, merchants, products, categories] = await Promise.all([
    supabase.from("offers").select("*").eq("id", id).maybeSingle(),
    getMerchantOptions(),
    getProductOptions(),
    getCategoryOptions(),
  ]);
  if (!offer) notFound();
  return (
    <div className="max-w-4xl">
      <AdminHeader
        title={offer.title}
        back={{ href: "/admin/deals", label: "Deals" }}
        actions={
          <ConfirmAction action={deleteOffer.bind(null, id)} confirm="Delete this offer?" variant="danger">
            Delete
          </ConfirmAction>
        }
      />
      <AdminForm action={saveOffer.bind(null, id)}>
        <OfferFields offer={offer} merchants={merchants} products={products} categories={categories} />
      </AdminForm>
    </div>
  );
}
