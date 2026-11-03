import { notFound } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/clients";
import { deleteListing, verifyListingUrl } from "@/lib/actions/admin/listings";
import { getMerchantFormOptions } from "@/lib/data/admin-merchants";
import { formatDateTime } from "@/lib/utils";
import { AdminHeader, StatusBadge } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/admin-form";
import { ListingForm } from "@/components/admin/listing-form";
import { Notice } from "@/components/ui/misc";

export default async function EditListingPage({ params }: PageProps<"/admin/listings/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSessionClient();
  const [{ data: listing }, merchants] = await Promise.all([
    supabase.from("product_listings").select("*, product:products(id, name)").eq("id", id).maybeSingle(),
    getMerchantFormOptions(),
  ]);
  if (!listing) notFound();
  const { product, ...row } = listing;
  return (
    <div className="max-w-4xl">
      <AdminHeader
        title={`Edit listing — ${product?.name ?? "Product"}`}
        back={product ? { href: `/admin/products/${product.id}`, label: product.name } : { href: "/admin/listings", label: "Listings" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            Link status: <StatusBadge status={listing.url_status} />
            {listing.url_checked_at && <span>checked {formatDateTime(listing.url_checked_at)}</span>}
            {listing.url_check_message && <span className="text-ink-400">({listing.url_check_message})</span>}
          </span>
        }
        actions={
          <>
            <ConfirmAction action={verifyListingUrl.bind(null, id)}>Verify link</ConfirmAction>
            <ConfirmAction action={deleteListing.bind(null, id)} confirm="Delete this listing?" variant="danger">
              Delete
            </ConfirmAction>
          </>
        }
      />
      {listing.sync_error && <Notice tone="error" className="mb-4">Last API sync: {listing.sync_error}</Notice>}
      <ListingForm listing={row} productId={listing.product_id} merchants={merchants} />
    </div>
  );
}
