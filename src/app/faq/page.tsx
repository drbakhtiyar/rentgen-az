import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { FaqAccordion, type FaqItem } from "@/components/faq-accordion";
import { JsonLd } from "@/components/ui/json-ld";
import { HOME_FAQ } from "@/content/faq";
import { buildMetadata, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Tez-tez verilən suallar — dental rentgen və 3D tomoqrafiya",
  description:
    "Dental rentgen, panoramik və sefalometrik rentgen, 3D tomoqrafiya (CBCT), implant tomoqrafiyası, qiymət, qeydiyyat və OTP giriş haqqında tez-tez verilən suallar.",
  path: "/faq",
  keywords: [
    "dental rentgen sualları",
    "3D tomoqrafiya nədir",
    "panoramik rentgen",
    "implant tomoqrafiyası",
    "CBCT qiymət",
    "OTP giriş",
  ],
});

const ADDITIONAL_FAQ: FaqItem[] = [
  {
    question: "Panoramik (ortopantomoqrafiya) rentgen nədir?",
    answer:
      "Panoramik rentgen bütün diş cərgəsini, çənələri və ətraf strukturları bir təsvirdə göstərir. Bu, ümumi diaqnostikaya kömək edir və həkimə müalicə planını qurarkən geniş mənzərə təqdim edir.",
  },
  {
    question: "Sefalometrik rentgen nə üçün təyin olunur?",
    answer:
      "Sefalometrik rentgen baş-üz nahiyəsinin yan profilini göstərir və əsasən ortodontik müalicədə istifadə olunur. Həkimə çənələrin nisbətini və böyümə istiqamətini qiymətləndirməyə dəstək olur.",
  },
  {
    question: "3D tomoqrafiya (CBCT) ilə adi rentgen arasında fərq nədir?",
    answer:
      "Adi rentgen ikiölçülü təsvir verir, 3D tomoqrafiya (CBCT) isə nahiyəni üçölçülü qiymətləndirməyə imkan yaradır. Bu, mürəkkəb hallarda daha dəqiq diaqnostikaya kömək edir; müayinə növünü həkim klinik göstərişə əsasən seçir.",
  },
  {
    question: "İmplant tomoqrafiyası nə üçün lazımdır?",
    answer:
      "İmplant öncəsi tomoqrafiya çənə sümüyünün həcmini, sıxlığını və anatomik strukturları göstərir. Bu məlumat həkimin implant planlaması ilə bağlı klinik qərar verməsinə dəstək olur.",
  },
  {
    question: "Müayinələrin qiyməti nə qədərdir?",
    answer:
      "Qiymət müayinənin növündən və mərkəzdən asılı olaraq dəyişir. Dəqiq məbləği seçdiyiniz mərkəzdən birbaşa öyrənmək olar; ödəniş platformada deyil, müayinə zamanı mərkəzdə həyata keçirilir.",
  },
  {
    question: "Müayinə nəticələrini necə alıram?",
    answer:
      "Nəticələr seçdiyiniz mərkəz tərəfindən təqdim olunur — bu, çap, rəqəmsal fayl və ya disk şəklində ola bilər. Təqdimat formatını qeydiyyat zamanı mərkəzdən soruşa bilərsiniz.",
  },
  {
    question: "Qeydiyyat üçün parol lazımdırmı?",
    answer:
      "Xeyr. Telefon nömrənizi daxil edirsiniz, sizə birdəfəlik təsdiq kodu (OTP) göndərilir. Kodu təsdiqlədikdən sonra profiliniz yaradılır — ayrıca parol tələb olunmur.",
  },
  {
    question: "OTP kodu gəlməsə nə etməliyəm?",
    answer:
      "Bir neçə dəqiqə gözləyib kodu yenidən tələb edə bilərsiniz. Nömrənin düzgün yazıldığını yoxlayın; problem davam edərsə, dəstək üçün bizimlə əlaqə saxlayın.",
  },
];

const ALL_FAQ: FaqItem[] = [...HOME_FAQ, ...ADDITIONAL_FAQ];

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Ana səhifə", path: "/" },
            { name: "Tez-tez verilən suallar", path: "/faq" },
          ]),
          faqJsonLd(ALL_FAQ),
        ]}
      />
      <PageHeader
        eyebrow="Kömək mərkəzi"
        title="Tez-tez verilən suallar"
        description="Dental rentgen, 3D tomoqrafiya, qeydiyyat və xidmətlər haqqında ən çox soruşulan suallara cavablar."
        breadcrumbs={[
          { name: "Ana səhifə", href: "/" },
          { name: "Tez-tez verilən suallar" },
        ]}
      />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <FaqAccordion items={ALL_FAQ} />
          </div>
        </Container>
      </Section>
    </>
  );
}
