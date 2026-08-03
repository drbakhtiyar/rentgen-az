import "dotenv/config";
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/client.js";
import { buildCenterDescription } from "./src/lib/center-description.js";
import { slugify } from "./src/lib/utils.js";
const KEY = process.env.GOOGLE_PLACES_API_KEY!;
const QUERY = process.argv[2] ?? "Piccasa dental Bakı Azərbaycan";
const MATCH = new RegExp(process.argv[3] ?? "picc?as", "i");
const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL }) });

const sres = await fetch("https://places.googleapis.com/v1/places:searchText", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY,
    "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.internationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.photos" },
  body: JSON.stringify({ textQuery: QUERY, languageCode: "az", maxResultCount: 5 }),
});
const places = ((await sres.json()) as any).places ?? [];
for (const pl of places) console.log(`namizəd: ${pl.displayName?.text} · ${(pl.formattedAddress??"").slice(0,60)} · tel:${pl.internationalPhoneNumber ?? "—"} · ⭐${pl.rating ?? "—"}(${pl.userRatingCount ?? 0})`);
const g = places.find((x: any) => MATCH.test(x.displayName?.text ?? ""));
if (!g) { console.log("UYĞUN NƏTİCƏ YOXDUR"); await p.$disconnect(); process.exit(1); }
console.log(`\nSEÇİLDİ: ${g.displayName.text}`);

const phone = (() => { const d = (g.internationalPhoneNumber ?? "").replace(/\D/g, "").slice(-9); return d.length === 9 ? `+994${d}` : ""; })();
const dup = await p.centerProfile.findFirst({ where: { OR: [{ googlePlaceId: g.id }, ...(phone ? [{ phone }] : [])] }, select: { name: true, slug: true, status: true } });
if (dup) { console.log(`DUBLİKAT: ${dup.name} (/${dup.slug}, ${dup.status})`); await p.$disconnect(); process.exit(0); }

const DAYS = ["sun","mon","tue","wed","thu","fri","sat"] as const;
let week: Record<string, {open:string;close:string}|null> | null = null;
if (Array.isArray(g.regularOpeningHours?.periods) && g.regularOpeningHours.periods.length) {
  week = { mon:null,tue:null,wed:null,thu:null,fri:null,sat:null,sun:null };
  for (const per of g.regularOpeningHours.periods) {
    if (typeof per.open?.day !== "number") continue;
    const fmt = (x:any)=>`${String(x.hour??0).padStart(2,"0")}:${String(x.minute??0).padStart(2,"0")}`;
    week[DAYS[per.open.day]] = { open: fmt(per.open), close: per.close ? fmt(per.close) : "23:59" };
  }
}
const addr = g.formattedAddress ?? "";
const dm = addr.match(/([A-ZƏİÖÜÇŞĞ][a-zəıöüçşğ]+)\s+rayonu/);
const city = /sumqayıt/i.test(addr) ? "Sumqayıt" : /gəncə/i.test(addr) ? "Gəncə" : "Bakı";
const MOB = /^\+994(10|50|51|55|60|70|77|99)/;
const name = g.displayName.text.replace(/\s*[-–—]\s*Diş klinikası$/i, "").trim();
let slug = slugify(name);
if (await p.centerProfile.findFirst({ where: { slug }, select: { id: true } })) slug = `${slug}-${slugify(city)}`;

const user = await p.user.create({ data: { phone: phone && MOB.test(phone) ? phone : `placeholder:${randomUUID()}`, role: "CENTER" } });
const center = await p.centerProfile.create({ data: {
  userId: user.id, name, slug, status: "PENDING", phone,
  city, district: dm ? dm[1] : null, address: addr || null,
  lat: g.location?.latitude ?? null, lng: g.location?.longitude ?? null,
  googlePlaceId: g.id, googleRating: g.rating ?? null, googleReviewCount: g.userRatingCount ?? null,
  googleRatingAt: g.rating != null ? new Date() : null, hours: week ?? undefined,
} });

// foto
const urls: string[] = [];
for (const ph of (g.photos ?? []).slice(0, 2)) {
  const r = await fetch(`https://places.googleapis.com/v1/${ph.name}/media?maxWidthPx=1600&key=${KEY}`);
  if (r.ok && (r.headers.get("content-type") ?? "").startsWith("image/")) {
    const blob = await put(`center-images/${slug}-g${urls.length+1}.jpg`, Buffer.from(await r.arrayBuffer()), { access: "public", contentType: "image/jpeg" });
    urls.push(blob.url);
  }
}
// sayt: xidmət sübutu + loqo
const foundSvc: string[] = [];
let logoOk = false;
if (g.websiteUri && !/instagram|facebook/.test(g.websiteUri)) {
  try {
    const res = await fetch(g.websiteUri, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0" } });
    if (res.ok) {
      const html = await res.text();
      const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      const RULES: [string, RegExp][] = [
        ["panoramik-rentgen", /panoram|ортопантомо|opg\b/i],
        ["3d-tomoqrafiya", /cbct|klkt|konus[- ]şüalı|3d (dental |rəqəmsal )?(tomoqraf|rentgen|diaqnost)|tomoqrafiya/i],
        ["cbct", /cbct|klkt|konus[- ]şüalı/i],
        ["sefalometrik-rentgen", /sefalometr/i],
        ["dental-rentgen", /rentgen|rvg|vizioqraf/i],
      ];
      for (const [s, re] of RULES) if (re.test(text)) foundSvc.push(s);
      const abs = (u: string) => { try { return new URL(u, res.url).href; } catch { return null; } };
      const pick = (re: RegExp) => { const m = html.match(re); return m ? abs(m[1]) : null; };
      const logo = pick(/<img[^>]+src=["']([^"']*logo[^"']*)["']/i) ?? pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
      if (logo) {
        const r2 = await fetch(logo, { redirect: "follow" });
        const ct = (r2.headers.get("content-type") ?? "").split(";")[0];
        if (r2.ok && ct.startsWith("image/")) {
          const buf = Buffer.from(await r2.arrayBuffer());
          if (buf.length >= 3000) {
            const ext = ct === "image/png" ? "png" : ct === "image/webp" ? "webp" : ct === "image/svg+xml" ? "svg" : "jpg";
            const blob = await put(`center-logos/${slug}-logo.${ext}`, buf, { access: "public" });
            await p.centerProfile.update({ where: { id: center.id }, data: { logoUrl: blob.url } });
            logoOk = true;
          }
        }
      }
    }
  } catch {}
}
if (foundSvc.length) {
  const svc = await p.service.findMany({ where: { slug: { in: foundSvc } }, select: { id: true } });
  await p.centerService.createMany({ data: svc.map(s => ({ centerId: center.id, serviceId: s.id })), skipDuplicates: true });
}
const desc = buildCenterDescription({ id: center.id, name, city, district: dm ? dm[1] : null, address: addr, hours: week, googleRating: g.rating ?? null, googleReviewCount: g.userRatingCount ?? null });
await p.centerProfile.update({ where: { id: center.id }, data: { description: desc, images: urls } });
console.log(`\n✅ /${slug} (PENDING) · tel:${phone||"—"} ⭐${g.rating??"—"}(${g.userRatingCount??0}) foto:${urls.length} loqo:${logoOk?"✓":"—"} saat:${week?"✓":"—"}`);
console.log(`   xidmət: ${foundSvc.join(", ") || "—"} · sayt: ${g.websiteUri ?? "—"}`);
console.log(`   ünvan: ${addr}`);
await p.$disconnect();
