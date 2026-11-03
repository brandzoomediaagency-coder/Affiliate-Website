import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { saveSettings } from "@/lib/actions/admin/system";
import { socialPlatforms } from "@/config/site";
import { AdminForm, SubmitButton } from "@/components/admin/admin-form";
import { ImageUrlField, MarkdownEditor } from "@/components/admin/fields";
import { AdminHeader, CheckField, Panel, TextAreaField, TextField } from "@/components/admin/ui";
import Link from "next/link";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data: s } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  const social = (s?.social_links ?? {}) as Record<string, string>;
  return (
    <div className="max-w-4xl">
      <AdminHeader title="Site settings" description={<>Brand, SEO defaults, disclosures and newsletter. Edit the homepage hero under <Link href="/admin/banners" className="text-brand-700 underline">Banners</Link>.</>} />
      <AdminForm action={saveSettings}>
        <Panel title="Brand">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField name="brand_name" label="Brand name" defaultValue={s?.brand_name} required maxLength={60} />
            <TextField name="tagline" label="Tagline" defaultValue={s?.tagline} maxLength={160} />
            <ImageUrlField name="logo_url" label="Logo (optional — replaces the default mark + name)" defaultValue={s?.logo_url} folder="site" />
            <ImageUrlField name="favicon_url" label="Favicon (optional)" defaultValue={s?.favicon_url} folder="site" />
            <TextAreaField name="footer_about" label="Footer about text" defaultValue={s?.footer_about} rows={3} maxLength={600} className="md:col-span-2" />
          </div>
        </Panel>
        <Panel title="Announcement bar">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField name="announcement_text" label="Text (leave empty to hide)" defaultValue={s?.announcement_text} maxLength={200} />
            <TextField name="announcement_url" label="Link" defaultValue={s?.announcement_url} placeholder="/deals" />
          </div>
        </Panel>
        <Panel title="Contact & social">
          <div className="grid gap-4 md:grid-cols-3">
            <TextField name="contact_email" label="Contact email" type="email" defaultValue={s?.contact_email} />
            <TextField name="contact_phone" label="Phone" defaultValue={s?.contact_phone} />
            <TextField name="contact_address" label="Address" defaultValue={s?.contact_address} />
            {socialPlatforms.map((p) => (
              <TextField key={p} name={`social_${p}`} label={p === "x" ? "X (Twitter)" : p[0]!.toUpperCase() + p.slice(1)} type="url" defaultValue={social[p]} placeholder="https://" />
            ))}
          </div>
        </Panel>
        <Panel title="SEO defaults">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField name="seo_default_title" label="Default (homepage) title" defaultValue={s?.seo_default_title} maxLength={120} />
            <TextField name="seo_title_template" label="Title template" defaultValue={s?.seo_title_template} hint="Must include %s, e.g. “%s | Brand”." />
            <TextAreaField name="seo_default_description" label="Default meta description" defaultValue={s?.seo_default_description} rows={2} maxLength={320} className="md:col-span-2" />
            <ImageUrlField name="default_og_image_url" label="Default social image (1200×630)" defaultValue={s?.default_og_image_url} folder="site" />
            <TextField name="google_site_verification" label="Google Search Console verification token" defaultValue={s?.google_site_verification} hint="The content value of the HTML meta tag. The GOOGLE_SITE_VERIFICATION env var takes precedence." />
          </div>
        </Panel>
        <Panel title="Affiliate disclosure" description="Shown near affiliate buttons and on the Affiliate Disclosure page.">
          <div className="space-y-4">
            <TextAreaField name="affiliate_disclosure_short" label="Short disclosure" defaultValue={s?.affiliate_disclosure_short} rows={2} maxLength={500} />
            <TextField
              name="amazon_associate_statement"
              label="Amazon Associates statement"
              defaultValue={s?.amazon_associate_statement}
              required
              hint="Amazon requires the exact wording: “As an Amazon Associate I earn from qualifying purchases.”"
            />
            <MarkdownEditor name="affiliate_disclosure_content" label="Full disclosure page" defaultValue={s?.affiliate_disclosure_content} rows={12} />
          </div>
        </Panel>
        <Panel title="Newsletter">
          <div className="grid gap-4 md:grid-cols-2">
            <CheckField name="newsletter_enabled" label="Show newsletter sign-up" defaultChecked={s?.newsletter_enabled} />
            <div />
            <TextField name="newsletter_heading" label="Heading" defaultValue={s?.newsletter_heading} />
            <TextField name="newsletter_subheading" label="Subheading" defaultValue={s?.newsletter_subheading} />
            <TextAreaField
              name="newsletter_consent_text"
              label="Consent wording"
              defaultValue={s?.newsletter_consent_text}
              rows={2}
              className="md:col-span-2"
              hint="Stored with each subscriber as their record of consent."
            />
          </div>
        </Panel>
        <div className="flex justify-end">
          <SubmitButton>Save settings</SubmitButton>
        </div>
      </AdminForm>
    </div>
  );
}
