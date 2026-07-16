/** Rich SEO content for service landing pages, keyed by service slug. */

export type ServiceContent = {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  intro: string;
  sections: { heading: string; body: string }[];
  benefits: string[];
  whenNeeded: string[];
  faq: { question: string; answer: string }[];
};

type Locale = "az" | "ru";

/** Modality descriptor so auto-generated SEO copy is accurate per exam type. */
type Modality = { word: string; long: string; radiation: string; prep: string };
type ModalityL = { az: Modality; ru: Modality };

function modalityFor(name: string, category: string | undefined, locale: Locale): Modality {
  const c = (category ?? "").toLowerCase();
  const n = name.toLowerCase();
  const pick = (m: ModalityL) => m[locale];
  if (c.includes("mrt") || n.includes("mrt")) {
    return pick({
      az: {
        word: "maqnit-rezonans tomoqrafiya (MRT)",
        long: "güclü maqnit sahəsi ilə orqan və toxumaların yüksək dəqiqlikli görüntülənməsi",
        radiation:
          "MRT-də ionlaşdırıcı şüalanma yoxdur — görüntü maqnit sahəsi və radiotezlik dalğaları ilə alınır. Bədənində metal implant və ya kardiostimulyator olanlar həkimi əvvəlcədən məlumatlandırmalıdır.",
        prep: "Bəzi MRT müayinələri ac qarına və ya kontrast maddə ilə aparıla bilər — mərkəz sizə əvvəlcədən təlimat verəcək.",
      },
      ru: {
        word: "магнитно-резонансная томография (МРТ)",
        long: "высокоточная визуализация органов и тканей с помощью сильного магнитного поля",
        radiation:
          "При МРТ нет ионизирующего излучения — изображение получают с помощью магнитного поля и радиоволн. При наличии металлических имплантов или кардиостимулятора заранее сообщите врачу.",
        prep: "Некоторые МРТ проводятся натощак или с контрастом — центр даст вам инструкции заранее.",
      },
    });
  }
  if (c.includes("usm") || n.includes("usm") || n.includes("doppler")) {
    return pick({
      az: {
        word: "ultrasəs müayinəsi (USM)",
        long: "ultrasəs dalğaları ilə orqan və yumşaq toxumaların real vaxt rejimində görüntülənməsi",
        radiation:
          "USM tamamilə şüalanmasızdır və təhlükəsizdir — hamilələr və uşaqlar üçün də tətbiq olunur.",
        prep: "Qarın USM-i çox vaxt ac qarına, kiçik çanaq USM-i isə dolu sidik kisəsi ilə aparılır — mərkəz dəqiq təlimat verəcək.",
      },
      ru: {
        word: "ультразвуковое исследование (УЗИ)",
        long: "визуализация органов и мягких тканей в реальном времени с помощью ультразвука",
        radiation:
          "УЗИ полностью без излучения и безопасно — применяется в том числе беременным и детям.",
        prep: "УЗИ брюшной полости часто делают натощак, а малого таза — с наполненным мочевым пузырём; центр даст точные инструкции.",
      },
    });
  }
  if (c.includes("kt") || c.includes("kompüter") || n.includes(" kt") || n.includes("angioqraf")) {
    return pick({
      az: {
        word: "kompüter tomoqrafiyası (KT)",
        long: "rentgen şüaları ilə orqanların kəsik-kəsik, üçölçülü görüntülənməsi",
        radiation:
          "KT rentgen şüalarından istifadə edir; müasir aparatlarda doza optimallaşdırılır və müayinə yalnız klinik göstəriş olduqda təyin olunur.",
        prep: "Kontrastlı KT ac qarına aparılır və böyrək göstəriciləri tələb oluna bilər — mərkəz sizi əvvəlcədən yönləndirəcək.",
      },
      ru: {
        word: "компьютерная томография (КТ)",
        long: "послойная, трёхмерная визуализация органов с помощью рентгеновских лучей",
        radiation:
          "КТ использует рентгеновские лучи; на современных аппаратах доза оптимизируется, а исследование назначается только по клиническим показаниям.",
        prep: "КТ с контрастом проводится натощак и может потребовать показателей функции почек — центр направит вас заранее.",
      },
    });
  }
  if (c.includes("mammoqraf") || n.includes("mammoqraf") || n.includes("tomosintez")) {
    return pick({
      az: {
        word: "mammoqrafiya",
        long: "süd vəzilərinin aşağı dozalı rentgen görüntülənməsi",
        radiation:
          "Mammoqrafiyada doza çox aşağıdır; erkən diaqnostikanın faydası şüalanma riskini əhəmiyyətli dərəcədə üstələyir.",
        prep: "Müayinə günü qoltuqaltı və döş nahiyəsinə deodorant, krem və ya pudra çəkməyin.",
      },
      ru: {
        word: "маммография",
        long: "низкодозовая рентгеновская визуализация молочных желёз",
        radiation:
          "При маммографии доза очень низкая; польза ранней диагностики значительно превышает риск облучения.",
        prep: "В день исследования не наносите дезодорант, крем или пудру на область подмышек и груди.",
      },
    });
  }
  if (c.includes("densitometr") || n.includes("dexa") || n.includes("densitometr")) {
    return pick({
      az: {
        word: "sümük densitometriyası (DEXA)",
        long: "sümük mineral sıxlığının aşağı dozalı ölçülməsi",
        radiation:
          "DEXA-da şüalanma dozası adi rentgendən də azdır və müayinə tam ağrısızdır.",
        prep: "Müayinədən əvvəl kalsium əlavələri qəbul etməyin və metal aksesuarları çıxarın.",
      },
      ru: {
        word: "денситометрия костей (DEXA)",
        long: "низкодозовое измерение минеральной плотности костей",
        radiation:
          "При DEXA доза облучения даже ниже, чем при обычном рентгене, а исследование полностью безболезненно.",
        prep: "Перед исследованием не принимайте препараты кальция и снимите металлические аксессуары.",
      },
    });
  }
  if (
    c.includes("floroskop") ||
    n.includes("kontrast") ||
    n.includes("barium") ||
    n.includes("hsg") ||
    n.includes("venoqraf") ||
    n.includes("fistuloqraf")
  ) {
    return pick({
      az: {
        word: "floroskopik (kontrastlı) müayinə",
        long: "kontrast maddə ilə orqanların hərəkətdə, real vaxtda rentgen görüntülənməsi",
        radiation:
          "Floroskopiyada rentgen şüası istifadə olunur; doza nəzarət altındadır və müayinə mütəxəssis nəzarətində aparılır.",
        prep: "Bir çox kontrastlı müayinə ac qarına aparılır — mərkəz sizə hazırlıq təlimatını verəcək.",
      },
      ru: {
        word: "флюороскопическое (контрастное) исследование",
        long: "рентгеновская визуализация органов в движении, в реальном времени, с контрастом",
        radiation:
          "При флюороскопии используется рентген; доза под контролем, исследование проводится под наблюдением специалиста.",
        prep: "Многие контрастные исследования проводятся натощак — центр даст вам инструкции по подготовке.",
      },
    });
  }
  if (c === "dental") {
    return pick({
      az: {
        word: "dental rentgen",
        long: "diş və çənə strukturlarının rəqəmsal rentgen görüntülənməsi",
        radiation:
          "Dental rentgendə doza çox aşağıdır; müasir rəqəmsal aparatlarda şüalanma minimuma endirilir.",
        prep: "Xüsusi hazırlıq tələb olunmur; müayinədən əvvəl metal aksesuarları çıxarmaq kifayətdir.",
      },
      ru: {
        word: "дентальный рентген",
        long: "цифровая рентгеновская визуализация структур зубов и челюсти",
        radiation:
          "При дентальном рентгене доза очень низкая; на современных цифровых аппаратах облучение сведено к минимуму.",
        prep: "Специальная подготовка не требуется; достаточно снять металлические аксессуары перед исследованием.",
      },
    });
  }
  return pick({
    az: {
      word: "rentgen müayinəsi",
      long: "sümük və toxumaların rəqəmsal rentgen görüntülənməsi",
      radiation:
        "Müasir rəqəmsal rentgen aparatlarında şüalanma dozası aşağı və nəzarət altındadır; müayinə yalnız klinik göstəriş olduqda təyin edilir.",
      prep: "Adətən xüsusi hazırlıq tələb olunmur; müayinə nahiyəsindəki metal əşyaları çıxarmaq kifayətdir.",
    },
    ru: {
      word: "рентгеновское исследование",
      long: "цифровая рентгеновская визуализация костей и тканей",
      radiation:
        "На современных цифровых рентген-аппаратах доза облучения низкая и под контролем; исследование назначается только по клиническим показаниям.",
      prep: "Обычно специальной подготовки не требуется; достаточно снять металлические предметы в области исследования.",
    },
  });
}

