import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/lib/data/settings";

export const alt = "Discover better products. Shop smarter.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social sharing image (pages can override with their own image). */
export default async function OpenGraphImage() {
  const settings = await getSiteSettings();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "white",
          background: "linear-gradient(135deg, #2f2379 0%, #4c31c6 50%, #5d3fe8 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 44, fontWeight: 800 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: 999, background: "#5d3fe8" }} />
          </div>
          {settings.brandName}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>Discover better products.</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, color: "#ffcd5c" }}>Shop smarter.</div>
        </div>
        <div style={{ fontSize: 30, opacity: 0.85 }}>{settings.tagline}</div>
      </div>
    ),
    size,
  );
}
