import { put } from "@vercel/blob";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
const DIR = "/private/tmp/claude-501/-Users-drbakhtiyar/afa109b0-1a17-4e8b-8f65-a04c88aa010d/scratchpad/icons";
for (const f of readdirSync(DIR).filter((f) => f.endsWith(".png"))) {
  const res = await put(`service-icons/${f}`, readFileSync(join(DIR, f)), {
    access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "image/png",
  });
  console.log(f, "→", res.url);
}
