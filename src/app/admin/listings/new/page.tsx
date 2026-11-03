import { createSessionClient } from "@/lib/supabase/clients";
import { getProductOptions } from "@/lib/data/admin";
import { getMerchantFormOptions } from "@/lib/data/admin-merchants";
import { first } from "@/lib/search-params";
import { AdminHeader } from "@/components/admin/ui";
import { ListingForm } from "@/components/admin/listing-form";
import { Notice } from "@/components/ui/misc";

export default async function NewListingPage({ searchParams }: PageProps<"/admin/listings/new">) {
  const productId = first((await searchParams).product);
  const supabase = await createSessionClient();
  const [merchants, products, productRes] = await Promise.all([
    getMerchantFormOptions(),
    getProductOptions(),
    productId && /^[0-9a-f-]{36}$/i.test(productId) ? supabase.from("products").select("id, name").eq("id", productId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const product = productRes.data;
  return (
    <div className="max-w-4xl">
      <AdminHeader
        title={product ? `Add listing — ${product.name}` : "Add listing"}
        back={product ? { href: `/admin/products/${product.id}`, label: product.name } : { href: "/admin/listings", label: "Listings" }}
      />
      {merchants.length === 0 ? (
        <Notice tone="warning">Add a merchant first (Merchants & programmes).</Notice>
      ) : (
        <ListingForm productId={product?.id} products={product ? undefined : products} merchants={merchants} />
      )}
    </div>
  );
}
