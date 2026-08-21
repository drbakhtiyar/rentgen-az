import { put } from "@vercel/blob";
import { readFileSync } from "fs";
const DIR = "/private/tmp/claude-501/-Users-drbakhtiyar/afa109b0-1a17-4e8b-8f65-a04c88aa010d/scratchpad/icons";
for (const f of ["yasti-pencelik-rentgeni.png", "yumsaq-toxuma-usm.png"]) {
  const res = await put(`service-icons/${f}`, readFileSync(`${DIR}/${f}`), {
    access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "image/png",
    cacheControlMaxAge: 300,
  });
  console.log("əvəz olundu:", res.url);
}
