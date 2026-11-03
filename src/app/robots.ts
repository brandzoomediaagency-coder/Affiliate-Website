import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/wishlist", "/api/", "/auth/", "/search", "/login", "/signup", "/forgot-password", "/reset-password", "/newsletter/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
