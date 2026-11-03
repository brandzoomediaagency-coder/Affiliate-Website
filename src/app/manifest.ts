import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/data/settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();
  return {
    name: settings.brandName,
    short_name: settings.brandName,
    description: settings.seoDefaultDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#f6f6fa",
    theme_color: "#4c31c6",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
