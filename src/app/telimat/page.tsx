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
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
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
  { id: "giris", label: "Giriş" },
  { id: "profil", label: "Profil" },
  { id: "xidmetler", label: "Xidmətlər və qiymətlər" },
  { id: "muracietler", label: "Müraciətlər" },
  { id: "fayllar", label: "Fayllar" },
  { id: "reyler", label: "Rəylər" },
  { id: "hekimler", label: "Həkim əməkdaşlığı" },
  { id: "paketler", label: "Paketlər" },
  { id: "crm", label: "CRM" },
  { id: "destek", label: "Dəstək" },
];

/* ------------------------------------------------------------------ */

function Block({
  id,
  n,
  icon,
  title,
  children,
}: {
  id: string;
  n: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,30,60,0.06)] transition-shadow hover:shadow-[0_10px_35px_-12px_rgba(10,95,240,0.25)]">
        {/* sol vurğu zolağı */}
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-500 to-cyan-400 opacity-70" />
        <div className="p-6 pl-7 sm:p-8 sm:pl-9">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-500 text-white shadow-[0_8px_20px_-8px_rgba(10,95,240,0.6)] [&>svg]:h-5 [&>svg]:w-5">
              {icon}
            </span>
            <div>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-500">
                {n}
              </span>
              <h2 className="font-display text-xl font-bold text-ink-900">{title}</h2>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-slate-600 [&_strong]:font-semibold [&_strong]:text-ink-900">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="relative space-y-0">
      {items.map((item, i) => (
        <div key={i} className="relative flex gap-4 pb-4 last:pb-0">
          {/* birləşdirici xətt */}
          {i < items.length - 1 && (
            <span className="absolute left-[13px] top-7 bottom-0 w-px bg-gradient-to-b from-brand-200 to-transparent" />
          )}
          <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white ring-4 ring-brand-50">
            {i + 1}
          </span>
          <p className="pt-0.5">{item}</p>
        </div>
      ))}
    </div>
  );
}

function Note({ tone, children }: { tone: "warn" | "tip"; children: React.ReactNode }) {
  return (
    <div
      className={
        tone === "warn"
          ? "flex items-start gap-3 rounded-xl border border-amber-200/70 bg-amber-50/80 px-4 py-3.5 text-[14px] leading-relaxed text-amber-900"
          : "flex items-start gap-3 rounded-xl border border-cyan-200/70 bg-cyan-50/60 px-4 py-3.5 text-[14px] leading-relaxed text-cyan-900"
      }
    >
      {tone === "warn" ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      ) : (
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
      )}
      <span className="[&_strong]:font-semibold">{children}</span>
    </div>
  );
}

function Li({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <p className="flex gap-2.5">
      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-brand-500" />
      <span>
        <strong>{title}</strong> — {children}
      </span>
    </p>
  );
}

/* ------------------------------------------------------------------ */

