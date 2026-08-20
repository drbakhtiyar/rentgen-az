import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPacsToken } from "@/lib/pacs";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * PACS AI qaralama: pacs.rentgen.az auth servisi görüntüləri (JPEG data-url)
 * və tədqiqat kontekstini göndərir; biz Claude vision ilə İLKİN TƏSVİR
 * QARALAMASI qaytarırıq. Diaqnoz DEYİL — hər cavab həkim təsdiqi tələb edir.
 * Auth: PACS shared-secret ilə imzalanmış qısamüddətli servis tokeni
 * (Authorization: Bearer <token>) — brauzerdən birbaşa çağırılmır.
 * Pasiyent adı BİZƏ GƏLMİR və Anthropic-ə GÖNDƏRİLMİR (yalnız yaş/cins/modallıq).
 */

const SYSTEM = `Sən rentgen.az PACS sistemində radioloji görüntülər üzrə köməkçi süni intellektsən. Sənə tibbi görüntünün ekran görüntüləri (kəsimlər, bəzən MPR müstəviləri) verilir.

VƏZİFƏN: həkim üçün İLKİN TƏSVİR QARALAMASI hazırlamaq — diaqnoz qoymaq YOX.

QAYDALAR:
- Azərbaycan dilində, radioloji terminologiya ilə yaz.
- Yalnız görüntüdə AYDIN görünəni təsvir et. Əmin olmadığın halda "qeyri-müəyyən", "istisna edilə bilməz" kimi ehtiyatlı ifadə işlət.
- İncə tapıntılar (erkən karies, xırda qırıq, zərif dəyişikliklər) barədə qəti fikir SÖYLƏMƏ — bunlar tam seriyada həkim baxışı tələb edir.
- Ölçü demə (ekran görüntüsündən dəqiq mm çıxarmaq olmur); mövqeyi anatomik təsvir et.
- Struktur:
  **Texniki keyfiyyət:** (görüntünün əhatəsi, artefaktlar)
  **Təsvir:** (görünən strukturlar, vəziyyətləri)
  **Diqqət çəkən sahələr:** (varsa; yoxdursa "aşkar patoloji dəyişiklik seçilmir")
  **Qeyd:** (məhdudiyyətlər — neçə kəsim görürsən, nə qiymətləndirilə bilmir)
- Həkim əlavə sual verə bilər — sualına konkret, qısa cavab ver (əvvəlki görüntülər kontekstdədir).
- Həkim QIRMIZI düzbucaqlı ilə sahə seçibsə: yalnız o nahiyəyə fokuslan; anatomik lokalizasiya → görünən dəyişiklik → ehtimal olunan izah → nə istisna edilməlidir. MPR müstəviləri verilibsə hər üçündə yoxla və uyğunluğu şərh et.
- İlk qaralamada sonda MÜTLƏQ bu sətri yaz (qısa cavablarda təkrarlamaya bilərsən, amma qeyri-müəyyən tapıntı şərhlərində yenə yaz): "⚠️ Bu, AI tərəfindən hazırlanmış ilkin qaralamadır, diaqnoz deyil. Yekun rəy üçün həkim bütün seriyaya baxıb təsdiqləməlidir."
- Qısa saxla: 150-300 söz.`;

type Part = { type: "text"; text?: string } | { type: "image"; dataUrl?: string };
type Body = {
  images?: string[]; // köhnə format (tək sorğu)
  messages?: { role: "user" | "assistant"; content: Part[] }[]; // çat formatı
  context?: { modality?: string; studyDesc?: string; seriesDesc?: string; age?: string; sex?: string; sliceInfo?: string };
};

