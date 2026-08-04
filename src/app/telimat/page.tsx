import type { Metadata } from "next";
import Link from "next/link";
import {
  LogIn,
  Building2,
  ListChecks,
  Users,
  FileUp,
  Star,
  Stethoscope,
  Wallet,
  CalendarDays,
  MessageCircle,
  Banknote,
  CheckCircle2,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-static";

/**
 * Mərkəzlər üçün GİZLİ istifadə təlimatı.
 *
 * Saytda heç yerdən keçid YOXDUR (istifadəçi qərarı, 2026-08-04): naviqasiyada,
 * footer-də, sitemap-da görünmür; noIndex + robots disallow. Linki yalnız
 * birbaşa paylaşırıq — WhatsApp kampaniyası, Nərminin zəngləri, bot cavabları.
 */
export const metadata: Metadata = buildMetadata({
  title: "Mərkəzlər üçün istifadə təlimatı",
  noIndex: true,
});

const TOC = [
  { id: "giris", label: "Sistemə giriş" },
  { id: "profil", label: "Profilin doldurulması" },
  { id: "xidmetler", label: "Xidmətlər və qiymətlər" },
  { id: "muracietler", label: "Pasiyent müraciətləri" },
  { id: "fayllar", label: "Rentgen fayllarının yüklənməsi" },
  { id: "reyler", label: "Rəylər" },
  { id: "hekimler", label: "Həkim əməkdaşlığı" },
  { id: "paketler", label: "Paketlər və balans" },
  { id: "crm", label: "CRM (Platinum)" },
  { id: "destek", label: "Dəstək" },
];

function Block({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
    <Card className="p-6 sm:p-8">
      <h2 className="font-display flex items-center gap-3 text-xl font-bold text-ink-900">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </span>
        {title}
      </h2>
      <div className="prose-sm mt-4 space-y-3 text-[15px] leading-relaxed text-slate-600 [&_strong]:text-ink-900">
        {children}
      </div>
    </Card>
    </section>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
        {n}
      </span>
      <span>{children}</span>
    </p>
  );
}

export default function TelimatPage() {
  return (
    <Section className="bg-surface py-12 sm:py-16">
      <Container className="max-w-3xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            rentgen.az · mərkəzlər üçün
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold text-ink-900">
            Sistemdən istifadə təlimatı
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
            Bu səhifə rentgen.az-da qeydiyyatda olan mərkəzlər üçündür — panelin bütün
            imkanları addım-addım izah olunur. Sualınız qalsa, aşağıdakı{" "}
            <a href="#destek" className="font-semibold text-brand-600">Dəstək</a> bölməsinə baxın.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {TOC.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-700"
              >
                {t.label}
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <Block id="giris" icon={<LogIn />} title="Sistemə giriş">
            <Step n={1}>
              <Link href="/giris" className="font-semibold text-brand-600">rentgen.az/giris</Link>{" "}
              səhifəsini açın və <strong>«Mərkəz»</strong> bölməsini seçin.
            </Step>
            <Step n={2}>
              Mərkəzin telefon nömrəsini yazın — sistemə SMS kod gələcək. Kodu daxil edin, giriş tamamlandı.
              Şifrə yoxdur və lazım deyil.
            </Step>
            <p>
              <strong>Vacib:</strong> SMS yalnız Azərbaycan <strong>mobil</strong> nömrələrinə gəlir
              (010, 050, 051, 055, 060, 070, 077, 099). Kartınızda yalnız şəhər nömrəsi
              qeydiyyatdadırsa, bizə WhatsApp-la mobil nömrənizi bildirin — kartınıza əlavə edək,
              köhnə şəhər nömrəniz də saxlanılacaq.
            </p>
          </Block>

          <Block id="profil" icon={<Building2 />} title="Profilin doldurulması">
            <p>
              Panel → <strong>Profil</strong>. Dolğun kart pasiyentdə etibar yaradır və siyahıda
              daha yaxşı görünür. Doldurun:
            </p>
            <p>• <strong>Bina şəkilləri və loqo</strong> — pasiyent mərkəzi tanısın;</p>
            <p>• <strong>İş saatları</strong> — səhifənizdə «indi açıqdır/bağlıdır» avtomatik görünür;</p>
            <p>• <strong>Ünvan və xəritə nöqtəsi</strong> — Google Maps linkini yapışdırmaq kifayətdir, koordinatları sistem özü çıxarır;</p>
            <p>
              • <strong>Google reytinqi</strong> — biznesinizin adını və ya Maps linkini yazın,
              sistem Google reytinqinizi çəkib səhifənizdə göstərir və hər gün avtomatik yeniləyir.
            </p>
          </Block>

          <Block id="xidmetler" icon={<ListChecks />} title="Xidmətlər və qiymətlər">
            <p>
              Panel → <strong>Xidmətlər</strong>. Yalnız real göstərdiyiniz müayinələri seçin —
              kateqoriyalar üzrə bölünüb, axtarış var. Hər seçilmiş xidmətə <strong>qiymət</strong> yazılır.
            </p>
            <p>
              <strong>Qiymət niyə vacibdir:</strong> pasiyentlər «qiymətə görə sırala» funksiyasından
              istifadə edir — orada yalnız qiyməti olan mərkəzlər görünür. Qiyməti olan kart zəng
              gözləmədən müraciət alır.
            </p>
            <p>
              Sizə WhatsApp-la göndərdiyimiz <strong>xüsusi link</strong> (rentgen.az/q/…) ilə
              qiymətləri girişsiz, 1 dəqiqəyə də yaza bilərsiniz — yazdıqlarınız dərhal saytda görünür.
            </p>
          </Block>

          <Block id="muracietler" icon={<Users />} title="Pasiyent müraciətləri">
            <p>
              Pasiyent saytdan müraciət göndərəndə panelin <strong>Pasiyentlər</strong> bölməsinə düşür,
              sizə bildiriş gəlir. Status axını:
            </p>
            <p>
              <strong>Yeni → Əlaqə saxlanıb → Tamamlandı</strong> (və ya Ləğv). Statusu dəyişdikcə
              pasiyentə avtomatik məlumat gedir.
            </p>
            <p>
              <strong>«Tamamlandı»</strong> işarələməyi unutmayın — bundan sonra pasiyentə rəy dəvəti
              göndərilir və nəticə faylını yükləyə bilirsiniz.
            </p>
          </Block>

          <Block id="fayllar" icon={<FileUp />} title="Rentgen fayllarının yüklənməsi">
            <p>
              Tamamlanmış müraciətə müayinə faylını (DICOM, şəkil, PDF, RAR/ZIP) yükləyin —
              pasiyent öz kabinetində görür və endirir; tomoqrafiyanı brauzerdə 3D formatda aça bilir.
            </p>
            <p>
              Pasiyenti həkim göndəribsə, təsdiqlənmiş partnyor həkim də nəticəni öz panelində görür —
              disk daşımağa ehtiyac qalmır.
            </p>
          </Block>

          <Block id="reyler" icon={<Star />} title="Rəylər">
            <p>
              Müayinə tamamlanandan sonra pasiyentə avtomatik SMS dəvəti gedir — rəy yazır,
              səhifənizdə «təsdiqlənmiş müştəri» nişanı ilə görünür (Gold+ paketlərdə).
            </p>
            <p>
              Hər rəyə <strong>cavab yaza bilərsiniz</strong> — cavablı rəylər etibarı artırır.
              Qəbulda QR plakat da sifariş edə bilərsiniz: pasiyent skan edib yerindəcə rəy yazır.
            </p>
          </Block>

          <Block id="hekimler" icon={<Stethoscope />} title="Həkim əməkdaşlığı">
            <p>
              Panel → <strong>Həkimlər</strong>: partnyorluq istəyi göndərin/qəbul edin. Təsdiqlənmiş
              partnyor həkim pasiyenti birbaşa sizə yönləndirir (Gold+ paketlərdə) və yüklədiyiniz
              nəticələri görür.
            </p>
            <p>
              Öz <strong>QR kodunuzla</strong> istənilən həkimi dəvət edə bilərsiniz — həkim skan edir,
              pasiyent göndərmə forması açılır.
            </p>
          </Block>

          <Block id="paketler" icon={<Wallet />} title="Paketlər və balans">
            <p>• <strong>FREE</strong> — kataloqda tam səhifə, 5 şəkil, ayda 5 müraciət;</p>
            <p>• <strong>SILVER</strong> — limitsiz müraciət, baxış statistikası;</p>
            <p>• <strong>GOLD</strong> — rəylər, həkim göndərişləri, tam analitika, «Tövsiyə olunan» nişanı;</p>
            <p>• <strong>PLATINUM</strong> — hamısı + CRM, banner, API.</p>
            <p>
              Ətraflı: <Link href="/paketler" className="font-semibold text-brand-600">rentgen.az/paketler</Link>.
              Ödəniş panel → <strong>Paket/Balans</strong> bölməsindən kartla (təhlükəsiz Payriff ödənişi):
              əvvəl balans artırılır, sonra paket balansdan alınır.
            </p>
          </Block>

          <Block id="crm" icon={<CalendarDays />} title="CRM (Platinum)">
            <p>
              <strong>crm.rentgen.az</strong> — qəbul təqvimi (gün/həftə/ay, sürüşdürməklə vaxt dəyişmə),
              pasiyent bazası, SMS xatırlatmalar və kampaniyalar, onlayn slot rezervasiyası
              (pasiyent saytdan real boş vaxtları görüb yazılır), asistent girişi və fəaliyyət jurnalı.
            </p>
          </Block>

          <Block id="destek" icon={<MessageCircle />} title="Dəstək">
            <p>
              • Paneldə <strong>Söhbətlər</strong> bölməsində sancaqlı «Dəstək» çatı — birbaşa bizə yazın;
            </p>
            <p>• Oradaca <strong>AI Yardımçı</strong> — sistem suallarına dərhal cavab verir;</p>
            <p>• E-poçt: <strong>info@rentgen.az</strong> · WhatsApp: sizə yazdığımız nömrə.</p>
          </Block>
        </div>

        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
          <p className="text-sm leading-relaxed text-emerald-900">
            <strong>Başlamaq üçün ən vacib üç addım:</strong> profili doldurun (şəkil + iş saatı) →
            xidmətləri real siyahınıza salın → qiymətləri yazın. Bunları edən mərkəzlər
            axtarışda önə çıxır və ilk müraciətlərini daha tez alır.
          </p>
        </div>

        <p className="mt-6 flex items-center gap-2 text-xs text-slate-400">
          <Banknote className="h-3.5 w-3.5" />
          Qeydiyyat, kataloqda yer və qiymət yerləşdirmək tamamilə pulsuzdur.
        </p>
      </Container>
    </Section>
  );
}