export default function TelimatPage() {
  return (
    <>
      {/* ---------- Tünd hero başlıq ---------- */}
      <div className="relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-40" />
        <div className="glow absolute -left-24 top-0 h-80 w-80 opacity-50" />
        <div className="glow-cyan absolute -right-16 bottom-0 h-72 w-72 opacity-40" />
        <Container className="relative max-w-3xl py-14 sm:py-18">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300/80">
            rentgen.az · mərkəzlər üçün
          </p>
          <h1 className="font-display mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            Sistemdən istifadə{" "}
            <span className="bg-gradient-to-r from-brand-400 to-cyan-300 bg-clip-text text-transparent">
              təlimatı
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-300">
            Panelin bütün imkanları addım-addım. 5 dəqiqəyə oxunur — mərkəzinizi tam gücü ilə işə salır.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {TOC.map((t, i) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className="group flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-sm transition hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:text-cyan-200"
              >
                <span className="font-mono text-[10px] text-cyan-300/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {t.label}
              </a>
            ))}
          </div>
        </Container>
      </div>

      <Section className="bg-surface py-10 sm:py-14">
        <Container className="max-w-3xl">
          <div className="space-y-6">
            <Block id="giris" n="01 · Başlanğıc" icon={<LogIn />} title="Sistemə giriş">
              <Steps
                items={[
                  <>
                    <Link href="/giris" className="font-semibold text-brand-600 hover:text-brand-700">
                      rentgen.az/giris
                    </Link>{" "}
                    səhifəsini açın və <strong>«Mərkəz»</strong> bölməsini seçin.
                  </>,
                  <>
                    Mərkəzin telefon nömrəsini yazın — SMS kod gələcək. Kodu daxil edin, giriş
                    tamamlandı. <strong>Şifrə yoxdur və lazım deyil.</strong>
                  </>,
                ]}
              />
              <Note tone="warn">
                SMS yalnız Azərbaycan <strong>mobil</strong> nömrələrinə gəlir (010, 050, 051, 055,
                060, 070, 077, 099). Kartınızda yalnız şəhər nömrəsi varsa, WhatsApp-la mobil
                nömrənizi bildirin — əlavə edək; köhnə şəhər nömrəniz də saxlanılacaq.
              </Note>
            </Block>

            <Block id="profil" n="02 · Görünüş" icon={<Building2 />} title="Profilin doldurulması">
              <p>
                Panel → <strong>Profil</strong>. Dolğun kart pasiyentdə etibar yaradır və siyahıda
                daha yaxşı görünür:
              </p>
              <Li title="Bina şəkilləri və loqo">pasiyent mərkəzi tanısın;</Li>
              <Li title="İş saatları">səhifənizdə «indi açıqdır / bağlıdır» avtomatik görünür;</Li>
              <Li title="Ünvan və xəritə">
                Google Maps linkini yapışdırmaq kifayətdir — koordinatları sistem özü çıxarır;
              </Li>
              <Li title="Google reytinqi">
                biznesinizin adını və ya Maps linkini yazın — reytinqiniz səhifənizdə görünür və hər
                gün avtomatik yenilənir.
              </Li>
            </Block>

            <Block id="xidmetler" n="03 · Ən vacib addım" icon={<ListChecks />} title="Xidmətlər və qiymətlər">
              <p>
                Panel → <strong>Xidmətlər</strong>. Yalnız real göstərdiyiniz müayinələri seçin —
                kateqoriyalar üzrə bölünüb, axtarış var. Hər seçilmiş xidmətə{" "}
                <strong>qiymət</strong> yazılır.
              </p>
              <Note tone="tip">
                <strong>Qiymət niyə vacibdir:</strong> pasiyentlər «qiymətə görə sırala»
                funksiyasından istifadə edir — orada yalnız qiyməti olan mərkəzlər görünür. Qiyməti
                olan kart zəng gözləmədən müraciət alır.
              </Note>
              <p>
                Sizə WhatsApp-la göndərdiyimiz <strong>xüsusi link</strong> (rentgen.az/q/…) ilə
                qiymətləri girişsiz, 1 dəqiqəyə də yaza bilərsiniz — dərhal saytda görünür.
              </p>
            </Block>

            <Block id="muracietler" n="04 · Gündəlik axın" icon={<Users />} title="Pasiyent müraciətləri">
              <p>
                Pasiyent müraciət göndərəndə panelin <strong>Pasiyentlər</strong> bölməsinə düşür,
                sizə bildiriş gəlir. Status axını:
              </p>
              <div className="flex flex-wrap items-center gap-2 py-1">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200">Yeni</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">Əlaqə saxlanıb</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">Tamamlandı</span>
              </div>
              <p>Statusu dəyişdikcə pasiyentə avtomatik məlumat gedir.</p>
              <Note tone="warn">
                <strong>«Tamamlandı» işarələməyi unutmayın</strong> — bundan sonra pasiyentə rəy
                dəvəti göndərilir və nəticə faylını yükləyə bilirsiniz.
              </Note>
            </Block>

            <Block id="fayllar" n="05 · Nəticələr" icon={<FileUp />} title="Rentgen fayllarının yüklənməsi">
              <p>
                Tamamlanmış müraciətə müayinə faylını (DICOM, şəkil, PDF, RAR/ZIP) yükləyin —
                pasiyent öz kabinetində görür və endirir; tomoqrafiyanı brauzerdə{" "}
                <strong>3D formatda</strong> aça bilir.
              </p>
              <p>
                Pasiyenti həkim göndəribsə, təsdiqlənmiş partnyor həkim də nəticəni öz panelində
                görür — <strong>disk daşımağa ehtiyac qalmır</strong>.
              </p>
            </Block>

            <Block id="reyler" n="06 · Etibar" icon={<Star />} title="Rəylər">
              <p>
                Müayinə tamamlanandan sonra pasiyentə avtomatik SMS dəvəti gedir — rəy yazır,
                səhifənizdə <strong>«təsdiqlənmiş müştəri»</strong> nişanı ilə görünür (Gold+
                paketlərdə).
              </p>
              <p>
                Hər rəyə <strong>cavab yaza bilərsiniz</strong> — cavablı rəylər etibarı artırır.
                Qəbulda QR plakat da sifariş edə bilərsiniz: pasiyent skan edib yerindəcə rəy yazır.
              </p>
            </Block>

            <Block id="hekimler" n="07 · Şəbəkə" icon={<Stethoscope />} title="Həkim əməkdaşlığı">
              <p>
                Panel → <strong>Həkimlər</strong>: partnyorluq istəyi göndərin/qəbul edin.
                Təsdiqlənmiş partnyor həkim pasiyenti birbaşa sizə yönləndirir (Gold+ paketlərdə) və
                yüklədiyiniz nəticələri görür.
              </p>
              <p>
                Öz <strong>QR kodunuzla</strong> istənilən həkimi dəvət edə bilərsiniz — həkim skan
                edir, pasiyent göndərmə forması açılır.
              </p>
            </Block>

            <Block id="paketler" n="08 · İmkanlar" icon={<Wallet />} title="Paketlər və balans">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { name: "FREE", cls: "bg-slate-100 text-slate-600", desc: "kataloqda tam səhifə, 5 şəkil, ayda 5 müraciət" },
                  { name: "SILVER", cls: "bg-slate-200 text-slate-700", desc: "limitsiz müraciət, baxış statistikası" },
                  { name: "GOLD", cls: "bg-amber-100 text-amber-700", desc: "rəylər, həkim göndərişləri, tam analitika, «Tövsiyə olunan» nişanı" },
                  { name: "PLATINUM", cls: "bg-gradient-to-r from-brand-100 to-cyan-100 text-brand-700", desc: "hamısı + CRM, banner, API" },
                ].map((p) => (
                  <div key={p.name} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${p.cls}`}>
                      {p.name}
                    </span>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">{p.desc}</p>
                  </div>
                ))}
              </div>
              <p>
                Ətraflı:{" "}
                <Link href="/paketler" className="font-semibold text-brand-600 hover:text-brand-700">
                  rentgen.az/paketler
                </Link>
                . Ödəniş panel → <strong>Paket/Balans</strong> bölməsindən kartla (təhlükəsiz Payriff
                ödənişi): əvvəl balans artırılır, sonra paket balansdan alınır.
              </p>
            </Block>

            <Block id="crm" n="09 · Platinum" icon={<CalendarDays />} title="CRM sistemi">
              <p>
                <strong>crm.rentgen.az</strong> — qəbul təqvimi (gün/həftə/ay, sürüşdürməklə vaxt
                dəyişmə), pasiyent bazası, SMS xatırlatmalar və kampaniyalar, onlayn slot
                rezervasiyası (pasiyent saytdan real boş vaxtları görüb yazılır), asistent girişi və
                fəaliyyət jurnalı.
              </p>
            </Block>

            <Block id="destek" n="10 · Yanınızdayıq" icon={<MessageCircle />} title="Dəstək">
              <Li title="Panel çatı">Söhbətlər bölməsində sancaqlı «Dəstək» — birbaşa bizə yazın;</Li>
              <Li title="AI Yardımçı">oradaca — sistem suallarına dərhal cavab verir;</Li>
              <Li title="E-poçt">info@rentgen.az · WhatsApp: sizə yazdığımız nömrə.</Li>
            </Block>
          </div>

          {/* ---------- Final: 3 addım ---------- */}
          <div className="relative mt-10 overflow-hidden rounded-2xl bg-ink-950 p-7 text-white sm:p-9">
            <div className="absolute inset-0 bg-grid-dark opacity-30" />
            <div className="glow-cyan absolute -right-10 -top-10 h-48 w-48 opacity-40" />
            <div className="relative">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
                Başlamaq üçün
              </p>
              <h2 className="font-display mt-2 text-2xl font-bold">Ən vacib üç addım</h2>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                {["Profili doldurun — şəkil + iş saatı", "Xidmətləri real siyahınıza salın", "Qiymətləri yazın"].map(
                  (t, i) => (
                    <div key={i} className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur-sm">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-400 text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-200">{t}</span>
                    </div>
                  ),
                )}
              </div>
              <p className="mt-5 text-sm leading-relaxed text-slate-400">
                Bunları edən mərkəzlər axtarışda önə çıxır və ilk müraciətlərini daha tez alır.
                Qeydiyyat, kataloqda yer və qiymət yerləşdirmək{" "}
                <span className="font-semibold text-cyan-300">tamamilə pulsuzdur</span>.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
