import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // NB: anchor the panel prefixes so they don't also block the PUBLIC pages
      // /hekimler and /merkezler-ucun (a bare "/hekim" / "/merkez" would).
      disallow: [
        "/admin",
        "/panel",
        "/crm",
        "/hekim$",
        "/hekim/",
        "/merkez$",
        "/merkez/",
        "/kabinet",
        "/giris",
        "/api",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
