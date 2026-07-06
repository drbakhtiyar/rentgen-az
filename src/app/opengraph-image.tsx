import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const alt = "Rentgen.az — Bakıda dental rentgen və 3D tomoqrafiya mərkəzləri";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const markDataUri = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "mark-square.png"),
).toString("base64")}`;

export default function OgImage() {
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
          background:
            "radial-gradient(900px 500px at 20% 0%, #103fa3 0%, transparent 60%), linear-gradient(135deg, #0a1124 0%, #050b1a 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={markDataUri} width={72} height={72} style={{ borderRadius: 18 }} alt="" />
          <div style={{ display: "flex", fontSize: 36, fontWeight: 800 }}>
            <span>rentgen</span>
            <span style={{ color: "#0bb1f0" }}>.az</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 980 }}>
            Bakıda dental rentgen və 3D tomoqrafiya mərkəzini tapın
          </div>
          <div style={{ fontSize: 30, color: "#9fb4d6", maxWidth: 900 }}>
            Panoramik, sefalometrik rentgen, CBCT və implant öncəsi tomoqrafiya — təsdiqlənmiş mərkəzlər
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {["Dental rentgen", "3D tomoqrafiya", "CBCT", "Panoramik"].map((t) => (
            <div
              key={t}
              style={{
                fontSize: 24,
                color: "#bfe3ff",
                border: "1px solid rgba(122,170,255,0.3)",
                borderRadius: 999,
                padding: "8px 20px",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
