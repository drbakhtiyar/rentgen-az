import { JsonLd } from "@/components/ui/json-ld";
import { WaitlistLanding } from "@/components/waitlist/waitlist-landing";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Erkən qeydiyyat / Ранняя регистрация — Rentgen.az",
  description:
    "Dental rentgen və CBCT randevusunu onlayn bron etmək funksiyası tezliklə açılır. Siyahıya yazılın, ilk siz bilin. / Скоро запускается онлайн-запись на дентальный рентген и КЛКТ — запишитесь первыми.",
  path: "/waitlist",
  keywords: [
    "Rentgen.az erkən qeydiyyat",
    "dental rentgen onlayn randevu",
    "запись на рентген Баку",
    "waitlist",
  ],
});

export default function WaitlistPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana səhifə", path: "/" },
          { name: "Erkən qeydiyyat", path: "/waitlist" },
        ])}
      />
      <WaitlistLanding />
    </>
  );
}