const genericRu = (name: string, m: Modality): ServiceContent => ({
  metaTitle: `${name} — цена и центры в Баку | Rentgen.az`,
  metaDescription: `Проверенные центры в Баку, где можно сделать «${name}». Сравните цены, найдите адрес и контакты, запишитесь напрямую.`,
  keywords: [name, `${name} Баку`, `${name} цена`, m.word, "Баку", "Rentgen.az"],
  intro: `${name} — это метод: ${m.long}. Через Rentgen.az вы найдёте центры в Баку, где делают «${name}», сравните цены и свяжетесь напрямую.`,
  sections: [
    {
      heading: `Что такое «${name}»?`,
      body: `«${name}» — это вид исследования «${m.word}» для решения задачи: ${m.long}. Результаты помогают врачу поставить точный диагноз и спланировать лечение.`,
    },
    {
      heading: `Цена «${name}» в Баку`,
      body: `Цена зависит от центра и оборудования. На Rentgen.az вы можете сравнить цены центров, где делают «${name}», и выбрать подходящий вариант.`,
    },
    {
      heading: "Подготовка и результаты",
      body: m.prep,
    },
  ],
  benefits: [
    "Проверенные центры на одной платформе",
    "Легко сравнить цены",
    "Адрес, контакты и часы работы в одном месте",
    "Возможность записаться напрямую",
  ],
  whenNeeded: [
    "По клиническому направлению врача",
    "Для оценки структур до или после лечения",
    "Для диагностики при жалобах или травме",
  ],
  faq: [
    { question: `«${name}» опасно?`, answer: m.radiation },
    {
      question: `Сколько стоит «${name}» в Баку?`,
      answer:
        "Цена зависит от выбранного центра. На Rentgen.az можно сравнить цены разных центров и выбрать оптимальный вариант.",
    },
    { question: `Нужна ли подготовка к «${name}»?`, answer: m.prep },
  ],
});

