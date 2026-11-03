import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, CircleDashed, ExternalLink } from "lucide-react";
import { createSessionClient } from "@/lib/supabase/clients";
import {
  addProductImage,
  deleteProduct,
  deleteProductImage,
  saveProduct,
  saveProductRelations,
  saveProductSpecs,
  updateProductImage,
} from "@/lib/actions/admin/products";
import { deleteListing, verifyListingUrl } from "@/lib/actions/admin/listings";
import { getBrandOptions, getCategoryOptions, getProductOptions } from "@/lib/data/admin";
import { assessProductQuality } from "@/lib/product-quality";
import { formatINR } from "@/lib/pricing";
import { formatDateTime } from "@/lib/utils";
import { AdminForm, ConfirmAction, SubmitButton } from "@/components/admin/admin-form";
import { RowsEditor } from "@/components/admin/fields";
import { AdminHeader, Panel, SelectField, StatusBadge, Table, Td, Th, TextField } from "@/components/admin/ui";
import { ProductFormFields } from "@/components/admin/product-form-fields";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSessionClient();
  const [{ data: product }, brands, categories, products, imagesRes, specsRes, listingsRes, relationsRes] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    getBrandOptions(),
    getCategoryOptions(),
    getProductOptions(),
    supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
    supabase.from("product_specs").select("*").eq("product_id", id).order("sort_order"),
    supabase
      .from("product_listings")
      .select("*, merchant:merchants(name, allow_manual_prices, price_max_age_hours)")
      .eq("product_id", id)
      .order("sort_order"),
    supabase.from("product_relations").select("related_product_id").eq("product_id", id).eq("relation_type", "alternative"),
  ]);
  if (!product) notFound();
  const images = imagesRes.data ?? [];
  const specs = specsRes.data ?? [];
  const listings = listingsRes.data ?? [];
  const alternativeIds = new Set((relationsRes.data ?? []).map((r) => r.related_product_id));
  const quality = assessProductQuality({
    ...product,
    categoryId: product.category_id,
    imageCount: images.length,
    activeListingCount: listings.filter((l) => l.is_active).length,
    specCount: specs.length,
  });

  return (
    <div className="max-w-5xl space-y-6">
      <AdminHeader
        title={product.name}
        back={{ href: "/admin/products", label: "Products" }}
        description={
          <span className="flex items-center gap-2">
            <StatusBadge status={product.status} /> Last updated {formatDateTime(product.updated_at)}
          </span>
        }
        actions={
          <>
            {product.status === "published" && (
              <Link href={`/products/${product.slug}`} target="_blank" className={buttonVariants({ variant: "outline", size: "sm" })}>
                View live <ExternalLink />
              </Link>
            )}
            <ConfirmAction action={deleteProduct.bind(null, id)} confirm={`Delete “${product.name}” permanently? This also removes its listings and images.`} variant="danger">
              Delete
            </ConfirmAction>
          </>
        }
      />

      <Panel title="Publishing checklist" description="Pages must offer real value before they can be published (no thin or empty pages).">
        <ul className="grid gap-2 sm:grid-cols-2">
          {quality.checklist.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-sm">
              {c.done ? <CircleCheck className="size-4 text-emerald-600" /> : <CircleDashed className="size-4 text-ink-300" />}
              <span className={c.done ? "text-ink-700" : "text-ink-500"}>{c.label}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title={`Merchant listings (${listings.length})`}
        description="Each listing is one store's affiliate link for this product, with its own Buy Now button."
        actions={
          <Link href={`/admin/listings/new?product=${id}`} className={buttonVariants({ size: "sm" })}>
            Add listing
          </Link>
        }
      >
        {listings.length === 0 ? (
          <p className="text-sm text-ink-500">No listings yet. Add the Amazon, Flipkart, Meesho or other affiliate URL for this product.</p>
        ) : (
          <Table className="shadow-none">
            <thead>
              <tr>
                <Th>Merchant</Th>
                <Th>Price</Th>
                <Th>Last verified</Th>
                <Th>Link</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id}>
                  <Td>
                    <Link href={`/admin/listings/${l.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                      {l.merchant?.name}
                    </Link>
                    {l.variant_label && <p className="text-xs text-ink-500">{l.variant_label}</p>}
                  </Td>
                  <Td>
                    {l.current_price !== null ? formatINR(l.current_price) : <span className="text-ink-400">Check price</span>}
                    {l.current_price !== null && l.price_source === "manual" && l.merchant && !l.merchant.allow_manual_prices && (
                      <p className="text-xs text-saffron-700">Hidden: manual prices not allowed</p>
                    )}
                    <p className="text-xs text-ink-400">{l.price_source.replace(/_/g, " ")}</p>
                  </Td>
                  <Td className="text-xs">{l.price_checked_at ? formatDateTime(l.price_checked_at) : "—"}</Td>
                  <Td>
                    <StatusBadge status={l.url_status} />
                  </Td>
                  <Td>{l.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Inactive</Badge>}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <ConfirmAction action={verifyListingUrl.bind(null, l.id)} variant="ghost">
                        Verify link
                      </ConfirmAction>
                      <Link href={`/admin/listings/${l.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        Edit
                      </Link>
                      <ConfirmAction action={deleteListing.bind(null, l.id)} confirm="Delete this listing?" variant="ghost">
                        Delete
                      </ConfirmAction>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <Panel title={`Images (${images.length})`} description="Use only images you have the rights to use: your own photos, licensed images, brand press kits, or images returned by an official merchant API.">
        {images.length > 0 && (
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            {images.map((img) => (
              <div key={img.id} className="flex gap-3 rounded-xl border border-line p-3">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                  <Image src={img.url} alt={img.alt_text} fill sizes="80px" className="object-contain" unoptimized={img.source === "merchant_api"} />
                </div>
                <AdminForm action={updateProductImage.bind(null, img.id)} className="flex-1 space-y-2">
                  <TextField name="alt_text" label="Alt text" defaultValue={img.alt_text} />
                  <div className="flex items-end gap-2">
                    <TextField name="sort_order" label="Order" type="number" defaultValue={img.sort_order} className="w-24" />
                    <TextField name="credit" label="Credit" defaultValue={img.credit} className="flex-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <SubmitButton size="sm" variant="outline">
                      Save
                    </SubmitButton>
                    <ConfirmAction action={deleteProductImage.bind(null, img.id)} confirm="Remove this image?" variant="ghost">
                      Remove
                    </ConfirmAction>
                    <Badge variant="outline">{img.source.replace(/_/g, " ")}</Badge>
                  </div>
                </AdminForm>
              </div>
            ))}
          </div>
        )}
        <AdminForm action={addProductImage.bind(null, id)} resetOnSuccess className="space-y-3 rounded-xl border border-dashed border-line-strong p-4">
          <p className="text-sm font-semibold text-ink-900">Add an image</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="img-file" className="mb-1.5 block text-sm font-semibold text-ink-800">
                Upload file
              </label>
              <input id="img-file" type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-700" />
              <p className="mt-1 text-xs text-ink-500">JPEG/PNG/WebP/AVIF/GIF, up to 5 MB. SVG is not accepted.</p>
            </div>
            <TextField name="url" label="…or image URL" type="url" placeholder="https://" hint="Only URLs you are permitted to use (e.g. returned by an official API)." />
            <TextField name="alt_text" label="Alt text" required hint="Describe what the image shows, e.g. “Black wireless earbuds in charging case”." />
            <SelectField
              name="source"
              label="Image source / rights"
              defaultValue="upload"
              options={[
                { value: "upload", label: "Uploaded (we have rights)" },
                { value: "own_photo", label: "Our own photo" },
                { value: "licensed", label: "Licensed image" },
                { value: "brand_press_kit", label: "Brand press kit" },
                { value: "merchant_api", label: "Official merchant API (served from merchant URL)" },
                { value: "other", label: "Other (explain in credit)" },
              ]}
            />
            <TextField name="credit" label="Credit (optional)" />
            <TextField name="source_url" label="Source URL (optional)" type="url" />
          </div>
          <SubmitButton size="sm">Add image</SubmitButton>
        </AdminForm>
      </Panel>

      <Panel title={`Specifications (${specs.length})`} description="Group related specs (e.g. Display, Battery). Add a source URL for figures you cite.">
        <AdminForm action={saveProductSpecs.bind(null, id)}>
          <RowsEditor
            name="specs"
            addLabel="Add specification"
            columns={[
              { key: "group_name", label: "Group", placeholder: "General", width: "0.8fr" },
              { key: "label", label: "Label", width: "1fr" },
              { key: "value", label: "Value", width: "1.4fr" },
              { key: "source_url", label: "Source URL", type: "url", width: "1fr" },
            ]}
            defaultRows={specs.map((s) => ({ group_name: s.group_name, label: s.label, value: s.value, source_url: s.source_url ?? "" }))}
          />
          <SubmitButton size="sm">Save specifications</SubmitButton>
        </AdminForm>
      </Panel>

      <Panel title="Alternative products" description="Editorially chosen alternatives shown on the product page.">
        <AdminForm action={saveProductRelations.bind(null, id)}>
          <label htmlFor="alternatives" className="sr-only">
            Alternatives
          </label>
          <select id="alternatives" name="alternatives" multiple size={8} defaultValue={[...alternativeIds]} className="w-full rounded-xl border border-line-strong p-2 text-sm">
            {products
              .filter((p) => p.id !== id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.status !== "published" ? `(${p.status})` : ""}
                </option>
              ))}
          </select>
          <p className="text-xs text-ink-500">Hold Ctrl/Cmd to select multiple. Only published alternatives are shown publicly.</p>
          <SubmitButton size="sm">Save alternatives</SubmitButton>
        </AdminForm>
      </Panel>

      <AdminForm action={saveProduct.bind(null, id)}>
        <ProductFormFields product={product} brands={brands} categories={categories} />
      </AdminForm>
    </div>
  );
}
