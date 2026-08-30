import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafaf9",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#1e3a5f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 6.5L24.5 10v6.2c0 5.6-3.6 9.9-8.5 11.3-4.9-1.4-8.5-5.7-8.5-11.3V10L16 6.5Z"
                stroke="#f5f0e8"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M12 16.2l2.6 2.6L20.2 13" stroke="#f5f0e8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, color: "#1c1917" }}>Gruvle Verify</div>
        </div>
        <div style={{ fontSize: 64, fontWeight: 600, color: "#1c1917", letterSpacing: -1.5 }}>
          Know what you can trust.
        </div>
        <div style={{ fontSize: 26, color: "#78716c", marginTop: 22 }}>
          An evidence-first verification engine.
        </div>
      </div>
    ),
    { ...size },
  );
}