const generic = (name: string, category: string | undefined, locale: Locale): ServiceContent => {
  const m = modalityFor(name, category, locale);
  if (locale === "ru") return genericRu(name, m);
  const low = name.toLowerCase();
  return {
    metaTitle: `${name} — Bakıda qiymət və mərkəzlər | Rentgen.az`,
    metaDescription: `${name} xidmətini Bakıda göstərən təsdiqlənmiş mərkəzlər. Qiymətləri müqayisə edin, ünvan və əlaqə məlumatını tapın, birbaşa növbə yazın.`,
    keywords: [name, `${name} Bakı`, `${name} qiyməti`, m.word, "Bakı", "Rentgen.az"],
    intro: `${name} — ${m.long} üsuludur. Rentgen.az vasitəsilə Bakıda ${low} xidməti göstərən mərkəzləri tapa, qiymətləri müqayisə edə və birbaşa əlaqə saxlaya bilərsiniz.`,
    sections: [
      {
        heading: `${name} nədir?`,
        body: `${name} — ${m.long} üçün istifadə olunan ${m.word} növüdür. Nəticələr həkimə dəqiq diaqnoz qoymağa və müalicəni planlaşdırmağa kömək edir.`,
      },
      {
        heading: `Bakıda ${low} qiyməti`,
        body: `Qiymət mərkəzə və avadanlığa görə dəyişir. Rentgen.az-da ${low} xidmətini göstərən mərkəzlərin qiymətlərini yan-yana müqayisə edib özünüzə uyğun olanı seçə bilərsiniz.`,
      },
      {
        heading: "Hazırlıq və nəticələr",
        body: m.prep,
      },
    ],
    benefits: [
      "Təsdiqlənmiş mərkəzlər bir platformada",
      "Qiymətləri asanlıqla müqayisə et",
      "Ünvan, əlaqə və iş saatları bir yerdə",
      "Birbaşa növbə yazma imkanı",
    ],
    whenNeeded: [
      "Həkimin klinik göstərişi olduqda",
      "Müalicədən əvvəl və ya sonra strukturların qiymətləndirilməsi üçün",
      "Şikayət və ya travma zamanı diaqnostika məqsədilə",
    ],
    faq: [
      { question: `${name} təhlükəlidirmi?`, answer: m.radiation },
      {
        question: `Bakıda ${low} qiyməti nə qədərdir?`,
        answer:
          "Qiymət seçdiyiniz mərkəzə görə dəyişir. Rentgen.az-da müxtəlif mərkəzlərin qiymətlərini müqayisə edib ən uyğun variantı seçə bilərsiniz.",
      },
      { question: `${name} üçün hazırlıq lazımdırmı?`, answer: m.prep },
    ],
  };
};

