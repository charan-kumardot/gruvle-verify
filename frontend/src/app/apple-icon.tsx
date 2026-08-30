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
          <path
            d="M16 6.5L24.5 10v6.2c0 5.6-3.6 9.9-8.5 11.3-4.9-1.4-8.5-5.7-8.5-11.3V10L16 6.5Z"
            stroke="#f5f0e8"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M12 16.2l2.6 2.6L20.2 13" stroke="#f5f0e8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
