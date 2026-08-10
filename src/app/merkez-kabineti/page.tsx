import type { Metadata } from "next";
import {
  KeyRound,
  Smartphone,
  MessageSquareText,
  Inbox,
  ListChecks,
  Banknote,
  Clock,
  ImageIcon,
  Star,
  ShieldCheck,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { PLATFORM_WHATSAPP_DISPLAY, PLATFORM_WHATSAPP_URL } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Mərkəz kabineti — səhifənizi özünüz idarə edin",
  description:
    "Mərkəziniz artıq rentgen.az-dadır. Pulsuz kabinetlə pasiyent sorğularını qəbul edin, xidmət və qiymətlərinizi yeniləyin, foto əlavə edin. Giriş parolsuzdur — telefon + SMS kod.",
  path: "/merkez-kabineti",
});

/**
 * Kabinet aktivləşdirmə kampaniyasının eniş səhifəsi (istifadəçi istəyi:
 * "mesajda VƏ səhifədə geniş izah edin — girməyin rahat yolları, nə verir").
 * WhatsApp kabinet dəvəti mesajları bura yönləndirir.
 */
export default function CabinetLandingPage() {
  const benefits = [
    {
      icon: <Inbox className="h-5 w-5" />,
      title: "Pasiyent sorğuları bir yerdə",
      text: "Saytdan gələn müraciətləri anında görün, statusunu dəyişin (yeni → əlaqə saxlanıldı → tamamlandı) — pasiyent avtomatik məlumatlandırılır.",
    },
    {
      icon: <ListChecks className="h-5 w-5" />,
      title: "Xidmət siyahınız öz əlinizdə",
      text: "Göstərdiyiniz xidmətləri özünüz seçin — artığı silin, yenisini əlavə edin. Dəqiq siyahı pasiyentə inam verir.",
    },
    {
      icon: <Banknote className="h-5 w-5" />,
      title: "Qiymətlər anında yenilənir",
      text: "Qiyməti görünən mərkəzlər axtarışda önə çıxır və qiymət müqayisəsində iştirak edir — pasiyent zəng etmədən sizi seçir.",
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "İş qrafiki və “indi açıqdır”",
      text: "Həftəlik iş saatlarınızı qeyd edin — kartınızda canlı “açıq/bağlı” statusu görünür.",
    },
    {
      icon: <ImageIcon className="h-5 w-5" />,
      title: "Foto və loqo",
      text: "Loqonuzu, binanın və cihazların fotolarını əlavə edin — vizual kart müraciəti nəzərəçarpacaq artırır.",
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: "Rəylərə cavab",
      text: "Pasiyent rəylərini görün və mərkəz adından rəsmi cavab yazın — bu, Google reytinqinizlə yanaşı göstərilir.",
    },
  ];

  return (
    <>
      <Section className="bg-surface">
        <Container className="max-w-3xl text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <KeyRound className="h-7 w-7" />
          </span>
          <h1 className="font-display mt-5 text-3xl font-bold text-ink-900 sm:text-4xl">
            Mərkəziniz artıq rentgen.az-dadır — kabinetə sahiblənin
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            Səhifənizə pasiyentlər hər gün baxır. Pulsuz idarəetmə kabineti ilə o
            səhifəni özünüz idarə edin: sorğuları qəbul edin, qiymətləri yeniləyin,
            kartınızı zənginləşdirin. Heç bir ödəniş, heç bir öhdəlik yoxdur.
          </p>
        </Container>
      </Section>

      <Section>
        <Container className="max-w-3xl">
          <Card className="p-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink-900">
              <Smartphone className="h-5 w-5 text-brand-500" /> Giriş 30 saniyə çəkir — parol yoxdur
            </h2>
            <ol className="mt-4 space-y-3">
              {[
                <>“<strong>Giriş</strong>” səhifəsində <strong>Mərkəz</strong> bölməsini seçin;</>,
                <>kartınızdakı <strong>telefon nömrənizi</strong> yazın — həmin nömrəyə birdəfəlik <strong>SMS kod</strong> gələcək;</>,
                <>kodu daxil edin — kabinetdəsiniz. Parol yoxdur, yadda saxlamalı heç nə yoxdur.</>,
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ButtonLink href="/giris">Kabinetə daxil ol</ButtonLink>
              <span className="text-xs text-slate-500">
                SMS yalnız AZ mobil nömrələrinə gəlir. Kartınızda şəhər nömrəsi
                qeyd olunubsa, bizə WhatsApp-la mobil nömrənizi yazın — kartınıza əlavə edək.
              </span>
            </div>
          </Card>

          <h2 className="font-display mt-10 text-xl font-bold text-ink-900">
            Kabinet sizə nə verir?
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {benefits.map((b) => (
              <Card key={b.title} className="p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  {b.icon}
                </span>
                <h3 className="mt-3 text-sm font-bold text-ink-900">{b.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{b.text}</p>
              </Card>
            ))}
          </div>

          <Card className="mt-8 p-6 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              <strong>Niyə vacibdir?</strong> Kartı dolu olan mərkəzlər — qiymətli,
              qrafikli, fotolu — axtarışda önə çıxır, pasiyent suallarını zəngsiz
              cavablandırır və daha çox müraciət alır. Bunu sizin yerinizə heç kim
              sizin qədər dəqiq edə bilməz.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/giris">İndi başla</ButtonLink>
              <a
                href={PLATFORM_WHATSAPP_URL}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <MessageSquareText className="h-4 w-4" />
                Sual var? WhatsApp: {PLATFORM_WHATSAPP_DISPLAY}
              </a>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
