import { writeFileSync, readFileSync } from "node:fs";

const KEY = process.env.OPENAI_API_KEY!;
const S = process.env.SCRATCH!;

function prompt(service: string, modality: string, subject: string): string {
  return `Using the EXACT same visual style as the reference sheet (dark navy #0b1230 background, luminous electric-blue X-ray / CT-scan anatomy rendering, translucent bone and tissue glow, premium medical UI): create ONE single square icon for the radiology service "${service}".

Show: ${subject} — as a glowing blue X-ray style close-up, centered, filling most of the frame.

Top-right corner: a small rounded badge with the text "${modality}" in the same badge style as the reference.

NO other text, NO caption, NO label at the bottom, NO grid — just one single icon tile. Dark navy background, ultra clean, sharp, medical grade.`;
}

const PILOT = [
  { slug: "panoramik", service: "Panoramik rentgen", modality: "X-RAY", subject: "a full panoramic dental X-ray view of upper and lower teeth arches" },
  { slug: "beyin-mrt", service: "Beyin MRT", modality: "MRI", subject: "a human head profile with the brain glowing in blue" },
  { slug: "qarin-usm", service: "Qarın USM", modality: "USM", subject: "the abdominal organs (liver, stomach, intestines) glowing softly inside a torso outline" },
  { slug: "diz-mrt", service: "Diz MRT", modality: "MRI", subject: "a knee joint with femur, patella and tibia bones glowing" },
];

for (const p of PILOT) {
  const form = new FormData();
  const ref = readFileSync(`${S}/icon-reference.png`);
  form.append("image[]", new Blob([ref], { type: "image/png" }), "reference.png");
  form.append("model", "gpt-image-1");
  form.append("prompt", prompt(p.service, p.modality, p.subject));
  form.append("size", "1024x1024");
  form.append("quality", "medium");
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}` },
    body: form,
  });
  if (!res.ok) {
    console.error(p.slug, "XƏTA", res.status, (await res.text()).slice(0, 250));
    continue;
  }
  const data = (await res.json()) as { data: { b64_json: string }[] };
  writeFileSync(`${S}/icons-v2/${p.slug}.png`, Buffer.from(data.data[0].b64_json, "base64"));
  console.log(p.slug, "ok");
}