export const SERVICE_CONTENT: Record<string, ServiceContent> = {
  "3d-tomoqrafiya": {
    metaTitle: "3D dental tomoqrafiya Bakı | CBCT mərkəzləri — Rentgen.az",
    metaDescription:
      "Bakıda 3D dental tomoqrafiya (CBCT) xidməti göstərən təsdiqlənmiş mərkəzlər. Çənə və diş strukturlarının üçölçülü dəqiq qiymətləndirilməsi.",
    keywords: [
      "3D tomoqrafiya",
      "diş tomoqrafiyası",
      "çənə tomoqrafiyası",
      "Bakıda dental tomoqrafiya",
      "CBCT Bakı",
    ],
    intro:
      "3D dental tomoqrafiya çənə və diş strukturlarının üçölçülü, yüksək detallı qiymətləndirilməsinə imkan verir. Bu üsul implant planlaması, mürəkkəb çəkilişlər və çənə anatomiyasının analizində həkimin klinik qərar verməsinə dəstək olur.",
    sections: [
      {
        heading: "3D dental tomoqrafiya nədir?",
        body: "3D dental tomoqrafiya (çox vaxt CBCT — konus-şüalı kompüter tomoqrafiya ilə eyni texnologiyaya əsaslanır) diş, çənə sümüyü, sinuslar və sinir kanallarını üç ölçüdə göstərir. Adi iki ölçülü rentgendən fərqli olaraq, strukturları müxtəlif müstəvilərdə qiymətləndirməyə imkan verir.",
      },
      {
        heading: "Hansı hallarda istifadə olunur?",
        body: "İmplant öncəsi sümük həcminin ölçülməsi, ağıl dişinin sinirlə əlaqəsinin qiymətləndirilməsi, ortodontik və cərrahi planlama, sinus və çənə anatomiyasının analizi kimi hallarda tətbiq olunur.",
      },
      {
        heading: "Müayinə necə keçir?",
        body: "Müayinə bir neçə saniyə çəkir. Pasiyent aparatda sabit dayanır, cihaz baş ətrafında fırlanaraq görüntüləri toplayır. Nəticələr rəqəmsal formada həkimə təqdim olunur.",
      },
    ],
    benefits: [
      "Çənə və diş strukturlarının üçölçülü qiymətləndirilməsi",
      "İmplant planlamasını asanlaşdırır",
      "Sinir kanalları və sinuslarla əlaqəni göstərir",
      "Müasir aparatlarda aşağı doza rejimi",
    ],
    whenNeeded: [
      "İmplant yerləşdirilməsindən əvvəl",
      "Mürəkkəb ağıl dişi çəkilişlərindən əvvəl",
      "Ortodontik və cərrahi planlama üçün",
      "Çənə sümüyü və sinus anatomiyasının analizi üçün",
    ],
    faq: [
      {
        question: "3D tomoqrafiya ilə adi rentgen arasında fərq nədir?",
        answer:
          "Adi rentgen iki ölçülü təsvir verir, 3D tomoqrafiya isə strukturları üç ölçüdə göstərir və daha ətraflı qiymətləndirməyə imkan verir.",
      },
      {
        question: "Müayinə nə qədər davam edir?",
        answer:
          "Görüntülərin toplanması adətən bir neçə saniyə çəkir, ümumi proses isə bir neçə dəqiqə davam edir.",
      },
      {
        question: "3D tomoqrafiya təhlükəlidirmi?",
        answer:
          "Müasir CBCT aparatlarında doza nəzarət altında və aşağı səviyyədədir. Müayinə yalnız klinik göstəriş olduqda təyin edilir.",
      },
    ],
  },

  cbct: {
    metaTitle: "CBCT Bakı | Konus-şüalı kompüter tomoqrafiya — Rentgen.az",
    metaDescription:
      "Bakıda CBCT (konus-şüalı kompüter tomoqrafiya) xidməti göstərən mərkəzlər. Aşağı dozalı, dəqiq üçölçülü dental diaqnostika.",
    keywords: ["CBCT Bakı", "CBCT", "konus şüalı tomoqrafiya", "diş tomoqrafiyası"],
    intro:
      "CBCT (konus-şüalı kompüter tomoqrafiya) diş və çənə strukturlarının aşağı dozalı, üçölçülü görüntülənməsini təmin edir və dəqiq diaqnostikaya kömək edir.",
    sections: [
      {
        heading: "CBCT nədir?",
        body: "CBCT diş təbabətində istifadə olunan kompüter tomoqrafiya növüdür. Konus formalı şüa dəstəsi ilə işləyir və ənənəvi tibbi KT ilə müqayisədə daha aşağı dozada üçölçülü təsvir verir.",
      },
      {
        heading: "Hansı məqsədlərlə istifadə olunur?",
        body: "İmplant planlaması, endodontik (kanal) müalicə, çənə sümüyü və sinus qiymətləndirilməsi, ağıl dişi və ortodontik analizlər üçün tətbiq olunur.",
      },
    ],
    benefits: [
      "Aşağı doza rejimində üçölçülü təsvir",
      "Dəqiq diaqnostikaya kömək edir",
      "İmplant və cərrahi planlamanı asanlaşdırır",
    ],
    whenNeeded: [
      "İmplant öncəsi qiymətləndirmə",
      "Kanal müalicəsində mürəkkəb hallar",
      "Çənə və sinus anatomiyasının analizi",
    ],
    faq: [
      {
        question: "CBCT adi kompüter tomoqrafiyadan nə ilə fərqlənir?",
        answer:
          "CBCT diş təbabəti üçün nəzərdə tutulub və ənənəvi KT ilə müqayisədə daha aşağı dozada, lokal nahiyəyə yönəlmiş üçölçülü təsvir verir.",
      },
    ],
  },

  "panoramik-rentgen": {
    metaTitle: "Panoramik rentgen Bakı | OPG müayinəsi — Rentgen.az",
    metaDescription:
      "Bakıda panoramik rentgen (OPG) xidməti göstərən mərkəzlər. Hər iki çənənin və bütün dişlərin tək görüntüdə qiymətləndirilməsi.",
    keywords: ["panoramik rentgen", "OPG", "ortopantomoqrafiya", "Bakıda panoramik rentgen"],
    intro:
      "Panoramik rentgen (OPG) hər iki çənənin, bütün dişlərin və ətraf strukturların tək görüntüdə icmalını verir. Bu, ümumi diaqnostika və müalicə planlaması üçün geniş istifadə olunan üsuldur.",
    sections: [
      {
        heading: "Panoramik rentgen nədir?",
        body: "Panoramik rentgen üz nahiyəsi ətrafında fırlanan cihazla çəkilir və yuxarı-aşağı çənəni, dişləri, çənə oynağını və sinusların aşağı hissəsini tək təsvirdə göstərir.",
      },
      {
        heading: "Hansı hallarda təyin olunur?",
        body: "Ümumi diş müayinəsi, ağıl dişlərinin qiymətləndirilməsi, ortodontik planlama, çənə travmaları və geniş müalicə planlaması zamanı istifadə olunur.",
      },
    ],
    benefits: [
      "Bütün dişlərin və çənələrin tək görüntüdə icmalı",
      "Sürətli və rahat müayinə",
      "Müalicə planlamasını asanlaşdırır",
    ],
    whenNeeded: [
      "Ümumi diş müayinəsində",
      "Ağıl dişlərinin qiymətləndirilməsində",
      "Ortodontik müalicədən əvvəl",
    ],
    faq: [
      {
        question: "Panoramik rentgen nə üçün lazımdır?",
        answer:
          "O, bütün ağız boşluğunun ümumi mənzərəsini verir və həkimin dəqiq diaqnostika ilə müalicə planlamasına dəstək olur.",
      },
    ],
  },

  "sefalometrik-rentgen": {
    metaTitle: "Sefalometrik rentgen Bakı | Ortodontik analiz — Rentgen.az",
    metaDescription:
      "Bakıda sefalometrik rentgen xidməti göstərən mərkəzlər. Ortodontik müalicə planlaması üçün baş və çənə nisbətlərinin qiymətləndirilməsi.",
    keywords: ["sefalometrik rentgen", "ortodontik rentgen", "sefalometriya"],
    intro:
      "Sefalometrik rentgen baş və çənə nisbətlərinin yandan görüntülənməsidir və əsasən ortodontik müalicənin planlaşdırılmasında istifadə olunur.",
    sections: [
      {
        heading: "Sefalometrik rentgen nədir?",
        body: "Bu müayinə kəllə, çənə və dişlərin bir-birinə nisbətini ölçməyə imkan verir. Ortodont alınan ölçülər əsasında müalicə planını qurur.",
      },
      {
        heading: "Nə üçün istifadə olunur?",
        body: "Diş tellərinin (breket) qoyulmasından əvvəl və müalicə gedişatının izlənməsində, həmçinin cərrahi ortodontik planlamada tətbiq olunur.",
      },
    ],
    benefits: [
      "Çənə və diş nisbətlərinin dəqiq ölçülməsi",
      "Ortodontik planlamanı asanlaşdırır",
      "Müalicə nəticəsinin proqnozuna kömək edir",
    ],
    whenNeeded: [
      "Ortodontik müalicədən əvvəl",
      "Müalicə gedişatının izlənməsində",
      "Cərrahi ortodontik planlama üçün",
    ],
    faq: [
      {
        question: "Sefalometrik rentgen kimlərə təyin olunur?",
        answer:
          "Əsasən ortodontik müalicə planlaşdırılan pasiyentlərə — həm uşaqlara, həm böyüklərə təyin oluna bilər.",
      },
    ],
  },

  "implant-tomoqrafiya": {
    metaTitle: "İmplant üçün tomoqrafiya Bakı | İmplant öncəsi CBCT — Rentgen.az",
    metaDescription:
      "Bakıda implant öncəsi tomoqrafiya xidməti göstərən mərkəzlər. Sümük həcmi və anatomiyanın üçölçülü qiymətləndirilməsi.",
    keywords: [
      "implant üçün tomoqrafiya",
      "implant öncəsi tomoqrafiya",
      "implant CBCT",
      "3D tomoqrafiya",
    ],
    intro:
      "İmplant öncəsi tomoqrafiya çənə sümüyünün həcmini, sıxlığını və anatomik strukturları üçölçülü qiymətləndirməyə imkan verir. Bu məlumat implant planlamasını asanlaşdırır.",
    sections: [
      {
        heading: "İmplantdan əvvəl niyə tomoqrafiya lazımdır?",
        body: "İmplantın uğurlu yerləşdirilməsi üçün sümük həcmi və keyfiyyəti, sinir kanalları və sinuslarla məsafə dəqiq bilinməlidir. 3D tomoqrafiya bu strukturları detallı göstərir.",
      },
      {
        heading: "Nə qiymətləndirilir?",
        body: "Sümük hündürlüyü və eni, sümük sıxlığı, alt çənə sinir kanalının yeri, üst çənədə sinusların vəziyyəti qiymətləndirilir.",
      },
    ],
    benefits: [
      "Sümük həcminin və sıxlığının dəqiq ölçülməsi",
      "Sinir və sinuslarla məsafənin qiymətləndirilməsi",
      "İmplant planlamasına dəstək",
    ],
    whenNeeded: [
      "İmplant yerləşdirilməsindən əvvəl",
      "Sümük artırma (greftləmə) planlaşdırılarkən",
      "Sinus lift əməliyyatından əvvəl",
    ],
    faq: [
      {
        question: "İmplant üçün hansı tomoqrafiya lazımdır?",
        answer:
          "Adətən dental 3D tomoqrafiya (CBCT) tətbiq olunur, çünki o, sümük və anatomik strukturları üçölçülü göstərir.",
      },
    ],
  },

  "agil-disi-rentgeni": {
    metaTitle: "Ağıl dişi üçün rentgen Bakı | Ağıl dişi tomoqrafiyası — Rentgen.az",
    metaDescription:
      "Bakıda ağıl dişi üçün rentgen və tomoqrafiya xidməti göstərən mərkəzlər. Ağıl dişinin vəziyyəti və sinirlə əlaqəsinin qiymətləndirilməsi.",
    keywords: ["ağıl dişi rentgeni", "ağıl dişi tomoqrafiyası", "ağıl dişi çəkilməsi"],
    intro:
      "Ağıl dişi üçün rentgen dişin vəziyyətini, kökünün formasını və ətraf sinirlərlə əlaqəsini qiymətləndirməyə imkan verir. Bu, çəkiliş prosesinin planlaşdırılmasına kömək edir.",
    sections: [
      {
        heading: "Ağıl dişi çəkilməzdən əvvəl hansı görüntüləmə lazımdır?",
        body: "Sadə hallarda panoramik rentgen kifayət edə bilər. Dişin sinir kanalına yaxın olduğu və ya mürəkkəb yerləşdiyi hallarda 3D tomoqrafiya (CBCT) tövsiyə olunur.",
      },
    ],
    benefits: [
      "Dişin və köklərin vəziyyətinin qiymətləndirilməsi",
      "Sinir kanalı ilə əlaqənin göstərilməsi",
      "Çəkiliş planlamasına dəstək",
    ],
    whenNeeded: [
      "Ağıl dişi çəkilməsindən əvvəl",
      "Ağrı və ya iltihab olduqda",
      "Diş düzgün çıxmadıqda (impaksiya)",
    ],
    faq: [
      {
        question: "Ağıl dişi üçün panoramik, yoxsa 3D tomoqrafiya lazımdır?",
        answer:
          "Bu, dişin vəziyyətindən asılıdır. Mürəkkəb hallarda həkim sinirlə əlaqəni dəqiq görmək üçün 3D tomoqrafiya təyin edə bilər.",
      },
    ],
  },

  "dental-rentgen": {
    metaTitle: "Dental rentgen Bakı | Diş rentgeni mərkəzləri — Rentgen.az",
    metaDescription:
      "Bakıda dental rentgen xidməti göstərən təsdiqlənmiş mərkəzlər. Rəqəmsal diş rentgeni ilə dəqiq diaqnostika.",
    keywords: ["dental rentgen", "diş rentgeni", "Bakıda rentgen", "rəqəmsal diş rentgeni"],
    intro:
      "Dental rentgen diş və ətraf toxumaların qiymətləndirilməsində ən geniş istifadə olunan görüntüləmə üsuludur. Müasir rəqəmsal aparatlar aşağı dozada dəqiq təsvir verir.",
    sections: [
      {
        heading: "Dental rentgen nədir?",
        body: "Dental rentgen dişin daxili strukturunu, kökləri və ətraf sümüyü göstərir. Kariyes, iltihab və digər problemlərin aşkarlanmasına kömək edir.",
      },
      {
        heading: "Dental rentgen təhlükəlidirmi?",
        body: "Müasir rəqəmsal dental rentgen aparatlarında şüalanma dozası çox aşağıdır və nəzarət altındadır. Müayinə yalnız klinik göstəriş olduqda təyin edilir.",
      },
    ],
    benefits: [
      "Kariyes və iltihabın erkən aşkarlanması",
      "Aşağı doza rejimində rəqəmsal təsvir",
      "Dəqiq diaqnostikaya kömək edir",
    ],
    whenNeeded: [
      "Diş ağrısı və ya kariyes şübhəsi olduqda",
      "Kanal müalicəsindən əvvəl və sonra",
      "Ümumi diş müayinəsində",
    ],
    faq: [
      {
        question: "Dental rentgen hamilələrə çəkilə bilərmi?",
        answer:
          "Hamiləlik barədə həkimə mütləq məlumat verilməlidir. Həkim zərurəti və qorunma tədbirlərini qiymətləndirərək qərar verir.",
      },
    ],
  },
};

export function getServiceContent(
  slug: string,
  name: string,
  category?: string,
  locale: Locale = "az",
): ServiceContent {
  // Hand-written rich content is AZ-only; for RU we always use the
  // locale-aware generic template (name is passed already translated).
  if (locale === "ru") return generic(name, category, "ru");
  return SERVICE_CONTENT[slug] ?? generic(name, category, "az");
}
