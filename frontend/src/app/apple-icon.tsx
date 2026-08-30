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
          background: "#1e3a5f",
          borderRadius: 40,
        }}
      >
        <svg width="110" height="110" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="9.5" stroke="#f5f0e8" strokeWidth="1.4" opacity="0.55" />
          <path d="M10.5 16.3L14 20L22 11" stroke="#f5f0e8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
