import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { getCenterBySlug } from "@/lib/queries";

export const alt = "Rentgen mərkəzi — rentgen.az";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const markDataUri = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "mark-square.png"),
).toString("base64")}`;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const center = await getCenterBySlug(slug).catch(() => null);
  const name = center?.name ?? "Rentgen mərkəzi";
  const city = center?.city ?? "Bakı";
  const serviceCount = center?.services?.length ?? 0;
  const rating = typeof center?.googleRating === "number" ? center.googleRating : null;
  const reviews = center?.googleReviewCount ?? 0;

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markDataUri} width={64} height={64} style={{ borderRadius: 16 }} alt="" />
          <div style={{ display: "flex", fontSize: 32, fontWeight: 800 }}>
            <span>rentgen</span>
            <span style={{ color: "#0bb1f0" }}>.az</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, maxWidth: 1040 }}>
            {name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{ width: 14, height: 14, borderRadius: 999, background: "#0bb1f0" }}
            />
            <div style={{ fontSize: 30, color: "#9fb4d6" }}>{city}</div>
            {serviceCount > 0 && (
              <div style={{ fontSize: 30, color: "#9fb4d6" }}>· {serviceCount} xidmət</div>
            )}
          </div>
          {rating != null && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 28,
                fontWeight: 700,
                color: "#0a1124",
                background: "#ffd84a",
                borderRadius: 999,
                padding: "8px 22px",
                alignSelf: "flex-start",
              }}
            >
              Google {rating.toFixed(1)}
              {reviews > 0 && (
                <span style={{ fontWeight: 400 }}>· {reviews} rəy</span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {["Dental rentgen", "3D tomoqrafiya", "Qiymət", "Ünvan"].map((t) => (
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
