import { writeFileSync } from "node:fs";

const KEY = process.env.OPENAI_API_KEY!;
const OUT = process.env.OUT_DIR!;

// İstifadəçinin premium tibbi ikon spesifikasiyası (2026-08-13) — ingiliscə
// tərtib olunub ki, model dəqiq əməl etsin; qaydalar birə-bir saxlanılıb.
function prompt(service: string, modality: string, bodyPart: string): string {
  return `Premium medical service icon for a radiology platform, in the exact style of Apple Health and Apple Vision Pro UI combined with Human Anatomy Atlas medical illustration. Glassmorphism, minimal premium, future medical UI.

A 3D translucent human body figure made of dark blue transparent glass material, soft studio lighting, premium medical render. No face details, no skin texture, no muscles, no blood — only a clean anatomical glass silhouette. Orthographic camera, perfectly centered, no perspective distortion.

The examined region — ${bodyPart} — glows in bright electric blue (#2EA8FF), with soft glow ONLY in that region. All other body parts remain dark blue and transparent.

A small badge in the top-right corner reads "${modality}" in clean sans-serif capitals — same size and position as in a consistent icon system.

Transparent background, no shadow, no text other than the badge, no frame. Ultra clean, medical grade, sharp, 8K quality, photorealistic anatomy but minimal, not artistic, not fantasy, no organs unless required.

Service: ${service}.`;
}

const PILOT: { slug: string; service: string; modality: string; body: string }[] = [
  { slug: "beyin-mrt", service: "Brain MRI (Beyin MRT)", modality: "MRI", body: "the brain inside the head" },
  { slug: "agciyer-kt", service: "Lung CT (Ağciyər KT)", modality: "CT", body: "the lungs inside the chest" },
  { slug: "panoramik-rentgen", service: "Panoramic dental X-ray (Panoramik rentgen)", modality: "X-RAY", body: "the jaw and teeth area of the head" },
  { slug: "qarin-usm", service: "Abdominal ultrasound (Qarın USM)", modality: "USM", body: "the abdominal area" },
  { slug: "bel-mrt", service: "Lumbar spine MRI (Bel MRT)", modality: "MRI", body: "the lumbar spine (lower back vertebrae)" },
];

for (const p of PILOT) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: prompt(p.service, p.modality, p.body),
      size: "1024x1024",
      background: "transparent",
      quality: "medium",
      n: 1,
    }),
  });
  if (!res.ok) {
    console.error(p.slug, "XƏTA", res.status, (await res.text()).slice(0, 300));
    continue;
  }
  const data = (await res.json()) as { data: { b64_json: string }[] };
  writeFileSync(`${OUT}/${p.slug}.png`, Buffer.from(data.data[0].b64_json, "base64"));
  console.log(p.slug, "ok");
}
