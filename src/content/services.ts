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

const generic = (name: string): ServiceContent => ({
  metaTitle: `${name} | Bakıda rentgen mərkəzləri — Rentgen.az`,
  metaDescription: `Bakıda ${name.toLowerCase()} xidməti göstərən təsdiqlənmiş mərkəzlər. Qiymət, ünvan və əlaqə məlumatı bir platformada.`,
  keywords: [name, "Bakı", "rentgen mərkəzi", "dental rentgen"],
  intro: `${name} diş və çənə strukturlarının qiymətləndirilməsində istifadə olunan görüntüləmə üsuludur və həkimin dəqiq diaqnostika verməsinə kömək edir.`,
  sections: [
    {
      heading: `${name} nədir?`,
      body: `${name} müasir rəqəmsal aparatlar vasitəsilə aparılan görüntüləmə müayinəsidir. Nəticələr həkimin müalicə planlamasını asanlaşdırır.`,
    },
  ],
  benefits: [
    "Dəqiq diaqnostikaya kömək edir",
    "Müalicə planlamasını asanlaşdırır",
    "Müasir rəqəmsal aparatlarda aşağı doza rejimi",
  ],
  whenNeeded: [
    "Həkimin klinik göstərişi olduqda",
    "Müalicədən əvvəl strukturların qiymətləndirilməsi üçün",
  ],
  faq: [
    {
      question: `${name} təhlükəlidirmi?`,
      answer:
        "Müasir rəqəmsal aparatlarda şüalanma dozası nəzarət altında və aşağı səviyyədədir. Müayinə yalnız klinik göstəriş olduqda təyin edilir.",
    },
  ],
});

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

export function getServiceContent(slug: string, name: string): ServiceContent {
  return SERVICE_CONTENT[slug] ?? generic(name);
}
