import type { FaqItem } from "@/components/faq-accordion";
import type { Locale } from "@/lib/i18n";

const HOME_FAQ_AZ: FaqItem[] = [
  {
    question: "Rentgen.az nədir?",
    answer:
      "Rentgen.az Azərbaycanda dental rentgen və 3D tomoqrafiya xidmətləri göstərən təsdiqlənmiş mərkəzləri bir araya gətirən platformadır. Xidmət və rayona görə axtarış edib mərkəzlərlə birbaşa əlaqə saxlaya bilərsiniz.",
  },
  {
    question: "Dental rentgen təhlükəlidirmi?",
    answer:
      "Müasir rəqəmsal dental rentgen aparatlarında şüalanma dozası nəzarət altında və aşağı səviyyədədir. Müayinə yalnız klinik göstəriş olduqda təyin edilir və həkimin dəqiq diaqnostika verməsinə kömək edir.",
  },
  {
    question: "İmplantdan əvvəl niyə 3D tomoqrafiya lazımdır?",
    answer:
      "3D tomoqrafiya (CBCT) çənə sümüyünün həcmini, sıxlığını və anatomik strukturları üçölçülü qiymətləndirməyə imkan verir. Bu, implant planlamasını asanlaşdırır və həkimin klinik qərar verməsinə dəstək olur.",
  },
  {
    question: "Müayinə üçün necə qeydiyyatdan keçirəm?",
    answer:
      "Telefon nömrənizi daxil edirsiniz, sizə birdəfəlik təsdiq kodu (OTP) göndərilir. Kodu təsdiqlədikdən sonra profiliniz yaradılır — parol tələb olunmur.",
  },
  {
    question: "Mərkəzlər necə təsdiqlənir?",
    answer:
      "Hər rentgen mərkəzi qeydiyyatdan keçərək profilini doldurur. Profil admin tərəfindən yoxlanıldıqdan sonra platformada “təsdiqlənmiş” statusu ilə görünür.",
  },
  {
    question: "Xidmətlər üçün ödəniş platformada olur?",
    answer:
      "Xeyr. Rentgen.az mərkəzləri tapmağa və əlaqə saxlamağa kömək edir. Ödəniş və müayinə birbaşa seçdiyiniz mərkəzdə həyata keçirilir.",
  },
];

const ADDITIONAL_FAQ_AZ: FaqItem[] = [
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

const HOME_FAQ_RU: FaqItem[] = [
  {
    question: "Что такое Rentgen.az?",
    answer:
      "Rentgen.az — платформа, объединяющая проверенные центры дентального рентгена и 3D-томографии в Азербайджане. Вы можете искать по услуге и району и напрямую связываться с центрами.",
  },
  {
    question: "Опасен ли дентальный рентген?",
    answer:
      "В современных цифровых дентальных рентген-аппаратах доза облучения контролируется и остаётся низкой. Обследование назначается только при клинических показаниях и помогает врачу поставить точный диагноз.",
  },
  {
    question: "Зачем перед имплантацией нужна 3D-томография?",
    answer:
      "3D-томография (КЛКТ) позволяет в трёх измерениях оценить объём и плотность челюстной кости и анатомические структуры. Это облегчает планирование имплантации и помогает врачу в принятии клинического решения.",
  },
  {
    question: "Как записаться на обследование?",
    answer:
      "Вы вводите номер телефона, вам приходит одноразовый код подтверждения (OTP). После подтверждения кода создаётся ваш профиль — пароль не требуется.",
  },
  {
    question: "Как проверяются центры?",
    answer:
      "Каждый рентген-центр регистрируется и заполняет свой профиль. После проверки администрацией он отображается на платформе со статусом «проверено».",
  },
  {
    question: "Оплата за услуги проходит на платформе?",
    answer:
      "Нет. Rentgen.az помогает найти центры и связаться с ними. Оплата и обследование проводятся напрямую в выбранном вами центре.",
  },
];

const ADDITIONAL_FAQ_RU: FaqItem[] = [
  {
    question: "Что такое панорамный (ортопантомограмма) рентген?",
    answer:
      "Панорамный рентген показывает весь зубной ряд, челюсти и окружающие структуры на одном снимке. Это помогает в общей диагностике и даёт врачу широкий обзор при составлении плана лечения.",
  },
  {
    question: "Для чего назначается цефалометрический рентген?",
    answer:
      "Цефалометрический рентген показывает боковой профиль черепно-лицевой области и используется в основном в ортодонтическом лечении. Он помогает врачу оценить соотношение челюстей и направление роста.",
  },
  {
    question: "В чём разница между 3D-томографией (КЛКТ) и обычным рентгеном?",
    answer:
      "Обычный рентген даёт двумерное изображение, а 3D-томография (КЛКТ) позволяет оценить область в трёх измерениях. Это помогает точнее диагностировать в сложных случаях; вид обследования врач выбирает по клиническим показаниям.",
  },
  {
    question: "Для чего нужна томография перед имплантацией?",
    answer:
      "Томография перед имплантацией показывает объём и плотность челюстной кости и анатомические структуры. Эти данные помогают врачу принять клиническое решение по планированию имплантации.",
  },
  {
    question: "Сколько стоят обследования?",
    answer:
      "Цена зависит от вида обследования и центра. Точную сумму можно узнать напрямую в выбранном центре; оплата проводится не на платформе, а в центре во время обследования.",
  },
  {
    question: "Как я получу результаты обследования?",
    answer:
      "Результаты предоставляет выбранный вами центр — это может быть распечатка, цифровой файл или диск. Формат выдачи можно уточнить в центре при записи.",
  },
  {
    question: "Нужен ли пароль для регистрации?",
    answer:
      "Нет. Вы вводите номер телефона, вам приходит одноразовый код подтверждения (OTP). После подтверждения кода создаётся профиль — отдельный пароль не требуется.",
  },
  {
    question: "Что делать, если код OTP не приходит?",
    answer:
      "Подождите несколько минут и запросите код повторно. Проверьте правильность номера; если проблема сохраняется, свяжитесь с нами для поддержки.",
  },
];

/** Homepage FAQ (6 items) for the given locale. */
export function getHomeFaq(locale: Locale): FaqItem[] {
  return locale === "ru" ? HOME_FAQ_RU : HOME_FAQ_AZ;
}

/** Full FAQ page (14 items) for the given locale. */
export function getAllFaq(locale: Locale): FaqItem[] {
  return locale === "ru"
    ? [...HOME_FAQ_RU, ...ADDITIONAL_FAQ_RU]
    : [...HOME_FAQ_AZ, ...ADDITIONAL_FAQ_AZ];
}

/** Backward-compatible default (AZ) — used for structured data (SEO). */
export const HOME_FAQ = HOME_FAQ_AZ;
