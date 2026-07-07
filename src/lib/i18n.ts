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
  centers: {
    eyebrow: string;
    title: string;
    description: string;
    found: string; // "... mərkəz tapıldı"
    page: string; // "səhifə"
    noResults: string;
    noResultsDesc: string;
    allCenters: string;
    nearby: string;
    sortBy: string;
    sortRecommended: string;
    sortCheapest: string;
    sortRating: string;
    sortNearest: string;
  };
  centerDetail: {
    contactInfo: string;
    servicesPrices: string;
    reviews: string;
    workingHours: string;
    aboutCenter: string;
    noReviews: string;
    requestTitle: string;
    requestDesc: string;
    replyBy: string; // "{center} cavabı" → suffix
    openMap: string;
    today: string;
    closed: string;
    phone: string;
    address: string;
    equipment: string;
    responsible: string;
  };
  services: {
    eyebrow: string;
    title: string;
    description: string;
  };
  doctors: {
    eyebrow: string;
    title: string;
    description: string;
    empty: string;
    emptyDesc: string;
    joinCta: string;
    viewProfile: string;
    specializations: string;
    verified: string;
    needXray: string;
    needXrayDesc: string;
  };
  appt: {
    name: string;
    namePh: string;
    phone: string;
    phoneLocked: string;
    service: string;
    serviceOpt: string;
    doctor: string;
    doctorHint: string;
    doctorOpt: string;
    note: string;
    notePh: string;
    date: string;
    dateHint: string;
    time: string;
    pickDate: string;
    noSlots: string;
    pickTime: string;
    submit: string;
    submitOtp: string;
    disclaimer: string;
    centerLabel: string;
  };
  status: {
    openTpl: string; // {t} = closing time
    closingTpl: string; // {m} = minutes
    opensTpl: string; // {t} = opening time
    closed: string;
  };
  docForm: {
    onboardTitle: string;
    onboardDesc: string;
    photo: string;
    photoUpload: string;
    firstName: string;
    firstNamePh: string;
    lastName: string;
    lastNamePh: string;
    phone: string;
    phoneHint: string;
    specs: string;
    specsHint: string;
    clinic: string;
    clinicPh: string;
    city: string;
    choose: string;
    instagram: string;
    instagramHint: string;
    website: string;
    diploma: string;
    certificate: string;
    docsNote: string;
    create: string;
    save: string;
    uploaded: string;
    remove: string;
    uploading: string;
    pickFile: string;
    tooBig: string;
    uploadFailed: string;
    savedOk: string;
    genericError: string;
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
  centers: {
    eyebrow: "Mərkəzlər kataloqu",
    title: "Rentgen mərkəzləri",
    description:
      "Təsdiqlənmiş dental rentgen və 3D tomoqrafiya mərkəzlərini xidmət və rayona görə tapın.",
    found: "mərkəz tapıldı",
    page: "səhifə",
    noResults: "Nəticə tapılmadı",
    noResultsDesc:
      "Seçilmiş filtrə uyğun təsdiqlənmiş mərkəz yoxdur. Filtri dəyişin və ya bütün mərkəzlərə baxın.",
    allCenters: "Bütün mərkəzlər",
    nearby: "Yaxınımdakı mərkəzləri tap",
    sortBy: "Sırala",
    sortRecommended: "Tövsiyə",
    sortCheapest: "Ən ucuz",
    sortRating: "Yüksək reytinq",
    sortNearest: "Ən yaxın",
  },
  centerDetail: {
    contactInfo: "Əlaqə və məlumat",
    servicesPrices: "Xidmətlər və qiymətlər",
    reviews: "Rəylər",
    workingHours: "İş saatları",
    aboutCenter: "Mərkəz haqqında",
    noReviews: "Hələ rəy yoxdur. İlk rəyi siz yazın.",
    requestTitle: "Müraciət göndərin",
    requestDesc: "Mərkəz sizinlə əlaqə saxlasın.",
    replyBy: "cavabı",
    openMap: "Xəritədə bax",
    today: "bu gün",
    closed: "Bağlı",
    phone: "Telefon",
    address: "Ünvan",
    equipment: "Avadanlıq",
    responsible: "Məsul şəxs",
  },
  services: {
    eyebrow: "Görüntüləmə xidmətləri",
    title: "Dental rentgen və tomoqrafiya xidmətləri",
    description:
      "Diaqnostika və müalicə planlaması üçün lazım olan bütün görüntüləmə növləri — hər biri üçün təsdiqlənmiş mərkəzləri tapın.",
  },
  doctors: {
    eyebrow: "Həkim kataloqu",
    title: "Dental həkimlər",
    description: "Təsdiqlənmiş dental həkimləri ixtisas və şəhərə görə tapın.",
    empty: "Hələ həkim yoxdur",
    emptyDesc: "Təsdiqlənmiş həkimlər tezliklə burada görünəcək.",
    joinCta: "Həkim kimi qoşulun",
    viewProfile: "Profilə bax",
    specializations: "İxtisaslar",
    verified: "Sənədləri təsdiqlənib",
    needXray: "Rentgen müayinəsi lazımdır?",
    needXrayDesc:
      "Təsdiqlənmiş rentgen mərkəzlərini tapın və birbaşa əlaqə saxlayın.",
  },
  appt: {
    name: "Ad, Soyad",
    namePh: "Adınız",
    phone: "Telefon nömrəsi",
    phoneLocked: "Hesab nömrəniz — dəyişdirilə bilməz",
    service: "Müayinə növü",
    serviceOpt: "Seçin (istəyə bağlı)",
    doctor: "Sizi yönləndirən həkim",
    doctorHint: "Həkiminiz varsa seçin — o, müraciətinizi izləyə biləcək.",
    doctorOpt: "Həkim seçin (istəyə bağlı)",
    note: "Qeyd",
    notePh: "Əlavə məlumat (istəyə bağlı)",
    date: "Tarix",
    dateHint: "İstədiyiniz gün (istəyə bağlı)",
    time: "Saat",
    pickDate: "Əvvəlcə tarix seçin",
    noSlots: "Bu gün üçün vaxt yoxdur",
    pickTime: "Saat seçin",
    submit: "Müraciət göndər",
    submitOtp: "Davam et — təsdiq kodu al",
    disclaimer: "Müraciətiniz seçilmiş mərkəzə çatdırılır. Ödəniş platformada alınmır.",
    centerLabel: "Mərkəz",
  },
  status: {
    openTpl: "Açıqdır · {t}-dək",
    closingTpl: "{m} dəq sonra bağlanır",
    opensTpl: "Bağlıdır · {t}-də açılır",
    closed: "Bağlıdır",
  },
  docForm: {
    onboardTitle: "Həkim profilini yaradın",
    onboardDesc: "Admin təsdiqindən sonra pasiyentlərin siyahısında görünəcəksiniz.",
    photo: "Profil şəkli",
    photoUpload: "Şəkil yüklə",
    firstName: "Ad",
    firstNamePh: "Adınız",
    lastName: "Soyad",
    lastNamePh: "Soyadınız",
    phone: "Telefon nömrəsi",
    phoneHint: "Hesab identifikatoru — dəyişdirilə bilməz.",
    specs: "İxtisas(lar)",
    specsHint: "— bir və ya bir neçəsini seçin (istəyə bağlı)",
    clinic: "İş yeri / Klinika",
    clinicPh: "Klinikanın adı",
    city: "Şəhər",
    choose: "Seçin",
    instagram: "Instagram",
    instagramHint: "Məs: @drsoyad və ya tam link",
    website: "Sayt",
    diploma: "Diplom",
    certificate: "Təkmilləşmə sertifikatı",
    docsNote:
      "Bütün əlavə məlumatlar istəyə bağlıdır. Diplom və sertifikat profilinizin etibarlılığını artırır (JPG, PNG və ya PDF — maks. 8 MB).",
    create: "Profili yarat",
    save: "Yadda saxla",
    uploaded: "Yükləndi — bax",
    remove: "Sil",
    uploading: "Yüklənir...",
    pickFile: "Fayl seç",
    tooBig: "Fayl 8 MB-dan böyük olmamalıdır.",
    uploadFailed: "Yükləmə uğursuz oldu",
    savedOk: "Yadda saxlanıldı.",
    genericError: "Xəta",
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
  centers: {
    eyebrow: "Каталог центров",
    title: "Рентген-центры",
    description:
      "Найдите проверенные центры стоматологического рентгена и 3D-томографии по услуге и району.",
    found: "центров найдено",
    page: "страница",
    noResults: "Ничего не найдено",
    noResultsDesc:
      "Нет проверенных центров по выбранному фильтру. Измените фильтр или посмотрите все центры.",
    allCenters: "Все центры",
    nearby: "Найти центры рядом",
    sortBy: "Сортировка",
    sortRecommended: "Рекомендуемые",
    sortCheapest: "Дешевле",
    sortRating: "По рейтингу",
    sortNearest: "Ближайшие",
  },
  centerDetail: {
    contactInfo: "Контакты и информация",
    servicesPrices: "Услуги и цены",
    reviews: "Отзывы",
    workingHours: "Часы работы",
    aboutCenter: "О центре",
    noReviews: "Отзывов пока нет. Оставьте первый отзыв.",
    requestTitle: "Отправить заявку",
    requestDesc: "Центр свяжется с вами.",
    replyBy: "ответ",
    openMap: "На карте",
    today: "сегодня",
    closed: "Закрыто",
    phone: "Телефон",
    address: "Адрес",
    equipment: "Оборудование",
    responsible: "Ответственное лицо",
  },
  services: {
    eyebrow: "Диагностические услуги",
    title: "Услуги стоматологического рентгена и томографии",
    description:
      "Все виды визуализации для диагностики и планирования лечения — найдите проверенные центры для каждой.",
  },
  doctors: {
    eyebrow: "Каталог врачей",
    title: "Стоматологи",
    description: "Найдите проверенных стоматологов по специализации и городу.",
    empty: "Врачей пока нет",
    emptyDesc: "Проверенные врачи скоро появятся здесь.",
    joinCta: "Присоединиться как врач",
    viewProfile: "Профиль",
    specializations: "Специализации",
    verified: "Документы подтверждены",
    needXray: "Нужно рентген-обследование?",
    needXrayDesc: "Найдите проверенные рентген-центры и свяжитесь напрямую.",
  },
  appt: {
    name: "Имя, Фамилия",
    namePh: "Ваше имя",
    phone: "Номер телефона",
    phoneLocked: "Номер вашего аккаунта — нельзя изменить",
    service: "Вид обследования",
    serviceOpt: "Выберите (необязательно)",
    doctor: "Направивший врач",
    doctorHint: "Если у вас есть врач — выберите его, он сможет отслеживать заявку.",
    doctorOpt: "Выберите врача (необязательно)",
    note: "Примечание",
    notePh: "Дополнительная информация (необязательно)",
    date: "Дата",
    dateHint: "Желаемый день (необязательно)",
    time: "Время",
    pickDate: "Сначала выберите дату",
    noSlots: "На этот день нет времени",
    pickTime: "Выберите время",
    submit: "Отправить заявку",
    submitOtp: "Продолжить — получить код",
    disclaimer: "Ваша заявка передаётся выбранному центру. Оплата на платформе не взимается.",
    centerLabel: "Центр",
  },
  status: {
    openTpl: "Открыто · до {t}",
    closingTpl: "{m} мин до закрытия",
    opensTpl: "Закрыто · открытие в {t}",
    closed: "Закрыто",
  },
  docForm: {
    onboardTitle: "Создайте профиль врача",
    onboardDesc: "После подтверждения администратором вы появитесь в списке для пациентов.",
    photo: "Фото профиля",
    photoUpload: "Загрузить фото",
    firstName: "Имя",
    firstNamePh: "Ваше имя",
    lastName: "Фамилия",
    lastNamePh: "Ваша фамилия",
    phone: "Номер телефона",
    phoneHint: "Идентификатор аккаунта — изменить нельзя.",
    specs: "Специализация(и)",
    specsHint: "— выберите одну или несколько (необязательно)",
    clinic: "Место работы / Клиника",
    clinicPh: "Название клиники",
    city: "Город",
    choose: "Выберите",
    instagram: "Instagram",
    instagramHint: "Напр.: @drfamiliya или полная ссылка",
    website: "Сайт",
    diploma: "Диплом",
    certificate: "Сертификат о повышении квалификации",
    docsNote:
      "Все дополнительные данные необязательны. Диплом и сертификат повышают доверие к профилю (JPG, PNG или PDF — макс. 8 МБ).",
    create: "Создать профиль",
    save: "Сохранить",
    uploaded: "Загружено — открыть",
    remove: "Удалить",
    uploading: "Загрузка...",
    pickFile: "Выбрать файл",
    tooBig: "Файл не должен превышать 8 МБ.",
    uploadFailed: "Загрузка не удалась",
    savedOk: "Сохранено.",
    genericError: "Ошибка",
  },
};

const DICTS: Record<Locale, Dict> = { az, ru };

export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? az;
}
