import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7258fa, #3d299e)",
          borderRadius: 40,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 40 40">
          <path d="M11 13.5c0-1.4 1.1-2.5 2.5-2.5h7.3c.7 0 1.3.3 1.8.7l6.7 6.7c1 1 1 2.6 0 3.5l-7.3 7.3c-1 1-2.6 1-3.5 0l-6.7-6.7c-.5-.5-.8-1.1-.8-1.8v-7.2Z" fill="#fff" />
          <circle cx="16.3" cy="16.3" r="2.1" fill="#5d3fe8" />
          <path d="M29.5 8.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z" fill="#ffbb33" />
        </svg>
      </div>
    ),
    size,
  );
}