function imagePart(dataUrl: string): { ok: true; block: unknown } | { ok: false } {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/") || dataUrl.length > 2_500_000) return { ok: false };
  const comma = dataUrl.indexOf(",");
  const mt = dataUrl.slice(0, comma).match(/^data:(image\/\w+);base64$/);
  if (!mt) return { ok: false };
  return { ok: true, block: { type: "image", source: { type: "base64", media_type: mt[1], data: dataUrl.slice(comma + 1) } } };
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const payload = verifyPacsToken(token);
  if (!payload) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const rl = await rateLimit("pacs:ai", payload.sub, 10, 300);
  if (!rl.allowed) return NextResponse.json({ ok: false, error: "Çox sayda sorğu — bir neçə dəqiqə sonra yenidən cəhd edin." }, { status: 429 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, error: "AI aktivləşdirilməyib (ANTHROPIC_API_KEY yoxdur)" }, { status: 503 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu" }, { status: 400 });
  }
  const ctx = body.context ?? {};
  const ctxLines = [
    ctx.modality && `Modallıq: ${ctx.modality}`,
    ctx.studyDesc && `Tədqiqat: ${ctx.studyDesc}`,
    ctx.seriesDesc && `Seriya: ${ctx.seriesDesc}`,
    ctx.age && `Yaş: ${ctx.age}`,
    ctx.sex && `Cins: ${ctx.sex}`,
    ctx.sliceInfo && `Kəsimlər: ${ctx.sliceInfo}`,
  ]
    .filter(Boolean)
    .join("\n");

  // Mesajları qur: ya çat tarixçəsi (messages), ya köhnə tək-sorğu (images)
  let anthMessages: { role: "user" | "assistant"; content: unknown }[] = [];
  let totalImages = 0;
  if (Array.isArray(body.messages) && body.messages.length) {
    const msgs = body.messages.slice(-12);
    for (const m of msgs) {
      if (m.role !== "user" && m.role !== "assistant") continue;
      const parts: unknown[] = [];
      for (const p of (m.content ?? []).slice(0, 8)) {
        if (p.type === "text" && typeof p.text === "string" && p.text.trim()) {
          parts.push({ type: "text", text: p.text.slice(0, 4000) });
        } else if (p.type === "image" && m.role === "user" && p.dataUrl) {
          const r = imagePart(p.dataUrl);
          if (!r.ok) return NextResponse.json({ ok: false, error: "Görüntü formatı yanlışdır" }, { status: 400 });
          totalImages++;
          if (totalImages <= 12) parts.push(r.block);
        }
      }
      if (parts.length) anthMessages.push({ role: m.role, content: parts });
    }
    if (!anthMessages.length || anthMessages[0].role !== "user") {
      return NextResponse.json({ ok: false, error: "Yanlış söhbət formatı" }, { status: 400 });
    }
    // Konteksti ilk user mesajına əlavə et
    (anthMessages[0].content as unknown[]).push({ type: "text", text: `\n[Kontekst]\n${ctxLines || "—"}` });
  } else {
    const images = (body.images ?? []).slice(0, 6);
    if (!images.length) return NextResponse.json({ ok: false, error: "Görüntü yoxdur" }, { status: 400 });
    const content: unknown[] = [];
    for (const im of images) {
      const r = imagePart(im);
      if (!r.ok) return NextResponse.json({ ok: false, error: "Görüntü formatı yanlışdır" }, { status: 400 });
      content.push(r.block);
      totalImages++;
    }
    content.push({ type: "text", text: `${ctxLines || "Kontekst verilməyib."}\n\nBu görüntülər üzrə ilkin təsvir qaralaması hazırla.` });
    anthMessages = [{ role: "user", content }];
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-5",
        max_tokens: 2000,
        system: SYSTEM,
        messages: anthMessages,
      }),
    });
    if (!res.ok) {
      console.error("[pacs-ai] API error:", res.status, await res.text().catch(() => ""));
      return NextResponse.json({ ok: false, error: "AI hazırda cavab verə bilmir. Bir azdan yenidən cəhd edin." }, { status: 502 });
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[]; stop_reason?: string };
    const draft = (data.content ?? [])
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (!draft) return NextResponse.json({ ok: false, error: "Cavab alınmadı" }, { status: 502 });

    await prisma.adminActionLog
      .create({
        data: {
          adminId: payload.sub.length > 20 ? payload.sub : null,
          action: "pacs:ai",
          targetType: "PacsStudy",
          targetId: payload.study ?? ctx.studyDesc ?? "-",
          meta: { role: payload.role, images: totalImages, turns: anthMessages.length, modality: ctx.modality ?? null },
        },
      })
      .catch(() => null);

    return NextResponse.json({ ok: true, draft });
  } catch (e) {
    console.error("[pacs-ai] failed:", (e as Error).message);
    return NextResponse.json({ ok: false, error: "AI hazırda cavab verə bilmir." }, { status: 502 });
  }
}
