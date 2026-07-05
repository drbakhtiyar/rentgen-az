/**
 * Lightweight bilingual (az/ru) UI dictionary for shared chrome + key surfaces.
 * Locale is stored in the `locale` cookie; DB content stays in Azerbaijani.
 * Pure module (usable on client and server); server reads the cookie via
 * `getLocale()` in i18n-server.ts.
 */

export type Locale = "az" | "ru";
export const LOCALES: Locale[] = ["az", "ru"];
export const DEFAULT_LOCALE: Locale = "az";
export const LOCALE_COOKIE = "locale";

export function isLocale(v: unknown): v is Locale {
  return v === "az" || v === "ru";
}

type Dict = {
  nav: {
    centers: string;
    services: string;
    doctors: string;
    forDoctors: string;
    forCenters: string;
    blog: string;
    contact: string;
  };
  cta: {
    login: string;
    loginRegister: string;
    addCenter: string;
    search: string;
    call: string;
    whatsapp: string;
    details: string;
  };
  search: {
    service: string;
    allServices: string;
    city: string;
    allCities: string;
    centerName: string;
    centerNamePlaceholder: string;
  };
  hero: {
    badge: string;
    titleA: string;
    titleHighlight: string;
    titleB: string;
    subtitle: string;
    f1: string;
    f2: string;
    f3: string;
  };
  footer: {
    tagline: string;
    platform: string;
    company: string;
    about: string;
    faq: string;
    privacy: string;
    terms: string;
    disclaimer: string;
    rights: string;
  };
};

const az: Dict = {
  nav: {
    centers: "Rentgen mərkəzləri",
    services: "Xidmətlər",
    doctors: "Həkimlər",
    forDoctors: "Həkimlər üçün",
    forCenters: "Mərkəzlər üçün",
    blog: "Blog",
    contact: "Əlaqə",
  },
  cta: {
    login: "Giriş",
    loginRegister: "Giriş / Qeydiyyat",
    addCenter: "Mərkəz əlavə et",
    search: "Axtar",
    call: "Zəng et",
    whatsapp: "WhatsApp",
    details: "Ətraflı",
  },
  search: {
    service: "Xidmət",
    allServices: "Bütün xidmətlər",
    city: "Rayon / şəhər",
    allCities: "Bütün rayonlar",
    centerName: "Mərkəz adı",
    centerNamePlaceholder: "Mərkəzin adı",
  },
  hero: {
    badge: "Azərbaycanın dental görüntüləmə platforması",
    titleA: "Bakıda ",
    titleHighlight: "dental rentgen",
    titleB: " və 3D tomoqrafiya mərkəzini tapın",
    subtitle:
      "Panoramik, sefalometrik rentgen, CBCT və implant öncəsi tomoqrafiya xidmətləri göstərən təsdiqlənmiş mərkəzləri xidmət və rayona görə axtarın — birbaşa zəng və WhatsApp ilə əlaqə saxlayın.",
    f1: "Təsdiqlənmiş mərkəzlər",
    f2: "3 klikdən az axtarış",
    f3: "Parolsuz, sürətli giriş",
  },
  footer: {
    tagline:
      "Azərbaycanda dental rentgen, panoramik rentgen, sefalometrik rentgen və 3D dental tomoqrafiya (CBCT) mərkəzlərini bir platformada tapın.",
    platform: "Platforma",
    company: "Şirkət",
    about: "Haqqımızda",
    faq: "FAQ",
    privacy: "Gizlilik siyasəti",
    terms: "İstifadə şərtləri",
    disclaimer:
      "Platformadakı məlumat ümumi xarakter daşıyır və həkim məsləhətini əvəz etmir.",
    rights: "Bütün hüquqlar qorunur.",
  },
};

const ru: Dict = {
  nav: {
    centers: "Рентген-центры",
    services: "Услуги",
    doctors: "Врачи",
    forDoctors: "Для врачей",
    forCenters: "Для центров",
    blog: "Блог",
    contact: "Контакты",
  },
  cta: {
    login: "Вход",
    loginRegister: "Вход / Регистрация",
    addCenter: "Добавить центр",
    search: "Искать",
    call: "Позвонить",
    whatsapp: "WhatsApp",
    details: "Подробнее",
  },
  search: {
    service: "Услуга",
    allServices: "Все услуги",
    city: "Район / город",
    allCities: "Все районы",
    centerName: "Название центра",
    centerNamePlaceholder: "Название центра",
  },
  hero: {
    badge: "Стоматологическая диагностическая платформа Азербайджана",
    titleA: "Найдите в Баку центр ",
    titleHighlight: "стоматологического рентгена",
    titleB: " и 3D-томографии",
    subtitle:
      "Ищите проверенные центры, предоставляющие панорамный, цефалометрический рентген, КЛКТ и предимплантационную томографию — по услуге и району, с прямой связью по телефону и WhatsApp.",
    f1: "Проверенные центры",
    f2: "Поиск менее чем в 3 клика",
    f3: "Быстрый вход без пароля",
  },
  footer: {
    tagline:
      "Найдите центры стоматологического рентгена, панорамного, цефалометрического рентгена и 3D-томографии (КЛКТ) в Азербайджане на одной платформе.",
    platform: "Платформа",
    company: "Компания",
    about: "О нас",
    faq: "Вопросы",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    disclaimer:
      "Информация на платформе носит общий характер и не заменяет консультацию врача.",
    rights: "Все права защищены.",
  },
};

const DICTS: Record<Locale, Dict> = { az, ru };

export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? az;
}
