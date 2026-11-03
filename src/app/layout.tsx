import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { publicEnv } from "@/lib/env";
import { siteConfig } from "@/config/site";
import { getSiteSettings } from "@/lib/data/settings";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/json-ld";
import { Providers } from "@/components/providers/providers";
import { Analytics } from "@/components/providers/analytics";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const verification = process.env.GOOGLE_SITE_VERIFICATION || settings.googleSiteVerification || undefined;
  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: { default: settings.seoDefaultTitle, template: settings.seoTitleTemplate },
    description: settings.seoDefaultDescription,
    applicationName: settings.brandName,
    openGraph: { siteName: settings.brandName, locale: siteConfig.locale, type: "website" },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
    ...(settings.faviconUrl ? { icons: { icon: settings.faviconUrl, shortcut: settings.faviconUrl } } : {}),
    ...(verification ? { verification: { google: verification } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#4c31c6",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <html lang="en-IN" className={jakarta.variable}>
      <body className="flex min-h-dvh flex-col antialiased">
        <Providers>{children}</Providers>
        <Analytics measurementId={publicEnv.gaMeasurementId} />
        <JsonLd data={[organizationJsonLd(settings), websiteJsonLd(settings)]} />
      </body>
    </html>
  );
}
