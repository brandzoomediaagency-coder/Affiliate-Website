import { Mail, MapPin, Phone } from "lucide-react";
import { getSiteSettings } from "@/lib/data/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/shared/navigation";
import { ContactForm } from "@/components/shared/contact-form";

export async function generateMetadata() {
  const settings = await getSiteSettings();
  return buildMetadata({
    title: `Contact ${settings.brandName}`,
    description: `Questions, corrections or partnership enquiries? Get in touch with the ${settings.brandName} team.`,
    path: "/contact",
  });
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <div className="border-b border-line bg-white">
        <div className="container-page max-w-5xl py-8 sm:py-12">
          <Breadcrumbs items={[{ name: "Contact", href: "/contact" }]} />
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">Contact us</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-500">
            Questions about a product page, a correction, or a partnership enquiry? Send us a message. For orders, deliveries,
            returns or refunds, please contact the store you bought from — we don&apos;t process orders.
          </p>
        </div>
      </div>
      <div className="container-page grid max-w-5xl gap-8 py-10 lg:grid-cols-[1fr_18rem]">
        <ContactForm />
        <aside className="space-y-4 text-sm text-ink-600">
          {settings.contactEmail && (
            <p className="flex items-start gap-2.5">
              <Mail className="mt-0.5 size-4 text-brand-600" aria-hidden="true" />
              <a href={`mailto:${settings.contactEmail}`} className="font-medium text-brand-700 hover:underline">
                {settings.contactEmail}
              </a>
            </p>
          )}
          {settings.contactPhone && (
            <p className="flex items-start gap-2.5">
              <Phone className="mt-0.5 size-4 text-brand-600" aria-hidden="true" /> {settings.contactPhone}
            </p>
          )}
          {settings.contactAddress && (
            <p className="flex items-start gap-2.5 whitespace-pre-line">
              <MapPin className="mt-0.5 size-4 text-brand-600" aria-hidden="true" /> {settings.contactAddress}
            </p>
          )}
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="font-semibold text-ink-900">Need help with an order?</p>
            <p className="mt-1">
              Orders, payments, deliveries, returns and warranty claims are handled by the merchant. Please contact the store
              directly through your order page on their website.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
