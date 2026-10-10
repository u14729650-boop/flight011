import { ImageResponse } from "next/og";

export const alt = "HOMIES CHOICE — Designer & Arabic perfumes in Ahmedabad";
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
          background: "radial-gradient(circle at 70% 30%, #0f5642 0%, #063B2E 45%, #021C16 100%)",
          color: "#F7F3EB",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 999,
            border: "2px solid #D5B477",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#D5B477",
            fontSize: 52,
          }}
        >
          HC
        </div>
        <div style={{ marginTop: 40, fontSize: 64, letterSpacing: 14 }}>HOMIES CHOICE</div>
        <div style={{ marginTop: 18, fontSize: 30, color: "#D5B477", fontStyle: "italic" }}>Find your signature scent.</div>
        <div style={{ marginTop: 34, fontSize: 20, letterSpacing: 6, color: "rgba(247,243,235,0.7)" }}>
          DESIGNER &amp; ARABIC PERFUMES · AHMEDABAD
        </div>
      </div>
    ),
    size,
  );
}
