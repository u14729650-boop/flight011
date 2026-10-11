import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "HOMIES CHOICE — Designer & Arabic perfumes in Ahmedabad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(path.join(process.cwd(), "public/images/brand/hc-logo-stacked.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
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
          background: "radial-gradient(circle at 50% 35%, #0f5642 0%, #063B2E 45%, #021C16 100%)",
          color: "#D5B477",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={560} height={320} alt="" style={{ objectFit: "contain" }} />
        <div style={{ marginTop: 36, fontSize: 22, letterSpacing: 7, color: "rgba(247,243,235,0.75)" }}>
          DESIGNER &amp; ARABIC PERFUMES · AHMEDABAD
        </div>
      </div>
    ),
    size,
  );
}
