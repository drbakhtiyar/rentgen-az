import type { Locale } from "@/lib/i18n";

/** One fixed FAQ question. Questions are bilingual (chrome); answers are entered
 *  per-center by the center itself (free text, kept in AZ). */
export type CenterFaqQuestion = {
  key: string;
  az: string;
  ru: string;
  /** Example hint shown in the editor placeholder (not on the public page). */
  hint?: { az: string; ru: string };
};

/** The fixed catalogue of questions. Add new ones here — everything else
 *  (editor, public accordion, JSON-LD) picks them up automatically. */
export const CENTER_FAQ_QUESTIONS: CenterFaqQuestion[] = [
  {
    key: "services",
    az: "Bu mərkəzdə hansı rentgen və görüntüləmə xidmətləri göstərilir?",
    ru: "Какие рентген- и визуализационные услуги предоставляет этот центр?",
  },
  {
    key: "resultsTime",
    az: "Müayinənin nəticələri orta hesabla nə qədər müddətə hazır olur?",
    ru: "Как быстро в среднем готовы результаты обследования?",
  },
  {
    key: "booking",
    az: "Müayinə üçün əvvəlcədən qeydiyyat vacibdirmi?",
    ru: "Нужна ли предварительная запись на обследование?",
  },
  {
    key: "payment",
    az: "Hansı ödəniş üsulları qəbul edilir?",
    ru: "Какие способы оплаты принимаются?",
    hint: {
      az: "Nağd, Kart, Apple Pay, Google Pay və s.",
      ru: "Наличные, карта, Apple Pay, Google Pay и т.д.",
    },
  },
  {
    key: "children",
    az: "Uşaqlar üçün görüntüləmə xidməti göstərilirmi?",
    ru: "Предоставляется ли визуализация для детей?",
  },
  {
    key: "parking",
    az: "Mərkəzdə avtomobil saxlamaq üçün parkinq imkanı varmı?",
    ru: "Есть ли парковка у центра?",
  },
  {
    key: "accessibility",
    az: "Əlillər və hərəkət məhdudiyyətli şəxslər üçün giriş uyğundurmu?",
    ru: "Доступен ли вход для людей с инвалидностью и ограниченной подвижностью?",
  },
  {
    key: "resultFormat",
    az: "Müayinə nəticələri hansı formada təqdim olunur?",
    ru: "В каком виде выдаются результаты обследования?",
    hint: {
      az: "Film, CD, USB, PDF, E-mail, Online görüntü və s.",
      ru: "Плёнка, CD, USB, PDF, e-mail, онлайн-просмотр и т.д.",
    },
  },
  {
    key: "devices",
    az: "Bu mərkəzdə istifadə olunan əsas cihazlar hansılardır?",
    ru: "Какое основное оборудование используется в этом центре?",
    hint: {
      az: "Planmeca, Vatech, Carestream, NewTom və s.",
      ru: "Planmeca, Vatech, Carestream, NewTom и т.д.",
    },
  },
  {
    key: "preparation",
    az: "Pasiyentin müayinədən əvvəl bilməli olduğu xüsusi hazırlıq varmı?",
    ru: "Есть ли особая подготовка, о которой пациент должен знать перед обследованием?",
  },
];

export const CENTER_FAQ_KEYS = CENTER_FAQ_QUESTIONS.map((q) => q.key);

export function faqQuestionText(q: CenterFaqQuestion, locale: Locale): string {
  return locale === "ru" ? q.ru : q.az;
}

/** Safely coerce the stored JSON into a `{ key: answer }` map (known keys only). */
export function parseFaqAnswers(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!value || typeof value !== "object") return out;
  const src = value as Record<string, unknown>;
  for (const key of CENTER_FAQ_KEYS) {
    const v = src[key];
    if (typeof v === "string" && v.trim()) out[key] = v.trim();
  }
  return out;
}

export type AnsweredFaq = { key: string; question: string; answer: string };

/** Only the questions that have a non-empty answer, in catalogue order. */
export function answeredFaq(value: unknown, locale: Locale): AnsweredFaq[] {
  const answers = parseFaqAnswers(value);
  return CENTER_FAQ_QUESTIONS.filter((q) => answers[q.key]).map((q) => ({
    key: q.key,
    question: faqQuestionText(q, locale),
    answer: answers[q.key],
  }));
}
