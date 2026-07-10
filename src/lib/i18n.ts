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
    faq: string;
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
    featuredBadge: string;
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
    servicesSoon: string;
    verifiedCustomer: string;
    writeReviewTitle: string;
    updateReviewTitle: string;
    onlyAfterService: string;
    sendPatient: string;
    sendRequest: string;
    referHint: string;
    patientFallback: string;
    docsTitle: string;
    licenseLabel: string;
  };
  services: {
    eyebrow: string;
    title: string;
    description: string;
    categorySuffix: string; // "{cat} xidmətləri"
    centerWord: string; // "{n} mərkəz"
    more: string;
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
    profileEyebrow: string;
    website: string;
    findCenter: string;
    documents: string;
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
    errGeneric: string;
    submitted: string;
    otpSentPre: string;
    otpSentPost: string;
    otpTestMode: string;
    otpLabel: string;
    otpPlaceholder: string;
    verifySubmit: string;
    back: string;
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
    residency: string;
    internship: string;
    specialty: string;
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
  home: {
    statCenters: string;
    statDoctors: string;
    statPatients: string;
    statServices: string;
    statDistricts: string;
    servicesEyebrow: string;
    servicesTitle: string;
    servicesDesc: string;
    centerCount: string; // "{n} mərkəz"
    more: string;
    allServices: string;
    centersEyebrow: string;
    centersTitle: string;
    centersDesc: string;
    viewAll: string;
    centersEmptyTitle: string;
    centersEmptyDesc: string;
    addCenter: string;
    hiwBadge: string;
    hiwTitle: string;
    hiwDesc: string;
    step1t: string;
    step1d: string;
    step2t: string;
    step2d: string;
    step3t: string;
    step3d: string;
    findCenter: string;
    tile1t: string;
    tile1d: string;
    tile2t: string;
    tile2d: string;
    tile3t: string;
    tile3d: string;
    tile4t: string;
    tile4d: string;
    forDoctorsBadge: string;
    forDoctorsTitle: string;
    forDoctorsDesc: string;
    openReferral: string;
    forCentersBadge: string;
    forCentersTitle: string;
    forCentersDesc: string;
    safetyTitle: string;
    safetyText: string;
    readMore: string;
    faqEyebrow: string;
    faqTitle: string;
    blogEyebrow: string;
    blogTitle: string;
    allPosts: string;
    read: string;
    finalTitle: string;
    finalDesc: string;
    registerLogin: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    description: string;
    infoTitle: string;
    phone: string;
    email: string;
    address: string;
    addressValue: string;
    hours: string;
    hoursValue: string;
    whatsappDesc: string;
    whatsappCta: string;
    writeTitle: string;
    writeDesc: string;
  };
  forCenters: {
    eyebrow: string;
    title: string;
    description: string;
    registerCta: string;
    loginCta: string;
    howEyebrow: string;
    howTitle: string;
    step1t: string; step1d: string;
    step2t: string; step2d: string;
    step3t: string; step3d: string;
    step4t: string; step4d: string;
    benefitsEyebrow: string;
    benefitsTitle: string;
    benefitsDesc: string;
    b1: string; b2: string; b3: string; b4: string; b5: string; b6: string;
    freeTitle: string;
    freeDesc: string;
    freeCta: string;
  };
  forDoctors: {
    eyebrow: string;
    title: string;
    description: string;
    registerCta: string;
    loginCta: string;
    f1t: string; f1d: string;
    f2t: string; f2d: string;
    f3t: string; f3d: string;
    note: string;
    formTitle: string;
    fillRequired: string;
    partnerHint: string;
    noPartner: string;
    partnerCentersCta: string;
  };
  faqPage: {
    eyebrow: string;
    title: string;
    description: string;
  };
  smartSearch: {
    placeholder: string;
    hint: string;
    searching: string;
    empty: string;
    allResults: string;
  };
  auth: {
    heroTitle: string;
    heroDesc: string;
    f1t: string; f1d: string;
    f2t: string; f2d: string;
    f3t: string; f3d: string;
    title: string;
    subtitle: string;
    rolePatient: string;
    roleCenter: string;
    roleDoctor: string;
    phoneLabel: string;
    phoneHint: string;
    phonePlaceholder: string;
    sendCode: string;
    back: string;
    codeTitle: string;
    codeSentPre: string;
    codeSentPost: string;
    testModePre: string;
    testModePost: string;
    otpLabel: string;
    verify: string;
    resendPre: string;
    resendPost: string;
    resend: string;
    termsPre: string;
    termsLink: string;
    termsMid: string;
    privacyLink: string;
    termsPost: string;
    errGeneric: string;
    errCode: string;
  };
  reviews: {
    ratingTitle: string;
    qService: string; qStaff: string; qClean: string; qWait: string; qPrice: string;
    starSuffix: string;
    allStars: string;
    errGeneric: string;
    thanks: string;
    centerLabel: string;
    commentPlaceholder: string;
    writeReview: string;
    updateReview: string;
    firstName: string; firstNamePh: string;
    lastName: string; lastNamePh: string;
    phoneLabel: string; phoneHint: string; phonePlaceholder: string;
    doctorLabel: string; doctorHint: string; doctorNone: string; doctorOther: string;
    doctorNameLabel: string; doctorNamePh: string;
    reviewLabel: string;
    submitOtp: string;
    errName: string; errPhone: string;
    otpSentPre: string; otpSentPost: string;
    otpTestMode: string;
    otpLabel: string; otpPlaceholder: string;
    send: string; back: string;
    gotoCenter: string;
    pageTitleSuffix: string;
    pageDesc: string;
  };
  referral: {
    doctorLabel: string;
    errCenter: string; errName: string; errPhone: string; errGeneric: string;
    submitted: string;
    otpSentPre: string; otpSentPost: string;
    otpTestMode: string;
    otpLabel: string; otpPlaceholder: string;
    complete: string; back: string;
    centerLabel: string; centerHintPartner: string; centerFallback: string; centerPlaceholder: string;
    serviceLabel: string; servicePickCenter: string; serviceNone: string; servicePick: string;
    firstLabel: string; firstPh: string; lastLabel: string; lastPh: string;
    phoneLabel: string; phoneHint: string; phonePlaceholder: string;
    dateLabel: string; optional: string; pickCenterFirst: string;
    timeLabel: string; pickDateFirst: string; noTime: string; pickTime: string;
    noteLabel: string; notePh: string;
    submit: string;
  };
  blog: {
    eyebrow: string;
    title: string;
    description: string;
    emptyTitle: string;
    emptyDesc: string;
    read: string;
    notFound: string;
    disclaimer: string;
    allPosts: string;
    ctaTitle: string;
    ctaDesc: string;
    ctaButton: string;
  };
  serviceDetail: {
    centersWithService: string;
    benefits: string;
    whenNeeded: string;
    related: string;
    centersEyebrow: string;
    centersTitleTpl: string;
    viewAll: string;
    centersEmpty: string;
    addCenter: string;
    faqTitleTpl: string;
    ctaTitleTpl: string;
    ctaDesc: string;
    findCenter: string;
    notFound: string;
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
    faq: "FAQ",
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
    badge: "Azərbaycanın rentgen platforması",
    titleA: "Bakıda ",
    titleHighlight: "rentgen",
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
    featuredBadge: "Tövsiyə olunan",
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
    servicesSoon: "Xidmət siyahısı tezliklə əlavə olunacaq.",
    verifiedCustomer: "Təsdiqlənmiş müştəri",
    writeReviewTitle: "Rəyinizi yazın",
    updateReviewTitle: "Rəyinizi yeniləyin",
    onlyAfterService: "Bu mərkəzə yalnız xidmət aldıqdan sonra rəy yaza bilərsiniz.",
    sendPatient: "Pasiyent göndər",
    sendRequest: "Müraciət göndər",
    referHint: "Pasiyentinizi bu mərkəzə yönləndirin — pasiyentə OTP təsdiqi göndəriləcək.",
    patientFallback: "Pasiyent",
    docsTitle: "Lisenziya və sənədlər",
    licenseLabel: "Rentgenologiya lisenziyası",
  },
  services: {
    eyebrow: "Görüntüləmə xidmətləri",
    title: "Dental rentgen və tomoqrafiya xidmətləri",
    description:
      "Diaqnostika və müalicə planlaması üçün lazım olan bütün görüntüləmə növləri — hər biri üçün təsdiqlənmiş mərkəzləri tapın.",
    categorySuffix: "xidmətləri",
    centerWord: "mərkəz",
    more: "Ətraflı və mərkəzlər",
  },
  doctors: {
    eyebrow: "Həkim kataloqu",
    title: "Həkimlər",
    description: "Təsdiqlənmiş həkimləri ixtisas və şəhərə görə tapın.",
    empty: "Hələ həkim yoxdur",
    emptyDesc: "Təsdiqlənmiş həkimlər tezliklə burada görünəcək.",
    joinCta: "Həkim kimi qoşulun",
    viewProfile: "Profilə bax",
    specializations: "İxtisaslar",
    verified: "Sənədləri təsdiqlənib",
    needXray: "Rentgen müayinəsi lazımdır?",
    needXrayDesc:
      "Təsdiqlənmiş rentgen mərkəzlərini tapın və birbaşa əlaqə saxlayın.",
    profileEyebrow: "Həkim",
    website: "Vebsayt",
    findCenter: "Mərkəz tap",
    documents: "Sənədlər",
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
    errGeneric: "Xəta baş verdi",
    submitted: "Müraciətiniz göndərildi.",
    otpSentPre: "",
    otpSentPost: " nömrəsinə təsdiq kodu göndərdik. Müraciətin qeydə alınması üçün kodu daxil edin.",
    otpTestMode: "Test rejimi — kod: ",
    otpLabel: "Təsdiq kodu",
    otpPlaceholder: "6 rəqəmli kod",
    verifySubmit: "Təsdiqlə və göndər",
    back: "Geri",
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
    residency: "Rezidentura sənədi",
    internship: "İnternatura sənədi",
    specialty: "Uzmanlıq sənədi",
    docsNote:
      "Bütün sənədlər istəyə bağlıdır. Diplom, sertifikat və digər sənədlər profilinizin etibarlılığını artırır (JPG, PNG və ya PDF — maks. 8 MB).",
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
  home: {
    statCenters: "Təsdiqlənmiş mərkəz",
    statDoctors: "Qeydiyyatlı həkim",
    statPatients: "Qeydiyyatlı pasiyent",
    statServices: "Xidmət növü",
    statDistricts: "Əhatə olunan rayon",
    servicesEyebrow: "Xidmətlər",
    servicesTitle: "Bütün dental görüntüləmə xidmətləri",
    servicesDesc:
      "Diaqnostika və müalicə planlaması üçün lazım olan rentgen və tomoqrafiya növləri.",
    centerCount: "mərkəz",
    more: "Ətraflı",
    allServices: "Bütün xidmətlər",
    centersEyebrow: "Təsdiqlənmiş mərkəzlər",
    centersTitle: "Yaxınlığınızdakı rentgen mərkəzləri",
    centersDesc: "Admin tərəfindən yoxlanılmış və təsdiqlənmiş mərkəzlər.",
    viewAll: "Hamısına bax",
    centersEmptyTitle: "Tezliklə mərkəzlər əlavə olunacaq",
    centersEmptyDesc:
      "İlk təsdiqlənmiş mərkəzlər burada görünəcək. Mərkəzinizi indi əlavə edin.",
    addCenter: "Mərkəz əlavə et",
    hiwBadge: "Pasiyentlər üçün",
    hiwTitle: "3 addımda uyğun mərkəzi tapın",
    hiwDesc: "Axtarışdan əlaqəyə qədər sadə və sürətli proses.",
    step1t: "Axtarın",
    step1d: "Xidmət növü və rayona görə mərkəzləri filtirləyin.",
    step2t: "Müqayisə edin",
    step2d: "Xidmətlər, iş saatları və əlaqə məlumatına baxın.",
    step3t: "Əlaqə saxlayın",
    step3d: "Zəng və ya WhatsApp düyməsi ilə birbaşa müraciət edin.",
    findCenter: "Mərkəz axtar",
    tile1t: "Asan axtarış",
    tile1d: "Xidmət + rayon + ad üzrə filtr.",
    tile2t: "Birbaşa əlaqə",
    tile2d: "Zəng və WhatsApp düymələri.",
    tile3t: "Təsdiqlənmiş",
    tile3d: "Yoxlanılmış mərkəzlər.",
    tile4t: "Şəxsi kabinet",
    tile4d: "Müraciət tarixçəniz bir yerdə.",
    forDoctorsBadge: "Həkimlər üçün",
    forDoctorsTitle: "Pasiyentinizi etibarlı mərkəzə yönləndirin",
    forDoctorsDesc:
      "Pasiyentinizi dental rentgen və CBCT müayinəsi üçün platformadakı təsdiqlənmiş mərkəzlərə yönləndirə bilərsiniz.",
    openReferral: "Göndəriş formasını aç",
    forCentersBadge: "Rentgen mərkəzləri üçün",
    forCentersTitle: "Mərkəzinizi platformaya əlavə edin",
    forCentersDesc:
      "Qeydiyyatdan keçin, xidmət və qiymətlərinizi əlavə edin, admin təsdiqindən sonra minlərlə pasiyentə görünün.",
    safetyTitle: "Şüalanma və təhlükəsizlik haqqında",
    safetyText:
      "Müasir rəqəmsal dental rentgen və CBCT aparatlarında şüalanma dozası nəzarət altında və aşağı səviyyədədir. Müayinələr yalnız klinik göstəriş olduqda təyin edilir və həkimin dəqiq diaqnostika verməsinə kömək edir. Hamilə qadınlar müayinədən əvvəl bu barədə həkimə məlumat verməlidir.",
    readMore: "Ətraflı oxu",
    faqEyebrow: "FAQ",
    faqTitle: "Tez-tez verilən suallar",
    blogEyebrow: "Blog",
    blogTitle: "Faydalı məqalələr",
    allPosts: "Bütün məqalələr",
    read: "Oxu",
    finalTitle: "Yaxın rentgen mərkəzini indi tapın",
    finalDesc:
      "Xidmət və rayona görə axtarın, təsdiqlənmiş mərkəzlərlə birbaşa əlaqə saxlayın.",
    registerLogin: "Qeydiyyat / Giriş",
  },
  contact: {
    eyebrow: "Bizimlə əlaqə",
    title: "Əlaqə",
    description:
      "Suallarınız var? Bizimlə əlaqə saxlayın və ya aşağıdakı formanı doldurun — komandamız sizə kömək edəcək.",
    infoTitle: "Əlaqə məlumatları",
    phone: "Telefon",
    email: "E-poçt",
    address: "Ünvan",
    addressValue: "Bakı, Azərbaycan",
    hours: "İş saatları",
    hoursValue: "Hər gün 09:00 – 19:00",
    whatsappDesc: "Mesaj yazaraq sürətli cavab alın",
    whatsappCta: "WhatsApp-da yazın",
    writeTitle: "Bizə yazın",
    writeDesc:
      "Aşağıdakı formanı doldurun — sorğunuzu qəbul edib sizinlə əlaqə saxlayacağıq.",
  },
  forCenters: {
    eyebrow: "Rentgen mərkəzləri üçün",
    title: "Mərkəzinizi platformaya əlavə edin",
    description:
      "Qeydiyyatdan keçin, xidmət və qiymətlərinizi əlavə edin, admin təsdiqindən sonra minlərlə pasiyentə görünün.",
    registerCta: "Mərkəz kimi qeydiyyat",
    loginCta: "Mərkəz girişi",
    howEyebrow: "Necə işləyir",
    howTitle: "4 sadə addımda qoşulun",
    step1t: "Qeydiyyatdan keçin",
    step1d: "Telefon nömrəniz və OTP kod ilə parolsuz hesab yaradın.",
    step2t: "Profili doldurun",
    step2d: "Mərkəz məlumatları, xidmətlər, qiymətlər və şəkilləri əlavə edin.",
    step3t: "Təsdiqlənin",
    step3d: "Admin profilinizi yoxlayır və təsdiqləyir.",
    step4t: "Pasiyentlərə görünün",
    step4d: "Mərkəziniz axtarış nəticələrində “təsdiqlənmiş” nişanı ilə görünür.",
    benefitsEyebrow: "Üstünlüklər",
    benefitsTitle: "Niyə Rentgen.az?",
    benefitsDesc: "Platforma mərkəzinizi pasiyentlərlə birləşdirir və idarəetməni asanlaşdırır.",
    b1: "Bakı və regionlar üzrə pasiyentlərə görünürlük",
    b2: "Xidmət və qiymət siyahısını özünüz idarə edin",
    b3: "Zəng və WhatsApp ilə birbaşa müraciətlər",
    b4: "Həkimlərdən pasiyent göndərişləri",
    b5: "Müraciətləri kabinetdə izləyin",
    b6: "SEO sayəsində Google-da tapılma",
    freeTitle: "Qeydiyyat pulsuzdur",
    freeDesc:
      "Hesab yaratmaq və profilinizi doldurmaq üçün heç bir ödəniş tələb olunmur. Telefon nömrəniz və OTP kod ilə dərhal başlayın.",
    freeCta: "İndi qeydiyyatdan keç",
  },
  forDoctors: {
    eyebrow: "Həkimlər üçün",
    title: "Pasiyentinizi etibarlı mərkəzə yönləndirin",
    description:
      "Pasiyentinizi dental rentgen və CBCT müayinəsi üçün platformadakı təsdiqlənmiş mərkəzlərə yönləndirə bilərsiniz. Həkim kimi qeydiyyatdan keçsəniz, pasiyentlərinizin hansı mərkəzdə hansı müayinədən yararlandığını da izləyə bilərsiniz.",
    registerCta: "Həkim kimi qeydiyyat",
    loginCta: "Həkim girişi",
    f1t: "Təsdiqlənmiş mərkəzlər",
    f1d: "Yalnız yoxlanılmış mərkəzlər platformada görünür.",
    f2t: "Sürətli göndəriş",
    f2d: "Bir dəqiqədən az müddətdə göndəriş yaradın.",
    f3t: "Pasiyent rahatlığı",
    f3d: "Pasiyent yaxın və uyğun mərkəzə yönləndirilir.",
    note: "Qeyd: Bu forma vasitəsilə paylaşılan pasiyent məlumatları yalnız seçilmiş mərkəzə müayinənin təşkili məqsədilə ötürülür.",
    formTitle: "Pasiyent göndərişi forması",
    fillRequired: "Bütün məcburi sahələri doldurun.",
    partnerHint: "Partnyor mərkəzinizə pasiyent göndərin — pasiyentə OTP təsdiqi göndəriləcək.",
    noPartner:
      "Hələ partnyor mərkəziniz yoxdur. Pasiyent göndərmək üçün əvvəlcə mərkəzlərlə əməkdaşlıq qurun.",
    partnerCentersCta: "Partnyor mərkəzlər",
  },
  faqPage: {
    eyebrow: "Kömək mərkəzi",
    title: "Tez-tez verilən suallar",
    description:
      "Dental rentgen, 3D tomoqrafiya, qiymət, qeydiyyat və OTP giriş haqqında ən çox verilən sualların cavabları.",
  },
  smartSearch: {
    placeholder: "Nə axtarırsınız? Məs: panoramik, Nərimanov, CBCT…",
    hint: "İstədiyiniz sözü yazın — sizə ən uyğun mərkəzləri tapaq",
    searching: "Axtarılır…",
    empty: "Uyğun mərkəz tapılmadı. Başqa söz yoxlayın.",
    allResults: "Bütün nəticələrə bax",
  },
  auth: {
    heroTitle: "Parolsuz, sürətli və təhlükəsiz giriş",
    heroDesc:
      "Telefon nömrənizi daxil edin — sizə birdəfəlik təsdiq kodu (OTP) göndərəcəyik. Parol yadda saxlamağa ehtiyac yoxdur.",
    f1t: "Sürətli",
    f1d: "Bir neçə saniyədə hesab yaradın.",
    f2t: "Təhlükəsiz",
    f2d: "Kodlar şifrələnərək saxlanılır, 5 dəqiqə etibarlıdır.",
    f3t: "Unikal nömrə",
    f3d: "Hər telefon nömrəsi üçün bir hesab.",
    title: "Giriş / Qeydiyyat",
    subtitle: "Telefon nömrənizi daxil edin, sizə təsdiq kodu göndərəcəyik.",
    rolePatient: "Pasiyent",
    roleCenter: "Mərkəz",
    roleDoctor: "Həkim",
    phoneLabel: "Telefon nömrəsi",
    phoneHint: "0XX XXX XX XX formatında daxil edin — +994 yazmağa ehtiyac yoxdur.",
    phonePlaceholder: "050 123 45 67",
    sendCode: "Kod göndər",
    back: "Geri",
    codeTitle: "Təsdiq kodu",
    codeSentPre: "",
    codeSentPost: " nömrəsinə göndərilən 6 rəqəmli kodu daxil edin.",
    testModePre: "Test rejimi: kodunuz ",
    testModePost: " (SMS provayderi qoşulduqda görünməyəcək).",
    otpLabel: "OTP kod",
    verify: "Təsdiqlə və daxil ol",
    resendPre: "Yeni kod ",
    resendPost: " saniyədən sonra",
    resend: "Kodu yenidən göndər",
    termsPre: "Davam etməklə ",
    termsLink: "İstifadə şərtləri",
    termsMid: " və ",
    privacyLink: "Gizlilik siyasəti",
    termsPost: "ni qəbul edirsiniz.",
    errGeneric: "Xəta baş verdi",
    errCode: "Kod yanlışdır",
  },
  reviews: {
    ratingTitle: "Qiymətləndirmə",
    qService: "Xidmətin ümumi keyfiyyəti",
    qStaff: "Personalın münasibəti",
    qClean: "Təmizlik və rahatlıq",
    qWait: "Gözləmə vaxtı",
    qPrice: "Qiymət / dəyər nisbəti",
    starSuffix: " ulduz",
    allStars: "Zəhmət olmasa bütün suallara ulduz verin.",
    errGeneric: "Xəta baş verdi",
    thanks: "Rəyiniz üçün təşəkkürlər!",
    centerLabel: "Mərkəz",
    commentPlaceholder: "Təcrübəniz haqqında yazın…",
    writeReview: "Rəy göndər",
    updateReview: "Rəyi yenilə",
    firstName: "Ad",
    firstNamePh: "Adınız",
    lastName: "Soyad",
    lastNamePh: "Soyadınız",
    phoneLabel: "Telefon nömrəsi",
    phoneHint: "Təsdiq kodu bu nömrəyə gələcək.",
    phonePlaceholder: "050 123 45 67",
    doctorLabel: "Sizi göndərən həkim",
    doctorHint: "İstəyə bağlı",
    doctorNone: "Yoxdur / seçmək istəmirəm",
    doctorOther: "Digər (əl ilə yazım)",
    doctorNameLabel: "Həkimin adı",
    doctorNamePh: "Həkimin adı",
    reviewLabel: "Rəyiniz (istəyə bağlı)",
    submitOtp: "Davam et — təsdiq kodu al",
    errName: "Ad və soyadınızı yazın.",
    errPhone: "Telefon nömrənizi yazın.",
    otpSentPre: "",
    otpSentPost: " nömrəsinə təsdiq kodu göndərdik. Rəyin dərc olunması üçün kodu daxil edin.",
    otpTestMode: "Test rejimi — kod: ",
    otpLabel: "Təsdiq kodu",
    otpPlaceholder: "6 rəqəmli kod",
    send: "Rəyi göndər",
    back: "Geri",
    gotoCenter: "Mərkəzin səhifəsinə keç",
    pageTitleSuffix: " haqqında rəy",
    pageDesc:
      "Xidmətdən istifadə etdiyiniz üçün təşəkkür edirik. Təcrübənizi qiymətləndirin — rəyiniz digər pasiyentlərə kömək edəcək.",
  },
  referral: {
    doctorLabel: "Həkim",
    errCenter: "Mərkəzi seçin.",
    errName: "Pasiyentin ad və soyadını yazın.",
    errPhone: "Pasiyentin nömrəsini yazın.",
    errGeneric: "Xəta",
    submitted: "Göndəriş tamamlandı.",
    otpSentPre: "",
    otpSentPost: " nömrəsinə təsdiq kodu göndərdik. Göndərişin tamamlanması üçün pasiyentdən kodu alıb daxil edin.",
    otpTestMode: "Test rejimi — kod: ",
    otpLabel: "Təsdiq kodu",
    otpPlaceholder: "6 rəqəmli kod",
    complete: "Göndərişi tamamla",
    back: "Geri",
    centerLabel: "Mərkəz",
    centerHintPartner: "Yalnız partnyor mərkəzləriniz",
    centerFallback: "Mərkəz",
    centerPlaceholder: "Mərkəz seçin",
    serviceLabel: "Lazım olan müayinə",
    servicePickCenter: "İlk öncə mərkəzi seçin",
    serviceNone: "Bu mərkəzdə xidmət yoxdur",
    servicePick: "Müayinə seçin (istəyə bağlı)",
    firstLabel: "Pasiyentin adı",
    firstPh: "Ad",
    lastLabel: "Pasiyentin soyadı",
    lastPh: "Soyad",
    phoneLabel: "Pasiyentin telefonu",
    phoneHint: "Təsdiq kodu bu nömrəyə gedəcək.",
    phonePlaceholder: "050 123 45 67",
    dateLabel: "Tarix",
    optional: "İstəyə bağlı",
    pickCenterFirst: "İlk öncə mərkəzi seçin",
    timeLabel: "Saat",
    pickDateFirst: "Əvvəlcə tarix seçin",
    noTime: "Vaxt yoxdur",
    pickTime: "Saat seçin",
    noteLabel: "Qeyd",
    notePh: "Əlavə məlumat (istəyə bağlı)",
    submit: "Davam et — pasiyentə təsdiq kodu göndər",
  },
  blog: {
    eyebrow: "Blog",
    title: "Blog",
    description:
      "Dental rentgen, 3D tomoqrafiya və diaqnostika haqqında faydalı və etibarlı məqalələr.",
    emptyTitle: "Tezliklə məqalələr əlavə olunacaq",
    emptyDesc:
      "Hazırda yeni məzmun üzərində işləyirik. Tezliklə dental rentgen və tomoqrafiya haqqında faydalı məqalələri burada paylaşacağıq.",
    read: "Oxu",
    notFound: "Məqalə tapılmadı",
    disclaimer:
      "Bu məqalə ümumi məlumat xarakteri daşıyır və həkim məsləhətini əvəz etmir.",
    allPosts: "Bütün məqalələr",
    ctaTitle: "Yaxın rentgen mərkəzini tapın",
    ctaDesc:
      "Bölgənizə uyğun dental rentgen və tomoqrafiya mərkəzlərini araşdırın və birbaşa əlaqə saxlayın.",
    ctaButton: "Mərkəzlərə bax",
  },
  serviceDetail: {
    centersWithService: "Bu xidməti göstərən mərkəzlər",
    benefits: "Üstünlükləri",
    whenNeeded: "Hansı hallarda lazımdır?",
    related: "Əlaqəli xidmətlər",
    centersEyebrow: "Mərkəzlər",
    centersTitleTpl: "{s} xidməti göstərən mərkəzlər",
    viewAll: "Hamısına bax",
    centersEmpty: "Bu xidmət üzrə təsdiqlənmiş mərkəzlər tezliklə əlavə olunacaq.",
    addCenter: "Mərkəzinizi əlavə edin",
    faqTitleTpl: "{s} haqqında suallar",
    ctaTitleTpl: "{s} üçün mərkəz axtarırsınız?",
    ctaDesc: "Təsdiqlənmiş mərkəzləri rayona görə tapın və birbaşa əlaqə saxlayın.",
    findCenter: "Mərkəz tap",
    notFound: "Xidmət tapılmadı",
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
    faq: "Вопросы",
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
    badge: "Рентген-платформа Азербайджана",
    titleA: "Найдите в Баку центр ",
    titleHighlight: "рентгена",
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
    featuredBadge: "Рекомендуем",
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
    servicesSoon: "Список услуг скоро будет добавлен.",
    verifiedCustomer: "Проверенный клиент",
    writeReviewTitle: "Оставьте отзыв",
    updateReviewTitle: "Обновите отзыв",
    onlyAfterService: "Оставить отзыв об этом центре можно только после получения услуги.",
    sendPatient: "Направить пациента",
    sendRequest: "Отправить заявку",
    referHint: "Направьте вашего пациента в этот центр — пациенту будет отправлено OTP-подтверждение.",
    patientFallback: "Пациент",
    docsTitle: "Лицензия и документы",
    licenseLabel: "Лицензия на рентгенологию",
  },
  services: {
    eyebrow: "Диагностические услуги",
    title: "Услуги стоматологического рентгена и томографии",
    description:
      "Все виды визуализации для диагностики и планирования лечения — найдите проверенные центры для каждой.",
    categorySuffix: "— услуги",
    centerWord: "центр.",
    more: "Подробнее и центры",
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
    profileEyebrow: "Врач",
    website: "Веб-сайт",
    findCenter: "Найти центр",
    documents: "Документы",
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
    errGeneric: "Произошла ошибка",
    submitted: "Ваша заявка отправлена.",
    otpSentPre: "Мы отправили код подтверждения на номер ",
    otpSentPost: ". Введите код, чтобы заявка была зарегистрирована.",
    otpTestMode: "Тестовый режим — код: ",
    otpLabel: "Код подтверждения",
    otpPlaceholder: "6-значный код",
    verifySubmit: "Подтвердить и отправить",
    back: "Назад",
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
    residency: "Документ о резидентуре",
    internship: "Документ об интернатуре",
    specialty: "Документ о специализации",
    docsNote:
      "Все документы необязательны. Диплом, сертификат и другие документы повышают доверие к профилю (JPG, PNG или PDF — макс. 8 МБ).",
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
  home: {
    statCenters: "Проверенных центров",
    statDoctors: "Зарегистрированных врачей",
    statPatients: "Зарегистрированных пациентов",
    statServices: "Видов услуг",
    statDistricts: "Охваченных районов",
    servicesEyebrow: "Услуги",
    servicesTitle: "Все услуги стоматологической визуализации",
    servicesDesc:
      "Виды рентгена и томографии, необходимые для диагностики и планирования лечения.",
    centerCount: "центр.",
    more: "Подробнее",
    allServices: "Все услуги",
    centersEyebrow: "Проверенные центры",
    centersTitle: "Рентген-центры рядом с вами",
    centersDesc: "Центры, проверенные и подтверждённые администрацией.",
    viewAll: "Смотреть все",
    centersEmptyTitle: "Скоро появятся центры",
    centersEmptyDesc:
      "Первые проверенные центры появятся здесь. Добавьте свой центр сейчас.",
    addCenter: "Добавить центр",
    hiwBadge: "Для пациентов",
    hiwTitle: "Найдите подходящий центр за 3 шага",
    hiwDesc: "Простой и быстрый процесс — от поиска до контакта.",
    step1t: "Ищите",
    step1d: "Фильтруйте центры по виду услуги и району.",
    step2t: "Сравнивайте",
    step2d: "Смотрите услуги, часы работы и контактные данные.",
    step3t: "Свяжитесь",
    step3d: "Обращайтесь напрямую по кнопке звонка или WhatsApp.",
    findCenter: "Искать центр",
    tile1t: "Удобный поиск",
    tile1d: "Фильтр по услуге, району и названию.",
    tile2t: "Прямая связь",
    tile2d: "Кнопки звонка и WhatsApp.",
    tile3t: "Проверенные",
    tile3d: "Проверенные центры.",
    tile4t: "Личный кабинет",
    tile4d: "История обращений в одном месте.",
    forDoctorsBadge: "Для врачей",
    forDoctorsTitle: "Направьте пациента в надёжный центр",
    forDoctorsDesc:
      "Вы можете направить пациента на дентальный рентген и КЛКТ в проверенные центры платформы.",
    openReferral: "Открыть форму направления",
    forCentersBadge: "Для рентген-центров",
    forCentersTitle: "Добавьте свой центр на платформу",
    forCentersDesc:
      "Зарегистрируйтесь, добавьте услуги и цены, и после подтверждения администрацией станьте видимы тысячам пациентов.",
    safetyTitle: "О радиации и безопасности",
    safetyText:
      "В современных цифровых дентальных рентген- и КЛКТ-аппаратах доза облучения контролируется и находится на низком уровне. Обследования назначаются только при клинических показаниях и помогают врачу поставить точный диагноз. Беременным женщинам следует сообщить об этом врачу до обследования.",
    readMore: "Читать подробнее",
    faqEyebrow: "FAQ",
    faqTitle: "Часто задаваемые вопросы",
    blogEyebrow: "Блог",
    blogTitle: "Полезные статьи",
    allPosts: "Все статьи",
    read: "Читать",
    finalTitle: "Найдите ближайший рентген-центр прямо сейчас",
    finalDesc:
      "Ищите по услуге и району, связывайтесь напрямую с проверенными центрами.",
    registerLogin: "Регистрация / Вход",
  },
  contact: {
    eyebrow: "Свяжитесь с нами",
    title: "Контакты",
    description:
      "Есть вопросы? Свяжитесь с нами или заполните форму ниже — наша команда поможет вам.",
    infoTitle: "Контактная информация",
    phone: "Телефон",
    email: "Эл. почта",
    address: "Адрес",
    addressValue: "Баку, Азербайджан",
    hours: "Часы работы",
    hoursValue: "Ежедневно 09:00 – 19:00",
    whatsappDesc: "Напишите и получите быстрый ответ",
    whatsappCta: "Написать в WhatsApp",
    writeTitle: "Напишите нам",
    writeDesc:
      "Заполните форму ниже — мы примем ваш запрос и свяжемся с вами.",
  },
  forCenters: {
    eyebrow: "Для рентген-центров",
    title: "Добавьте свой центр на платформу",
    description:
      "Зарегистрируйтесь, добавьте услуги и цены, и после подтверждения администрацией станьте видимы тысячам пациентов.",
    registerCta: "Регистрация центра",
    loginCta: "Вход для центра",
    howEyebrow: "Как это работает",
    howTitle: "Присоединитесь за 4 простых шага",
    step1t: "Зарегистрируйтесь",
    step1d: "Создайте аккаунт без пароля — по номеру телефона и OTP-коду.",
    step2t: "Заполните профиль",
    step2d: "Добавьте данные центра, услуги, цены и фотографии.",
    step3t: "Пройдите проверку",
    step3d: "Администрация проверяет и подтверждает ваш профиль.",
    step4t: "Станьте видимы пациентам",
    step4d: "Ваш центр появляется в результатах поиска со значком «проверено».",
    benefitsEyebrow: "Преимущества",
    benefitsTitle: "Почему Rentgen.az?",
    benefitsDesc: "Платформа связывает ваш центр с пациентами и упрощает управление.",
    b1: "Видимость для пациентов по Баку и регионам",
    b2: "Сами управляйте списком услуг и цен",
    b3: "Прямые обращения по звонку и WhatsApp",
    b4: "Направления пациентов от врачей",
    b5: "Отслеживайте обращения в кабинете",
    b6: "Находимость в Google благодаря SEO",
    freeTitle: "Регистрация бесплатна",
    freeDesc:
      "За создание аккаунта и заполнение профиля плата не взимается. Начните сразу — по номеру телефона и OTP-коду.",
    freeCta: "Зарегистрироваться сейчас",
  },
  forDoctors: {
    eyebrow: "Для врачей",
    title: "Направьте пациента в надёжный центр",
    description:
      "Вы можете направить пациента на дентальный рентген и КЛКТ в проверенные центры платформы. Зарегистрировавшись как врач, вы также сможете отслеживать, в каком центре и какое обследование прошли ваши пациенты.",
    registerCta: "Регистрация врача",
    loginCta: "Вход для врача",
    f1t: "Проверенные центры",
    f1d: "На платформе видны только проверенные центры.",
    f2t: "Быстрое направление",
    f2d: "Создайте направление меньше чем за минуту.",
    f3t: "Удобство для пациента",
    f3d: "Пациент направляется в ближайший подходящий центр.",
    note: "Примечание: данные пациента, переданные через эту форму, используются только для организации обследования в выбранном центре.",
    formTitle: "Форма направления пациента",
    fillRequired: "Заполните все обязательные поля.",
    partnerHint: "Направьте пациента в ваш партнёрский центр — пациенту придёт OTP-подтверждение.",
    noPartner:
      "У вас пока нет партнёрских центров. Чтобы направлять пациентов, сначала установите сотрудничество с центрами.",
    partnerCentersCta: "Партнёрские центры",
  },
  faqPage: {
    eyebrow: "Центр помощи",
    title: "Часто задаваемые вопросы",
    description:
      "Ответы на частые вопросы о дентальном рентгене, 3D-томографии, ценах, регистрации и входе по OTP.",
  },
  smartSearch: {
    placeholder: "Что вы ищете? Напр.: панорамный, Нариманов, КЛКТ…",
    hint: "Напишите что ищете — подберём подходящие центры",
    searching: "Идёт поиск…",
    empty: "Подходящих центров не найдено. Попробуйте другое слово.",
    allResults: "Смотреть все результаты",
  },
  auth: {
    heroTitle: "Вход без пароля — быстро и безопасно",
    heroDesc:
      "Введите номер телефона — мы отправим вам одноразовый код (OTP). Пароль запоминать не нужно.",
    f1t: "Быстро",
    f1d: "Создайте аккаунт за несколько секунд.",
    f2t: "Безопасно",
    f2d: "Коды хранятся в зашифрованном виде и действуют 5 минут.",
    f3t: "Уникальный номер",
    f3d: "Один аккаунт на каждый номер телефона.",
    title: "Вход / Регистрация",
    subtitle: "Введите номер телефона, мы отправим вам код подтверждения.",
    rolePatient: "Пациент",
    roleCenter: "Центр",
    roleDoctor: "Врач",
    phoneLabel: "Номер телефона",
    phoneHint: "Введите в формате 0XX XXX XX XX — +994 писать не нужно.",
    phonePlaceholder: "050 123 45 67",
    sendCode: "Отправить код",
    back: "Назад",
    codeTitle: "Код подтверждения",
    codeSentPre: "Введите 6-значный код, отправленный на номер ",
    codeSentPost: ".",
    testModePre: "Тестовый режим: ваш код ",
    testModePost: " (не будет показан после подключения SMS-провайдера).",
    otpLabel: "OTP код",
    verify: "Подтвердить и войти",
    resendPre: "Новый код через ",
    resendPost: " сек",
    resend: "Отправить код повторно",
    termsPre: "Продолжая, вы принимаете ",
    termsLink: "Условия использования",
    termsMid: " и ",
    privacyLink: "Политику конфиденциальности",
    termsPost: ".",
    errGeneric: "Произошла ошибка",
    errCode: "Неверный код",
  },
  reviews: {
    ratingTitle: "Оценка",
    qService: "Общее качество услуги",
    qStaff: "Отношение персонала",
    qClean: "Чистота и комфорт",
    qWait: "Время ожидания",
    qPrice: "Соотношение цена / качество",
    starSuffix: " звёзд",
    allStars: "Пожалуйста, оцените все вопросы звёздами.",
    errGeneric: "Произошла ошибка",
    thanks: "Спасибо за ваш отзыв!",
    centerLabel: "Центр",
    commentPlaceholder: "Расскажите о вашем опыте…",
    writeReview: "Отправить отзыв",
    updateReview: "Обновить отзыв",
    firstName: "Имя",
    firstNamePh: "Ваше имя",
    lastName: "Фамилия",
    lastNamePh: "Ваша фамилия",
    phoneLabel: "Номер телефона",
    phoneHint: "Код подтверждения придёт на этот номер.",
    phonePlaceholder: "050 123 45 67",
    doctorLabel: "Врач, направивший вас",
    doctorHint: "Необязательно",
    doctorNone: "Нет / не хочу выбирать",
    doctorOther: "Другой (впишу вручную)",
    doctorNameLabel: "Имя врача",
    doctorNamePh: "Имя врача",
    reviewLabel: "Ваш отзыв (необязательно)",
    submitOtp: "Продолжить — получить код",
    errName: "Введите имя и фамилию.",
    errPhone: "Введите номер телефона.",
    otpSentPre: "Мы отправили код подтверждения на номер ",
    otpSentPost: ". Введите код для публикации отзыва.",
    otpTestMode: "Тестовый режим — код: ",
    otpLabel: "Код подтверждения",
    otpPlaceholder: "6-значный код",
    send: "Отправить отзыв",
    back: "Назад",
    gotoCenter: "Перейти на страницу центра",
    pageTitleSuffix: ": ваш отзыв",
    pageDesc:
      "Спасибо, что воспользовались услугой. Оцените ваш опыт — ваш отзыв поможет другим пациентам.",
  },
  referral: {
    doctorLabel: "Врач",
    errCenter: "Выберите центр.",
    errName: "Введите имя и фамилию пациента.",
    errPhone: "Введите номер пациента.",
    errGeneric: "Ошибка",
    submitted: "Направление отправлено.",
    otpSentPre: "Мы отправили код подтверждения на номер ",
    otpSentPost: ". Чтобы завершить направление, получите код у пациента и введите его.",
    otpTestMode: "Тестовый режим — код: ",
    otpLabel: "Код подтверждения",
    otpPlaceholder: "6-значный код",
    complete: "Завершить направление",
    back: "Назад",
    centerLabel: "Центр",
    centerHintPartner: "Только ваши партнёрские центры",
    centerFallback: "Центр",
    centerPlaceholder: "Выберите центр",
    serviceLabel: "Необходимое обследование",
    servicePickCenter: "Сначала выберите центр",
    serviceNone: "В этом центре нет услуг",
    servicePick: "Выберите обследование (необязательно)",
    firstLabel: "Имя пациента",
    firstPh: "Имя",
    lastLabel: "Фамилия пациента",
    lastPh: "Фамилия",
    phoneLabel: "Телефон пациента",
    phoneHint: "Код подтверждения придёт на этот номер.",
    phonePlaceholder: "050 123 45 67",
    dateLabel: "Дата",
    optional: "Необязательно",
    pickCenterFirst: "Сначала выберите центр",
    timeLabel: "Время",
    pickDateFirst: "Сначала выберите дату",
    noTime: "Нет времени",
    pickTime: "Выберите время",
    noteLabel: "Заметка",
    notePh: "Дополнительная информация (необязательно)",
    submit: "Продолжить — отправить код пациенту",
  },
  blog: {
    eyebrow: "Блог",
    title: "Блог",
    description:
      "Полезные и достоверные статьи о дентальном рентгене, 3D-томографии и диагностике.",
    emptyTitle: "Статьи скоро появятся",
    emptyDesc:
      "Сейчас мы работаем над новым контентом. Скоро мы будем публиковать здесь полезные статьи о дентальном рентгене и томографии.",
    read: "Читать",
    notFound: "Статья не найдена",
    disclaimer:
      "Эта статья носит общий информационный характер и не заменяет консультацию врача.",
    allPosts: "Все статьи",
    ctaTitle: "Найдите ближайший рентген-центр",
    ctaDesc:
      "Найдите центры дентального рентгена и томографии в вашем районе и свяжитесь с ними напрямую.",
    ctaButton: "Смотреть центры",
  },
  serviceDetail: {
    centersWithService: "Центры, предоставляющие эту услугу",
    benefits: "Преимущества",
    whenNeeded: "В каких случаях нужно?",
    related: "Связанные услуги",
    centersEyebrow: "Центры",
    centersTitleTpl: "Центры с услугой «{s}»",
    viewAll: "Смотреть все",
    centersEmpty: "Проверенные центры по этой услуге скоро будут добавлены.",
    addCenter: "Добавьте свой центр",
    faqTitleTpl: "Вопросы об услуге «{s}»",
    ctaTitleTpl: "Ищете центр для «{s}»?",
    ctaDesc: "Найдите проверенные центры по району и свяжитесь с ними напрямую.",
    findCenter: "Найти центр",
    notFound: "Услуга не найдена",
  },
};

const DICTS: Record<Locale, Dict> = { az, ru };

export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? az;
}
