import type { Tables } from "@/lib/supabase/database.types";
import { ImageUrlField } from "@/components/admin/fields";
import { CheckField, Panel, SelectField, TextAreaField, TextField, toLocalInput } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/admin-form";

export function BannerFields({ banner }: { banner?: Tables<"banners"> | null }) {
  return (
    <>
      <Panel title="Banner">
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            name="placement"
            label="Placement"
            defaultValue={banner?.placement ?? "home_hero"}
            options={[
              { value: "home_hero", label: "Homepage hero (first active is used)" },
              { value: "home_promo", label: "Homepage promo cards" },
              { value: "deals_top", label: "Top of Deals page" },
            ]}
          />
          <SelectField
            name="theme"
            label="Colour theme"
            defaultValue={banner?.theme ?? "violet"}
            options={["violet", "saffron", "navy", "emerald", "rose"].map((t) => ({ value: t, label: t }))}
          />
          <TextField name="eyebrow" label="Eyebrow (small label)" defaultValue={banner?.eyebrow} maxLength={80} />
          <TextField name="title" label="Headline" defaultValue={banner?.title} required maxLength={160} />
          <TextAreaField name="subtitle" label="Supporting text" defaultValue={banner?.subtitle} rows={2} maxLength={400} className="md:col-span-2" />
          <TextField name="cta_label" label="Primary button label" defaultValue={banner?.cta_label} maxLength={40} />
          <TextField name="cta_url" label="Primary button link" defaultValue={banner?.cta_url} placeholder="/products" />
          <TextField name="secondary_cta_label" label="Secondary button label" defaultValue={banner?.secondary_cta_label} maxLength={40} />
          <TextField name="secondary_cta_url" label="Secondary button link" defaultValue={banner?.secondary_cta_url} placeholder="/deals" />
          <ImageUrlField name="image_url" label="Image (optional — replaces the default illustration)" defaultValue={banner?.image_url} folder="banners" />
          <TextField name="image_alt" label="Image alt text" defaultValue={banner?.image_alt} />
        </div>
      </Panel>
      <Panel title="Schedule & visibility">
        <div className="grid gap-4 md:grid-cols-4">
          <TextField name="starts_at" label="Starts (IST)" type="datetime-local" defaultValue={toLocalInput(banner?.starts_at)} />
          <TextField name="ends_at" label="Ends (IST)" type="datetime-local" defaultValue={toLocalInput(banner?.ends_at)} />
          <TextField name="sort_order" label="Order" type="number" defaultValue={banner?.sort_order ?? 0} />
          <div className="pt-7">
            <CheckField name="is_active" label="Active" defaultChecked={banner?.is_active ?? true} />
          </div>
        </div>
      </Panel>
      <div className="flex justify-end">
        <SubmitButton>{banner ? "Save banner" : "Create banner"}</SubmitButton>
      </div>
    </>
  );
}
