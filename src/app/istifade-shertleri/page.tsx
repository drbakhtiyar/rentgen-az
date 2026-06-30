import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { JsonLd } from "@/components/ui/json-ld";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "İstifadə şərtləri",
  description:
    "Rentgen.az platformasının istifadə şərtləri: platformanın təyinatı, hesab və OTP giriş, istifadəçi öhdəlikləri, məsuliyyətin məhdudlaşdırılması və tibbi məsuliyyət açıqlaması.",
  path: "/istifade-shertleri",
  keywords: ["istifadə şərtləri", "Rentgen.az qaydaları", "platforma şərtləri"],
});

export default function TermsOfUsePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana səhifə", path: "/" },
          { name: "İstifadə şərtləri", path: "/istifade-shertleri" },
        ])}
      />
      <PageHeader
        eyebrow="Hüquqi"
        title="İstifadə şərtləri"
        description="Bu şərtlər Rentgen.az platformasından istifadəni tənzimləyir. Platformadan istifadə etməklə aşağıdakı şərtləri qəbul etmiş olursunuz."
        breadcrumbs={[
          { name: "Ana səhifə", href: "/" },
          { name: "İstifadə şərtləri" },
        ]}
      />
      <Section>
        <Container>
          <div className="max-w-3xl">
            <p className="text-slate-600 leading-relaxed">
              Aşağıdakı şərtlər Rentgen.az (bundan sonra “platforma”) saytından
              və xidmətlərindən istifadəni tənzimləyir. Platformaya daxil olmaqla
              və ya ondan istifadə etməklə bu şərtlərlə razılaşdığınızı təsdiq
              edirsiniz. Şərtlərlə razılaşmırsınızsa, platformadan istifadə
              etməyin.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              1. Platformanın təyinatı
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Rentgen.az Azərbaycanda dental rentgen və 3D tomoqrafiya xidmətləri
              göstərən mərkəzləri bir araya gətirən kataloq və əlaqə
              platformasıdır. Platforma istifadəçilərə mərkəzləri tapmaq, müqayisə
              etmək və onlarla birbaşa əlaqə saxlamaq imkanı verir. Platforma tibbi
              məsləhət, diaqnoz və ya müalicə xidməti göstərmir.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              2. Hesab və OTP giriş
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Bəzi funksiyalardan istifadə üçün qeydiyyat tələb oluna bilər.
              Qeydiyyat və giriş telefon nömrəsi və birdəfəlik təsdiq kodu (OTP)
              vasitəsilə həyata keçirilir. Telefon nömrənizin və hesabınızın
              təhlükəsizliyinə görə siz məsuliyyət daşıyırsınız. Hesabınızdan
              icazəsiz istifadə aşkar etdikdə dərhal bizimlə əlaqə saxlamalısınız.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              3. İstifadəçi öhdəlikləri
            </h2>
            <p className="text-slate-600 leading-relaxed">
              İstifadəçi platformaya dəqiq və düzgün məlumat təqdim etməyi
              öhdəsinə götürür. Platformadan qanunsuz məqsədlər üçün, başqalarının
              hüquqlarını pozaraq və ya sistemin normal işinə mane olacaq şəkildə
              istifadə etmək qadağandır. Saxta sorğular göndərmək, başqasının adına
              hərəkət etmək və platformanın təhlükəsizliyini pozmağa cəhd etmək
              yolverilməzdir.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              4. Rentgen mərkəzlərinin öhdəlikləri
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Platformada profil yaradan rentgen mərkəzləri təqdim etdikləri
              məlumatların (ünvan, əlaqə nömrələri, xidmətlər və iş saatları)
              doğruluğuna görə məsuliyyət daşıyır. Mərkəzlər müvafiq fəaliyyət
              icazələrinə malik olmalı və göstərdikləri xidmətləri qüvvədə olan
              tələblərə uyğun həyata keçirməlidir. Platforma profil məlumatlarını
              yoxlaya bilər, lakin mərkəzlərin fəaliyyətinə zəmanət vermir.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              5. Məzmun və əqli mülkiyyət
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Platformadakı dizayn, mətnlər, loqo, proqram təminatı və digər
              materiallar Rentgen.az-a və ya müvafiq hüquq sahiblərinə məxsusdur və
              əqli mülkiyyət qanunvericiliyi ilə qorunur. Bu materialların icazəsiz
              kopyalanması, yayılması və ya kommersiya məqsədilə istifadəsi
              qadağandır. Mərkəzlərin təqdim etdiyi məzmuna görə müvafiq mərkəzlər
              cavabdehdir.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              6. Tibbi məsuliyyət açıqlaması
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Platformada yer alan məlumatlar yalnız ümumi məlumatlandırma
              məqsədi daşıyır və ixtisaslı həkimin məsləhətini, müayinəsini və ya
              müalicəsini əvəz etmir. Hər hansı sağlamlıq qərarı qəbul etməzdən
              əvvəl mütləq həkiminizlə məsləhətləşin. Müayinə növü və onun zəruriliyi
              barədə qərarı yalnız klinik göstərişlərə əsasən həkim verir.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              7. Məsuliyyətin məhdudlaşdırılması
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Rentgen.az mərkəzlər və istifadəçilər arasında əlaqə vasitəsi rolunu
              oynayır. Müayinənin keyfiyyətinə, nəticələrinə və mərkəzlər tərəfindən
              göstərilən xidmətlərə görə platforma cavabdeh deyil. Ödəniş və müayinə
              birbaşa seçdiyiniz mərkəzdə həyata keçirilir; platforma bu
              əməliyyatların tərəfi deyil. Qanunla icazə verilən maksimum həddə,
              platformadan istifadə nəticəsində yaranan dolayı zərərlərə görə
              məsuliyyət daşımırıq.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              8. Şərtlərdə dəyişikliklər
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Bu istifadə şərtləri vaxtaşırı yenilənə bilər. Dəyişikliklər bu
              səhifədə dərc olunduğu andan qüvvəyə minir. Platformadan istifadəni
              davam etdirməklə yenilənmiş şərtləri qəbul etmiş sayılırsınız.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              9. Tətbiq olunan qanun
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Bu şərtlər Azərbaycan Respublikasının qanunvericiliyinə uyğun
              tənzimlənir və şərh olunur. Platformadan istifadə ilə bağlı yarana
              biləcək mübahisələr Azərbaycan Respublikasının səlahiyyətli
              məhkəmələrində həll edilir.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              10. Əlaqə
            </h2>
            <p className="text-slate-600 leading-relaxed">
              İstifadə şərtləri ilə bağlı suallarınız üçün bizimlə e-poçt
              vasitəsilə əlaqə saxlaya bilərsiniz:{" "}
              <a
                href="mailto:info@rentgen.az"
                className="font-medium text-brand-600 hover:underline"
              >
                info@rentgen.az
              </a>
              .
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
