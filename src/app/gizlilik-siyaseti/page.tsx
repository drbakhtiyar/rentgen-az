import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { JsonLd } from "@/components/ui/json-ld";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Gizlilik siyasəti",
  description:
    "Rentgen.az platformasının gizlilik siyasəti: hansı məlumatların toplandığı, telefon nömrəsi və OTP kodların necə işləndiyi, məlumatların qorunması və istifadəçi hüquqları.",
  path: "/gizlilik-siyaseti",
  keywords: ["gizlilik siyasəti", "şəxsi məlumatların qorunması", "Rentgen.az"],
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana səhifə", path: "/" },
          { name: "Gizlilik siyasəti", path: "/gizlilik-siyaseti" },
        ])}
      />
      <PageHeader
        eyebrow="Hüquqi"
        title="Gizlilik siyasəti"
        description="Bu siyasət Rentgen.az platformasından istifadə zamanı şəxsi məlumatlarınızın necə toplandığını, işləndiyini və qorunduğunu izah edir."
        breadcrumbs={[
          { name: "Ana səhifə", href: "/" },
          { name: "Gizlilik siyasəti" },
        ]}
      />
      <Section>
        <Container>
          <div className="max-w-3xl">
            <p className="text-slate-600 leading-relaxed">
              Rentgen.az (bundan sonra “platforma”) istifadəçilərin
              məxfiliyinə hörmət edir və şəxsi məlumatların qorunmasına önəm
              verir. Bu gizlilik siyasəti platformadan istifadə zamanı hansı
              məlumatların toplandığını və necə istifadə olunduğunu təsvir edir.
              Platformadan istifadə etməklə bu siyasətin şərtlərini qəbul etmiş
              olursunuz.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              1. Toplanan məlumatlar
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Platformadan istifadə zamanı sizdən aşağıdakı məlumatları toplaya
              bilərik: ad, telefon nömrəsi, şəhər və ya rayon, eləcə də sorğu
              göndərərkən könüllü olaraq qeyd etdiyiniz əlavə məlumatlar (məsələn,
              maraqlandığınız xidmət növü). Bundan əlavə, texniki məlumatlar
              (brauzer növü, cihaz və IP ünvanı kimi log məlumatları) avtomatik
              qeydə alına bilər.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              2. Telefon nömrəsi və OTP kodların işlənməsi
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Qeydiyyat və giriş parol olmadan, birdəfəlik təsdiq kodu (OTP)
              vasitəsilə həyata keçirilir. Telefon nömrənizi daxil etdikdə SMS
              ilə təsdiq kodu göndərilir. OTP kodları yalnız təsdiq prosesi üçün
              istifadə olunur, məhdud müddət ərzində etibarlıdır və müddət
              bitdikdən sonra etibarsız sayılır. Telefon nömrəniz hesabınızın
              əsas identifikatoru kimi saxlanılır.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              3. Məlumatların istifadə məqsədi
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Topladığımız məlumatlardan aşağıdakı məqsədlərlə istifadə edirik:
              hesabınızı yaratmaq və idarə etmək, OTP vasitəsilə kimliyinizi
              təsdiqləmək, göndərdiyiniz sorğuları müvafiq rentgen mərkəzlərinə
              ötürmək, sizinlə əlaqə saxlamaq, platformanın funksionallığını
              təmin etmək və xidmət keyfiyyətini yaxşılaşdırmaq.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              4. Məlumatların üçüncü tərəflərlə paylaşılması
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Şəxsi məlumatlarınızı satmırıq. Məlumatlar yalnız xidmətin təmin
              edilməsi üçün zəruri olan tərəflərlə paylaşıla bilər: təsdiq
              kodlarının göndərilməsi üçün SMS provayderi, platformanın işləməsi
              üçün hosting və infrastruktur xidmətləri, eləcə də sorğu
              göndərdiyiniz rentgen mərkəzləri. Bu tərəflər məlumatları yalnız
              təyin olunmuş məqsədlər üçün emal edir. Qanunla tələb olunduqda
              məlumatlar səlahiyyətli orqanlara açıqlana bilər.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              5. Məlumatların saxlanması və qorunması
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Məlumatlarınızın icazəsiz əldə edilməsinin, dəyişdirilməsinin və ya
              məhv edilməsinin qarşısını almaq üçün texniki və təşkilati tədbirlər
              tətbiq edirik. Məlumatlar yalnız bu siyasətdə qeyd olunan məqsədlər
              üçün zəruri olan müddət ərzində saxlanılır. İnternet üzərindən heç
              bir ötürülmə üsulunun tam təhlükəsizliyini zəmanət vermək mümkün
              olmasa da, məlumatlarınızı qorumaq üçün ağlabatan səylər göstəririk.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              6. İstifadəçi hüquqları
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Sizin haqqınızda saxlanılan şəxsi məlumatlara baxmaq, onları
              düzəltmək və ya silinməsini tələb etmək hüququnuz var. Hesabınızın
              silinməsini istəyə və ya məlumatlarınızın emalı ilə bağlı sual verə
              bilərsiniz. Bu hüquqlardan istifadə etmək üçün aşağıda göstərilən
              əlaqə kanalları vasitəsilə bizimlə əlaqə saxlaya bilərsiniz.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              7. Cookie və oxşar texnologiyalar
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Platforma düzgün işləməsi, sessiyanın saxlanması və istifadə
              təcrübəsinin yaxşılaşdırılması üçün cookie (kukilər) və oxşar
              texnologiyalardan istifadə edə bilər. Brauzerinizin tənzimləmələri
              vasitəsilə kukiləri idarə edə və ya söndürə bilərsiniz; lakin bu
              halda platformanın bəzi funksiyaları məhdudlaşa bilər.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              8. Siyasətdə dəyişikliklər
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Bu gizlilik siyasəti vaxtaşırı yenilənə bilər. Dəyişikliklər bu
              səhifədə dərc olunduğu andan etibarən qüvvəyə minir. Platformadan
              istifadəni davam etdirməklə yenilənmiş siyasəti qəbul etmiş
              olursunuz. Mütəmadi olaraq bu səhifəni nəzərdən keçirməyinizi tövsiyə
              edirik.
            </p>

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              9. Əlaqə
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Gizlilik siyasəti ilə bağlı suallarınız və ya sorğularınız üçün
              bizimlə e-poçt vasitəsilə əlaqə saxlaya bilərsiniz:{" "}
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
