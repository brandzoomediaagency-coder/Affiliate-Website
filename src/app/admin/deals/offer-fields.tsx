import type { Tables } from "@/lib/supabase/database.types";
import { ImageUrlField, NameSlugFields } from "@/components/admin/fields";
import { CheckField, Panel, SelectField, TextAreaField, TextField, toLocalInput } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/admin-form";

export function OfferFields({
  offer,
  merchants,
  products,
  categories,
}: {
  offer?: Tables<"offers"> | null;
  merchants: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; depth: number }>;
}) {
  return (
    <>
      <Panel title="Offer">
        <div className="space-y-4">
          <NameSlugFields nameField="title" nameLabel="Offer title" defaultName={offer?.title} defaultSlug={offer?.slug} />
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField name="merchant_id" label="Merchant" required defaultValue={offer?.merchant_id} options={merchants.map((m) => ({ value: m.id, label: m.name }))} />
            <SelectField name="product_id" label="Product (optional)" defaultValue={offer?.product_id} emptyLabel="— None —" options={products.map((p) => ({ value: p.id, label: p.name }))} />
            <SelectField
              name="category_id"
              label="Category (optional)"
              defaultValue={offer?.category_id}
              emptyLabel="— None —"
              options={categories.map((c) => ({ value: c.id, label: `${"— ".repeat(c.depth)}${c.name}` }))}
            />
          </div>
          <TextField name="offer_url" label="Offer affiliate URL" required type="url" defaultValue={offer?.offer_url} hint="Must use one of the merchant's allowed domains." />
          <TextAreaField name="description" label="Description" defaultValue={offer?.description} rows={3} maxLength={1000} />
          <div className="grid gap-4 md:grid-cols-2">
            <ImageUrlField name="image_url" label="Image (rights required)" defaultValue={offer?.image_url} folder="offers" />
            <TextField name="image_alt" label="Image alt text" defaultValue={offer?.image_alt} />
          </div>
        </div>
      </Panel>
      <Panel title="Discount details" description="Only publish discounts the merchant actually states. Never invent percentages or urgency.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField name="discount_text" label="Discount (as stated by merchant)" defaultValue={offer?.discount_text} maxLength={160} placeholder="e.g. Up to 40% off on select earbuds" />
          <TextField name="coupon_code" label="Coupon code" defaultValue={offer?.coupon_code} maxLength={60} />
          <TextField name="source_url" label="Where you verified it (URL)" type="url" defaultValue={offer?.source_url} />
          <div className="space-y-2">
            <TextField name="verified_at" label="Verified at (IST)" type="datetime-local" defaultValue={toLocalInput(offer?.verified_at)} />
            <CheckField name="verified_now" label="I verified this offer just now" />
          </div>
          <TextField name="starts_at" label="Starts (IST, optional)" type="datetime-local" defaultValue={toLocalInput(offer?.starts_at)} />
          <TextField name="expires_at" label="Expires (IST, optional)" type="datetime-local" defaultValue={toLocalInput(offer?.expires_at)} hint="Expired offers are hidden automatically." />
          <TextAreaField name="terms" label="Terms & conditions" defaultValue={offer?.terms} rows={3} className="md:col-span-2" />
        </div>
      </Panel>
      <Panel title="Visibility">
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField
            name="status"
            label="Status"
            defaultValue={offer?.status ?? "draft"}
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
            ]}
          />
          <TextField name="sort_order" label="Sort order" type="number" defaultValue={offer?.sort_order ?? 0} />
          <CheckField name="is_featured" label="Featured" defaultChecked={offer?.is_featured} />
        </div>
      </Panel>
      <div className="flex justify-end">
        <SubmitButton>{offer ? "Save offer" : "Create offer"}</SubmitButton>
      </div>
    </>
  );
}
