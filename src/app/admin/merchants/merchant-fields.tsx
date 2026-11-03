import type { Tables } from "@/lib/supabase/database.types";
import { asArray } from "@/lib/utils";
import { ImageUrlField, MarkdownEditor, NameSlugFields, RowsEditor } from "@/components/admin/fields";
import { CheckField, Panel, TextAreaField, TextField } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/admin-form";

export function MerchantFields({ merchant }: { merchant?: Tables<"merchants"> | null }) {
  return (
    <>
      <Panel title="Store details">
        <div className="space-y-4">
          <NameSlugFields defaultName={merchant?.name} defaultSlug={merchant?.slug} />
          <div className="grid gap-4 md:grid-cols-2">
            <TextField name="website_url" label="Website URL" defaultValue={merchant?.website_url} required type="url" placeholder="https://www.example.com" />
            <TextField name="visit_url" label="“Visit Store” affiliate link" defaultValue={merchant?.visit_url} type="url" hint="Optional tagged homepage link. Falls back to the website URL." />
          </div>
          <TextAreaField
            name="allowed_domains"
            label="Allowed link domains"
            defaultValue={merchant?.allowed_domains.join("\n")}
            rows={3}
            hint="One per line, e.g. amazon.in and amzn.to. Every destination/affiliate URL for this merchant must use one of these hosts. Add an affiliate network's tracking domain only if your links come from that approved network."
          />
          <TextAreaField name="short_description" label="Short description" defaultValue={merchant?.short_description} rows={2} maxLength={300} />
          <MarkdownEditor name="description" label="Store landing page content" defaultValue={merchant?.description} rows={8} folder="merchants" />
          <TextAreaField name="highlights" label="“Good to know” highlights (one per line)" defaultValue={asArray<string>(merchant?.highlights).join("\n")} rows={3} />
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink-800">Official policy links</p>
            <RowsEditor
              name="policy_links"
              addLabel="Add link"
              columns={[
                { key: "label", label: "Label", placeholder: "Returns policy" },
                { key: "url", label: "URL", type: "url" },
              ]}
              defaultRows={asArray<Record<string, string>>(merchant?.policy_links)}
            />
          </div>
        </div>
      </Panel>

      <Panel title="Branding & disclosure">
        <div className="grid gap-4 md:grid-cols-2">
          <ImageUrlField name="logo_url" label="Logo" defaultValue={merchant?.logo_url} folder="merchants" />
          <div className="space-y-4">
            <CheckField
              name="logo_usage_permitted"
              label="I have permission to display this logo"
              defaultChecked={merchant?.logo_usage_permitted}
              hint="If unchecked, a neutral initials badge is shown instead — avoids implying an official partnership."
            />
            <TextField name="brand_color" label="Badge colour" defaultValue={merchant?.brand_color} placeholder="#2A3557" />
          </div>
          <TextAreaField
            name="disclosure_text"
            label="Merchant-specific disclosure"
            defaultValue={merchant?.disclosure_text}
            rows={2}
            className="md:col-span-2"
            hint="Shown near this merchant's buttons, e.g. “As an Amazon Associate I earn from qualifying purchases.”"
          />
        </div>
      </Panel>

      <Panel title="Pricing rules" description="Controls when listing prices may be displayed publicly.">
        <div className="grid gap-4 md:grid-cols-2">
          <CheckField
            name="allow_manual_prices"
            label="Allow manually entered prices to be displayed"
            defaultChecked={merchant?.allow_manual_prices ?? true}
            hint="Turn OFF for programmes (like Amazon Associates) whose rules require prices from their official API."
          />
          <TextField
            name="price_max_age_hours"
            label="Maximum price age (hours)"
            type="number"
            min={1}
            defaultValue={merchant?.price_max_age_hours}
            hint="Prices older than this are hidden automatically. Leave empty for no limit."
          />
        </div>
      </Panel>

      <Panel title="SEO & visibility">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField name="seo_title" label="SEO title" defaultValue={merchant?.seo_title} maxLength={120} />
          <TextField name="sort_order" label="Sort order" type="number" defaultValue={merchant?.sort_order ?? 0} />
          <TextAreaField name="meta_description" label="Meta description" defaultValue={merchant?.meta_description} rows={2} maxLength={320} className="md:col-span-2" />
          <CheckField name="is_active" label="Active (shown on the site)" defaultChecked={merchant?.is_active ?? true} />
          <CheckField name="is_featured" label="Featured" defaultChecked={merchant?.is_featured} />
        </div>
      </Panel>
      <div className="flex justify-end">
        <SubmitButton>{merchant ? "Save merchant" : "Create merchant"}</SubmitButton>
      </div>
    </>
  );
}
