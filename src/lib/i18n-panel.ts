import type { Locale } from "./i18n";

/**
 * Bilingual (az/ru) dictionary for the authenticated dashboard panels
 * (center / doctor / patient). Kept separate from the large public i18n.ts so
 * panel copy lives in one focused, easy-to-extend place. Admin panel stays AZ.
 *
 * Pure module — safe to import in both server and client components.
 */

export type PanelDict = {
  form: {
    firstName: string;
    firstNamePh: string;
    lastName: string;
    lastNamePh: string;
    phoneLabel: string;
    phoneHint: string;
    cityDistrict: string;
    select: string;
    birthDate: string;
    save: string;
    saved: string;
  };
  notif: {
    empty: string;
    emptyBody: string;
    markAll: string;
    now: string;
    minAgo: string;
    hourAgo: string;
    dayAgo: string;
  };
  status: {
    PENDING: string;
    APPROVED: string;
    DEACTIVATED: string;
    NEW: string;
    CONTACTED: string;
    COMPLETED: string;
    CANCELLED: string;
  };
  nav: {
    icmal: string;
    chat: string;
    bildirisler: string;
    profil: string;
    pasiyentler: string;
    xidmetler: string;
    hekimler: string;
    reyler: string;
    paket: string;
    zibil: string;
    export: string;
    merkezler: string;
    secilmisler: string;
  };
  shell: {
    backToSite: string;
    logout: string;
    switchRole: string;
    roleCenter: string;
    roleDoctor: string;
    rolePatient: string;
  };
  center: {
    roleLabel: string;
    noLicenseTitle: string;
    noLicenseBody: string;
    uploadLicense: string;
    pendingTitle: string;
    deactivatedTitle: string;
    pendingBody: string;
    deactivatedBody: string;
    statStatus: string;
    statNew: string;
    statTotal: string;
    statServices: string;
    noServicesBanner: string;
    add: string;
    recentRequests: string;
    allPatients: string;
    referringDoctor: string;
    noRequestsTitle: string;
    noRequestsBody: string;
    quickLinks: string;
    editProfile: string;
    servicesPrices: string;
    svcHelp: string;
    svcEmptyTitle: string;
    svcEmptyBody: string;
    broadcastTitle: string;
    partner: string;
    doctorsTitle: string;
    docEmptyTitle: string;
    docEmptyBody: string;
    docMessage: string;
    broadcastUpsell: string;
    viewPackage: string;
    workplaceTitle: string;
    workplaceBody: string;
    pendingRequestsTitle: string;
    qrTitle: string;
    qrHow: string;
    qrHowBody: string;
    qrDownload: string;
    reviewsTitle: string;
    revEmptyTitle: string;
    revEmptyBody: string;
    historyTitle: string;
    notificationsTitle: string;
    expLockTitle: string;
    expLockBody: string;
    toPlatinum: string;
    expCsvTitle: string;
    expCsvBody: string;
    expCsvBtn: string;
    expApiTitle: string;
    expApiBody: string;
    searchPlaceholder: string;
    searchBtn: string;
    generalRequest: string;
    sentBy: string;
    noResultTitle: string;
    noResultBody: string;
    patientsEmptyTitle: string;
    patientsEmptyBody: string;
    zbUpsellTitle: string;
    zbCurrentPlan: string;
    zbFreeInfo: string;
    zbGoldLine: string;
    zbPlatinumLine: string;
    zbUpgrade: string;
    zbDeletedFiles: string;
    zbRetentionNote: string;
    homeLink: string;
    regTitle: string;
    regSubtitle: string;
    trEmpty: string;
    trCount: string;
    trEmptyBtn: string;
    trDeletedAt: string;
    trToday: string;
    trDaysLeft: string;
    trRestore: string;
    trPurgeTitle: string;
    trConfirmPurge: string;
    trConfirmEmpty: string;
    svcPrice: string;
    svcPricePlaceholder: string;
    svcNote: string;
    svcNoteOptional: string;
    svcSave: string;
    svcSaved: string;
    svcPriceRequired: string;
    svcUpload: string;
    svcDropHint: string;
    svcDeleteConfirmPerm: string;
    svcDeleteConfirmTrash: string;
    resultAssignDoctor: string;
    resultSelectDoctor: string;
    resultLink: string;
    resultLinkHint: string;
    resultSave: string;
    resultOpen: string;
    filesLabel: string;
    downloadTitle: string;
    deleteTitle: string;
    noFilesYet: string;
    walletEmpty: string;
    walletTopup: string;
    walletPlan: string;
    walletRefund: string;
    walletAdmin: string;
    confirmContinue: string;
    uploading: string;
    deleting: string;
    cancelConfirm: string;
    cancelBtn: string;
    planExpired: string;
    planExpiringPre: string;
    planExpiringPost: string;
    renew: string;
    apiError: string;
    apiNoKey: string;
    apiRegen: string;
    apiCreate: string;
    apiHint: string;
    payActivated: string;
    payMinTopup: string;
    currentPackage: string;
    activeUntilPre: string;
    activeUntilPost: string;
    expiringShort: string;
    balanceLabel: string;
    topupBtn: string;
    durationLabel: string;
    monthWord: string;
    perMonth: string;
    discountApplied: string;
    extend: string;
    buyWithBalance: string;
    billingNote: string;
    anLockTitle: string;
    anLockBody: string;
    anLast30: string;
    anViews: string;
    anCalls: string;
    anWhatsapp: string;
    anPerService: string;
    anNoRequests: string;
    anReq30: string;
    anReferrals: string;
    bcSent: string;
    bcPlaceholder: string;
    bcIntro: string;
    bcSend: string;
    etPickDateTime: string;
    etPickDate: string;
    etNoSlots: string;
    etPickTime: string;
    etChange: string;
  };
  patient: {
    greeting: string;
    profileIncomplete: string;
    complete: string;
    statRequests: string;
    favoritesTitle: string;
    statPhone: string;
    historyTitle: string;
    generalRequest: string;
    preferredTime: string;
    openResult: string;
    reqEmptyTitle: string;
    reqEmptyBody: string;
    findCenter: string;
    reviewableTitle: string;
    updateReview: string;
    quickLinks: string;
    editProfile: string;
    favEmptyTitle: string;
    favEmptyBody: string;
    notificationsTitle: string;
  };
  doctor: {
    deactivatedTitle: string;
    pendingTitle: string;
    pendingBody: string;
    statReferrals: string;
    statPatients: string;
    statCenters: string;
    myPatients: string;
    all: string;
    requestsWord: string;
    openResult: string;
    lockedResult: string;
    refEmptyTitle: string;
    refEmptyBody: string;
    patientsEmptyTitle: string;
    patientsEmptyBody: string;
    quickReferrals: string;
    centersIntro: string;
    centersPanel: string;
    centersEmptyTitle: string;
    centersEmptyBody: string;
    dsLockTitle: string;
    dsLockBody: string;
    dsViewPackage: string;
    dsHeading: string;
    dsViews: string;
    dsSent: string;
    dsPartners: string;
  };
};

const az: PanelDict = {
  form: {
    firstName: "Ad",
    firstNamePh: "Adınız",
    lastName: "Soyad",
    lastNamePh: "Soyadınız",
    phoneLabel: "Telefon nömrəsi",
    phoneHint: "Telefon nömrəsi dəyişdirilə bilməz (hesab identifikatoru).",
    cityDistrict: "Şəhər / rayon",
    select: "Seçin",
    birthDate: "Doğum tarixi (istəyə bağlı)",
    save: "Yadda saxla",
    saved: "Yadda saxlanıldı",
  },
  notif: {
    empty: "Bildiriş yoxdur",
    emptyBody: "Yeni pasiyent, fayl və ya mesaj olduqda burada görünəcək.",
    markAll: "Hamısını oxundu işarələ",
    now: "indi",
    minAgo: "dəq əvvəl",
    hourAgo: "saat əvvəl",
    dayAgo: "gün əvvəl",
  },
  status: {
    PENDING: "Gözləmədə",
    APPROVED: "Təsdiqlənib",
    DEACTIVATED: "Deaktiv",
    NEW: "Yeni",
    CONTACTED: "Əlaqə saxlanılıb",
    COMPLETED: "Tamamlanıb",
    CANCELLED: "Ləğv edilib",
  },
  nav: {
    icmal: "İcmal",
    chat: "Söhbətlər",
    bildirisler: "Bildirişlər",
    profil: "Profil",
    pasiyentler: "Pasiyentlər",
    xidmetler: "Xidmətlər və qiymətlər",
    hekimler: "Partnyor həkimlər",
    reyler: "Rəylər",
    paket: "Paket / Balans",
    zibil: "Zibil qutusu",
    export: "Export / API",
    merkezler: "Partnyor mərkəzlər",
    secilmisler: "Seçilmişlər",
  },
  shell: {
    backToSite: "← Sayta qayıt",
    logout: "Çıxış",
    switchRole: "Rolu dəyiş",
    roleCenter: "Mərkəz",
    roleDoctor: "Həkim",
    rolePatient: "Pasiyent",
  },
  center: {
    roleLabel: "Rentgen mərkəzi",
    noLicenseTitle: "Rentgenologiya lisenziyası yüklənməyib",
    noLicenseBody: "Profilinizin tam qeydiyyatı üçün rentgenologiya üzrə lisenziya sənədini yükləyin.",
    uploadLicense: "Lisenziya yüklə",
    pendingTitle: "Profiliniz admin təsdiqini gözləyir",
    deactivatedTitle: "Profiliniz deaktiv edilib",
    pendingBody: "Təsdiqdən sonra mərkəziniz axtarış nəticələrində görünəcək. Bu vaxt ərzində profil və xidmətləri tamamlaya bilərsiniz.",
    deactivatedBody: "Yenidən aktivləşdirmə üçün adminlə əlaqə saxlayın.",
    statStatus: "Status",
    statNew: "Yeni müraciətlər",
    statTotal: "Ümumi müraciətlər",
    statServices: "Xidmətlər",
    noServicesBanner: "Hələ xidmət əlavə etməmisiniz. Pasiyentlərin sizi tapması üçün xidmət və qiymətləri əlavə edin.",
    add: "Əlavə et",
    recentRequests: "Son müraciətlər",
    allPatients: "Bütün pasiyentlər",
    referringDoctor: "Göndərən həkim:",
    noRequestsTitle: "Hələ müraciət yoxdur",
    noRequestsBody: "Pasiyent müraciətləri burada görünəcək.",
    quickLinks: "Tez keçidlər",
    editProfile: "Profili redaktə et",
    servicesPrices: "Xidmət və qiymətlər",
    svcHelp: "Mərkəzinizin göstərdiyi xidmətləri seçin və hər biri üçün fiks qiymət (₼) əlavə edin. Xidmət seçəndə qiymət yazmaq məcburidir.",
    svcEmptyTitle: "Xidmət kataloqu boşdur",
    svcEmptyBody: "Sistemdə xidmətlər hələ əlavə olunmayıb. Zəhmət olmasa adminlə əlaqə saxlayın (seed/migrasiya tələb oluna bilər).",
    broadcastTitle: "Partnyor həkimlərə toplu mesaj",
    partner: "Partnyor",
    doctorsTitle: "Partnyor həkimlər",
    docEmptyTitle: "Hələ partnyor həkim yoxdur",
    docEmptyBody: "Həkimlər əməkdaşlıq sorğusu göndərdikdə burada görünəcək.",
    docMessage: "Mesaj",
    broadcastUpsell: "Partnyor həkimlərə toplu mesaj Gold və Platinum paketlərdə mövcuddur.",
    viewPackage: "Paketə bax",
    workplaceTitle: "İş yeri təsdiqləri",
    workplaceBody: "Bu həkimlər sizi iş yeri kimi göstərib. Təsdiqləsəniz, həkimin profilində mərkəziniz link kimi görünəcək.",
    pendingRequestsTitle: "Gözləyən sorğular",
    qrTitle: "Rəy toplamaq üçün QR kod",
    qrHow: "Necə işləyir?",
    qrHowBody: "Bu QR kodu çap edib registraturada yerləşdirin. Mərkəzinizdə rentgen çəkdirən pasiyent kodu skan edəndə mərkəziniz artıq seçilmiş halda rəy forması açılır — telefon təsdiqi (OTP) ilə rəy yazır.",
    qrDownload: "QR kodu yüklə",
    reviewsTitle: "Pasiyent rəyləri",
    revEmptyTitle: "Hələ rəy yoxdur",
    revEmptyBody: "Xidmət aldığını təsdiqləyən pasiyentlər rəy yaza bilər.",
    historyTitle: "Ödəniş və balans tarixçəsi",
    notificationsTitle: "Bildirişlər",
    expLockTitle: "Export və API — Platinum funksiyası",
    expLockBody: "Məlumat exportu və API girişi yalnız Platinum paketdə mövcuddur.",
    toPlatinum: "Platinum-a keç",
    expCsvTitle: "Məlumat exportu (CSV)",
    expCsvBody: "Bütün pasiyent müraciətlərinizi Excel-uyğun CSV faylı kimi endirin.",
    expCsvBtn: "Müraciətləri endir (CSV)",
    expApiTitle: "API girişi",
    expApiBody: "Öz sisteminizi inteqrasiya etmək üçün API açarınız. Aşağıdakı ünvana sorğu göndərin:",
    searchPlaceholder: "Ad və ya telefon üzrə axtar",
    searchBtn: "Axtar",
    generalRequest: "Ümumi müraciət",
    sentBy: "Göndərən:",
    noResultTitle: "Nəticə tapılmadı",
    noResultBody: "Axtarışa uyğun pasiyent yoxdur.",
    patientsEmptyTitle: "Hələ pasiyent yoxdur",
    patientsEmptyBody: "Pasiyentlər müraciət etdikcə burada görünəcək.",
    zbUpsellTitle: "Zibil qutusu — Gold və Platinum imkanı",
    zbCurrentPlan: "Hazırkı paket",
    zbFreeInfo: "Bu paketdə silinən rentgen faylı dərhal həmişəlik silinir və bərpa oluna bilməz.",
    zbGoldLine: "Gold: silinən fayllar 1 ay saxlanılır və bərpa oluna bilər.",
    zbPlatinumLine: "Platinum: silinən fayllar 3 ay saxlanılır və bərpa oluna bilər.",
    zbUpgrade: "Paketi yüksəlt",
    zbDeletedFiles: "Silinmiş fayllar",
    zbRetentionNote: "Bu paketdə silinən fayllar zibil qutusunda saxlanılır və müddət bitənə qədər bərpa oluna bilər; sonra avtomatik həmişəlik silinir.",
    homeLink: "Ana səhifə",
    regTitle: "Mərkəz profilini yaradın",
    regSubtitle: "Məlumatları doldurun — admin təsdiqindən sonra mərkəziniz saytda görünəcək.",
    trEmpty: "Zibil qutusu boşdur.",
    trCount: "fayl zibil qutusundadır",
    trEmptyBtn: "Zibili boşalt",
    trDeletedAt: "silinib:",
    trToday: "bu gün silinir",
    trDaysLeft: "gün qalıb",
    trRestore: "Bərpa et",
    trPurgeTitle: "Həmişəlik sil",
    trConfirmPurge: "Bu fayl həmişəlik silinəcək və bərpa oluna bilməyəcək. Davam edilsin?",
    trConfirmEmpty: "Zibil qutusu tamamilə boşaldılacaq. Bütün fayllar həmişəlik silinəcək. Davam edilsin?",
    svcPrice: "Qiymət (₼)",
    svcPricePlaceholder: "Fiks qiymət",
    svcNote: "Qeyd",
    svcNoteOptional: "İstəyə bağlı",
    svcSave: "Yadda saxla",
    svcSaved: "Yadda saxlanıldı",
    svcPriceRequired: "Seçdiyiniz hər xidmət üçün qiymət (₼) yazın.",
    svcUpload: "Fayl yüklə",
    svcDropHint: "Faylı bura sürüşdürün və ya yuxarıdakı düymə ilə seçin",
    svcDeleteConfirmPerm: "Bu fayl həmişəlik silinəcək və bərpa oluna bilməyəcək. Davam edilsin?",
    svcDeleteConfirmTrash: "Bu fayl zibil qutusuna atılacaq.",
    resultAssignDoctor: "Yönləndirən həkim (pasiyent seçməyibsə)",
    resultSelectDoctor: "Həkim seçin",
    resultLink: "Xarici link (istəyə bağlı)",
    resultLinkHint: "Faylı birbaşa yükləmək əvəzinə xarici bulud linki də əlavə edə bilərsiniz.",
    resultSave: "Yadda saxla",
    resultOpen: "Aç",
    filesLabel: "Rentgen faylları",
    downloadTitle: "Endir",
    deleteTitle: "Sil",
    noFilesYet: "Hələ fayl yüklənməyib.",
    walletEmpty: "Hələ heç bir hərəkət yoxdur.",
    walletTopup: "Balans artırma",
    walletPlan: "Paket alışı",
    walletRefund: "Geri qaytarma",
    walletAdmin: "Admin düzəlişi",
    confirmContinue: "Davam edilsin?",
    uploading: "Yüklənir",
    deleting: "Silinir…",
    cancelConfirm: "Müraciəti ləğv etmək istədiyinizə əminsiniz?",
    cancelBtn: "Ləğv et",
    planExpired: "Paketinizin vaxtı bitib — yeniləmək üçün ödəniş lazımdır.",
    planExpiringPre: "Paketinizin vaxtı bitir",
    planExpiringPost: "gün qalıb. Ödəniş lazımdır.",
    renew: "Yenilə",
    apiError: "Xəta baş verdi",
    apiNoKey: "— açar hələ yaradılmayıb —",
    apiRegen: "Yenilə",
    apiCreate: "Açar yarat",
    apiHint: "Açarı gizli saxlayın. Yeniləsəniz, köhnə açar dərhal etibarsız olur.",
    payActivated: "Paket aktivləşdi.",
    payMinTopup: "Minimum 1 ₼.",
    currentPackage: "Cari paket",
    activeUntilPre: "Aktivdir:",
    activeUntilPost: "-ə kimi",
    expiringShort: "Vaxtınız bitir — paketi yeniləyin.",
    balanceLabel: "Balans",
    topupBtn: "Balans artır",
    durationLabel: "Ödəniş müddəti:",
    monthWord: "ay",
    perMonth: "/ay",
    discountApplied: "endirim tətbiq olunur",
    extend: "Uzat",
    buyWithBalance: "Balansla al",
    billingNote: "Paket balansdan ödənilir. Uzun müddət seçəndə endirim tətbiq olunur (6 ay −10%, 12 ay −20%). Balans artırma Payriff (kart / Apple Pay) ilə həyata keçir.",
    anLockTitle: "Analitika Silver paketdən başlayır",
    anLockBody: "Baxış, zəng və WhatsApp statistikasını görmək üçün paketi yüksəldin.",
    anLast30: "Son 30 gün",
    anViews: "Profil baxışları",
    anCalls: "Zəng klikləri",
    anWhatsapp: "WhatsApp klikləri",
    anPerService: "Xidmət üzrə müraciətlər",
    anNoRequests: "Hələ müraciət yoxdur.",
    anReq30: "Son 30 gün müraciət",
    anReferrals: "Həkim yönləndirmələri",
    bcSent: "Göndərildi.",
    bcPlaceholder: "Məsələn: Bu həftə CBCT xidmətində 20% endirim...",
    bcIntro: "Bütün təsdiqlənmiş partnyor həkimlərinizə bir mesaj göndərin.",
    bcSend: "Toplu mesaj göndər",
    etPickDateTime: "Tarix və saat seçin.",
    etPickDate: "Əvvəlcə tarix seçin",
    etNoSlots: "Vaxt yoxdur",
    etPickTime: "Saat seçin",
    etChange: "Vaxtı dəyiş",
  },
  patient: {
    greeting: "Salam",
    profileIncomplete: "Profilinizi tamamlayın — ad və soyadınızı əlavə edin.",
    complete: "Tamamla",
    statRequests: "Müraciətlər",
    favoritesTitle: "Seçilmiş mərkəzlər",
    statPhone: "Telefon",
    historyTitle: "Müraciət tarixçəsi",
    generalRequest: "Ümumi müraciət",
    preferredTime: "Seçilmiş vaxt:",
    openResult: "Rentgen nəticəsini aç / yüklə",
    reqEmptyTitle: "Hələ müraciətiniz yoxdur",
    reqEmptyBody: "Mərkəz axtarıb müraciət göndərdikdə burada görünəcək.",
    findCenter: "Mərkəz axtar",
    reviewableTitle: "Rəy yaza biləcəyiniz mərkəzlər",
    updateReview: "Rəyinizi yeniləyə bilərsiniz",
    quickLinks: "Tez keçidlər",
    editProfile: "Profili redaktə et",
    favEmptyTitle: "Seçilmiş mərkəz yoxdur",
    favEmptyBody: "Bəyəndiyiniz mərkəzləri seçilmişlərə əlavə edin və burada saxlayın.",
    notificationsTitle: "Bildirişlər",
  },
  doctor: {
    deactivatedTitle: "Profiliniz deaktiv edilib",
    pendingTitle: "Profiliniz admin təsdiqini gözləyir",
    pendingBody: "Təsdiqlənənə qədər pasiyentlərin seçim siyahısında görünməyəcəksiniz.",
    statReferrals: "Yönləndirmələr",
    statPatients: "Pasiyentlər",
    statCenters: "Mərkəzlər",
    myPatients: "Pasiyentlərim",
    all: "Hamısı",
    requestsWord: "müraciət",
    openResult: "Rentgen nəticəsini aç",
    lockedResult: "Nəticəni görmək üçün bu mərkəzlə əməkdaşlıq sorğusu göndərin.",
    refEmptyTitle: "Hələ yönləndirmə yoxdur",
    refEmptyBody: "Pasiyentlər müraciət edərkən sizi seçəndə burada görünəcək.",
    patientsEmptyTitle: "Hələ pasiyent yoxdur",
    patientsEmptyBody: "Pasiyentlər müraciət edərkən sizi seçəndə burada görünəcək.",
    quickReferrals: "Sürətli göndərişlərim",
    centersIntro: "Mərkəzlərlə əməkdaşlıq qurun. Sorğunuz qəbul edildikdən sonra həmin mərkəzə yönləndirdiyiniz pasiyentlərin rentgen nəticələrini panelinizdə görə biləcəksiniz.",
    centersPanel: "Mərkəzlər",
    centersEmptyTitle: "Mərkəz yoxdur",
    centersEmptyBody: "Təsdiqlənmiş mərkəz hələ yoxdur.",
    dsLockTitle: "Statistika Silver paketdən başlayır",
    dsLockBody: "Profil baxışları və göndəriş statistikanızı görmək üçün paketi yüksəldin.",
    dsViewPackage: "Paketə bax",
    dsHeading: "Statistika",
    dsViews: "Profil baxışları (30 gün)",
    dsSent: "Göndərdiyiniz pasiyentlər",
    dsPartners: "Partnyor mərkəzlər",
  },
};

const ru: PanelDict = {
  form: {
    firstName: "Имя",
    firstNamePh: "Ваше имя",
    lastName: "Фамилия",
    lastNamePh: "Ваша фамилия",
    phoneLabel: "Номер телефона",
    phoneHint: "Номер телефона нельзя изменить (идентификатор аккаунта).",
    cityDistrict: "Город / район",
    select: "Выберите",
    birthDate: "Дата рождения (необязательно)",
    save: "Сохранить",
    saved: "Сохранено",
  },
  notif: {
    empty: "Уведомлений нет",
    emptyBody: "Появятся здесь при новом пациенте, файле или сообщении.",
    markAll: "Отметить все как прочитанные",
    now: "сейчас",
    minAgo: "мин назад",
    hourAgo: "ч назад",
    dayAgo: "дн назад",
  },
  status: {
    PENDING: "Ожидание",
    APPROVED: "Подтверждён",
    DEACTIVATED: "Неактивен",
    NEW: "Новая",
    CONTACTED: "Связались",
    COMPLETED: "Завершено",
    CANCELLED: "Отменено",
  },
  nav: {
    icmal: "Обзор",
    chat: "Чаты",
    bildirisler: "Уведомления",
    profil: "Профиль",
    pasiyentler: "Пациенты",
    xidmetler: "Услуги и цены",
    hekimler: "Врачи-партнёры",
    reyler: "Отзывы",
    paket: "Пакет / Баланс",
    zibil: "Корзина",
    export: "Экспорт / API",
    merkezler: "Центры-партнёры",
    secilmisler: "Избранное",
  },
  shell: {
    backToSite: "← На сайт",
    logout: "Выход",
    switchRole: "Сменить роль",
    roleCenter: "Центр",
    roleDoctor: "Врач",
    rolePatient: "Пациент",
  },
  center: {
    roleLabel: "Рентген-центр",
    noLicenseTitle: "Лицензия на рентгенологию не загружена",
    noLicenseBody: "Для полной регистрации профиля загрузите документ лицензии на рентгенологию.",
    uploadLicense: "Загрузить лицензию",
    pendingTitle: "Ваш профиль ожидает подтверждения администратора",
    deactivatedTitle: "Ваш профиль деактивирован",
    pendingBody: "После подтверждения ваш центр появится в результатах поиска. А пока вы можете заполнить профиль и услуги.",
    deactivatedBody: "Для повторной активации свяжитесь с администратором.",
    statStatus: "Статус",
    statNew: "Новые заявки",
    statTotal: "Всего заявок",
    statServices: "Услуги",
    noServicesBanner: "Вы ещё не добавили услуги. Чтобы пациенты вас находили, добавьте услуги и цены.",
    add: "Добавить",
    recentRequests: "Последние заявки",
    allPatients: "Все пациенты",
    referringDoctor: "Направил врач:",
    noRequestsTitle: "Заявок пока нет",
    noRequestsBody: "Заявки пациентов появятся здесь.",
    quickLinks: "Быстрые ссылки",
    editProfile: "Редактировать профиль",
    servicesPrices: "Услуги и цены",
    svcHelp: "Выберите услуги, которые предоставляет ваш центр, и укажите для каждой фиксированную цену (₼). При выборе услуги цена обязательна.",
    svcEmptyTitle: "Каталог услуг пуст",
    svcEmptyBody: "Услуги в системе ещё не добавлены. Пожалуйста, свяжитесь с администратором (может потребоваться seed/миграция).",
    broadcastTitle: "Массовое сообщение врачам-партнёрам",
    partner: "Партнёр",
    doctorsTitle: "Врачи-партнёры",
    docEmptyTitle: "Врачей-партнёров пока нет",
    docEmptyBody: "Когда врачи отправят запрос на сотрудничество, они появятся здесь.",
    docMessage: "Сообщение",
    broadcastUpsell: "Массовое сообщение врачам-партнёрам доступно в пакетах Gold и Platinum.",
    viewPackage: "Посмотреть пакет",
    workplaceTitle: "Подтверждения места работы",
    workplaceBody: "Эти врачи указали вас как место работы. Если подтвердите, ваш центр появится ссылкой в профиле врача.",
    pendingRequestsTitle: "Ожидающие запросы",
    qrTitle: "QR-код для сбора отзывов",
    qrHow: "Как это работает?",
    qrHowBody: "Распечатайте этот QR-код и разместите его на ресепшене. Когда пациент, сделавший рентген в вашем центре, отсканирует код, откроется форма отзыва с уже выбранным вашим центром — отзыв оставляется после подтверждения по телефону (OTP).",
    qrDownload: "Скачать QR-код",
    reviewsTitle: "Отзывы пациентов",
    revEmptyTitle: "Отзывов пока нет",
    revEmptyBody: "Пациенты, подтвердившие получение услуги, могут оставить отзыв.",
    historyTitle: "История платежей и баланса",
    notificationsTitle: "Уведомления",
    expLockTitle: "Экспорт и API — функция Platinum",
    expLockBody: "Экспорт данных и доступ к API доступны только в пакете Platinum.",
    toPlatinum: "Перейти на Platinum",
    expCsvTitle: "Экспорт данных (CSV)",
    expCsvBody: "Скачайте все заявки пациентов в виде CSV-файла, совместимого с Excel.",
    expCsvBtn: "Скачать заявки (CSV)",
    expApiTitle: "Доступ к API",
    expApiBody: "Ваш API-ключ для интеграции собственной системы. Отправляйте запрос на адрес ниже:",
    searchPlaceholder: "Поиск по имени или телефону",
    searchBtn: "Найти",
    generalRequest: "Общая заявка",
    sentBy: "Направил:",
    noResultTitle: "Ничего не найдено",
    noResultBody: "Нет пациентов по вашему запросу.",
    patientsEmptyTitle: "Пациентов пока нет",
    patientsEmptyBody: "Пациенты появятся здесь по мере заявок.",
    zbUpsellTitle: "Корзина — возможность Gold и Platinum",
    zbCurrentPlan: "Текущий пакет",
    zbFreeInfo: "В этом пакете удалённый рентген-файл сразу удаляется навсегда и не может быть восстановлен.",
    zbGoldLine: "Gold: удалённые файлы хранятся 1 месяц и могут быть восстановлены.",
    zbPlatinumLine: "Platinum: удалённые файлы хранятся 3 месяца и могут быть восстановлены.",
    zbUpgrade: "Повысить пакет",
    zbDeletedFiles: "Удалённые файлы",
    zbRetentionNote: "В этом пакете удалённые файлы хранятся в корзине и могут быть восстановлены до истечения срока; затем автоматически удаляются навсегда.",
    homeLink: "Главная",
    regTitle: "Создайте профиль центра",
    regSubtitle: "Заполните данные — после подтверждения администратором ваш центр появится на сайте.",
    trEmpty: "Корзина пуста.",
    trCount: "файлов в корзине",
    trEmptyBtn: "Очистить корзину",
    trDeletedAt: "удалён:",
    trToday: "удаляется сегодня",
    trDaysLeft: "дн. осталось",
    trRestore: "Восстановить",
    trPurgeTitle: "Удалить навсегда",
    trConfirmPurge: "Этот файл будет удалён навсегда и не может быть восстановлен. Продолжить?",
    trConfirmEmpty: "Корзина будет полностью очищена. Все файлы удалятся навсегда. Продолжить?",
    svcPrice: "Цена (₼)",
    svcPricePlaceholder: "Фикс. цена",
    svcNote: "Примечание",
    svcNoteOptional: "Необязательно",
    svcSave: "Сохранить",
    svcSaved: "Сохранено",
    svcPriceRequired: "Укажите цену (₼) для каждой выбранной услуги.",
    svcUpload: "Загрузить файл",
    svcDropHint: "Перетащите файл сюда или выберите кнопкой выше",
    svcDeleteConfirmPerm: "Этот файл будет удалён навсегда и не может быть восстановлен. Продолжить?",
    svcDeleteConfirmTrash: "Файл будет перемещён в корзину.",
    resultAssignDoctor: "Направивший врач (если пациент не выбрал)",
    resultSelectDoctor: "Выберите врача",
    resultLink: "Внешняя ссылка (необязательно)",
    resultLinkHint: "Вместо прямой загрузки файла можно добавить внешнюю облачную ссылку.",
    resultSave: "Сохранить",
    resultOpen: "Открыть",
    filesLabel: "Файлы рентгена",
    downloadTitle: "Скачать",
    deleteTitle: "Удалить",
    noFilesYet: "Файлы ещё не загружены.",
    walletEmpty: "Операций пока нет.",
    walletTopup: "Пополнение баланса",
    walletPlan: "Покупка пакета",
    walletRefund: "Возврат",
    walletAdmin: "Корректировка админа",
    confirmContinue: "Продолжить?",
    uploading: "Загрузка",
    deleting: "Удаление…",
    cancelConfirm: "Вы уверены, что хотите отменить заявку?",
    cancelBtn: "Отменить",
    planExpired: "Срок вашего пакета истёк — для продления нужна оплата.",
    planExpiringPre: "Срок вашего пакета истекает",
    planExpiringPost: "дн. осталось. Требуется оплата.",
    renew: "Продлить",
    apiError: "Произошла ошибка",
    apiNoKey: "— ключ ещё не создан —",
    apiRegen: "Обновить",
    apiCreate: "Создать ключ",
    apiHint: "Держите ключ в секрете. При обновлении старый ключ сразу станет недействительным.",
    payActivated: "Пакет активирован.",
    payMinTopup: "Минимум 1 ₼.",
    currentPackage: "Текущий пакет",
    activeUntilPre: "Активен до:",
    activeUntilPost: "",
    expiringShort: "Срок истекает — продлите пакет.",
    balanceLabel: "Баланс",
    topupBtn: "Пополнить баланс",
    durationLabel: "Срок оплаты:",
    monthWord: "мес.",
    perMonth: "/мес.",
    discountApplied: "скидка применяется",
    extend: "Продлить",
    buyWithBalance: "Купить с баланса",
    billingNote: "Пакет оплачивается с баланса. При выборе длительного срока применяется скидка (6 мес. −10%, 12 мес. −20%). Пополнение баланса — через Payriff (карта / Apple Pay).",
    anLockTitle: "Аналитика доступна с пакета Silver",
    anLockBody: "Чтобы видеть статистику просмотров, звонков и WhatsApp, повысьте пакет.",
    anLast30: "Последние 30 дней",
    anViews: "Просмотры профиля",
    anCalls: "Клики по звонку",
    anWhatsapp: "Клики по WhatsApp",
    anPerService: "Заявки по услугам",
    anNoRequests: "Заявок пока нет.",
    anReq30: "Заявки за 30 дней",
    anReferrals: "Направления врачей",
    bcSent: "Отправлено.",
    bcPlaceholder: "Например: на этой неделе скидка 20% на КЛКТ...",
    bcIntro: "Отправьте сообщение всем вашим подтверждённым врачам-партнёрам.",
    bcSend: "Отправить массовое сообщение",
    etPickDateTime: "Выберите дату и время.",
    etPickDate: "Сначала выберите дату",
    etNoSlots: "Нет времени",
    etPickTime: "Выберите время",
    etChange: "Изменить время",
  },
  patient: {
    greeting: "Здравствуйте",
    profileIncomplete: "Заполните профиль — добавьте имя и фамилию.",
    complete: "Заполнить",
    statRequests: "Заявки",
    favoritesTitle: "Избранные центры",
    statPhone: "Телефон",
    historyTitle: "История заявок",
    generalRequest: "Общая заявка",
    preferredTime: "Выбранное время:",
    openResult: "Открыть / скачать результат рентгена",
    reqEmptyTitle: "Заявок пока нет",
    reqEmptyBody: "Когда вы найдёте центр и отправите заявку, она появится здесь.",
    findCenter: "Найти центр",
    reviewableTitle: "Центры, которым можно оставить отзыв",
    updateReview: "Вы можете обновить свой отзыв",
    quickLinks: "Быстрые ссылки",
    editProfile: "Редактировать профиль",
    favEmptyTitle: "Нет избранных центров",
    favEmptyBody: "Добавляйте понравившиеся центры в избранное и храните их здесь.",
    notificationsTitle: "Уведомления",
  },
  doctor: {
    deactivatedTitle: "Ваш профиль деактивирован",
    pendingTitle: "Ваш профиль ожидает подтверждения администратора",
    pendingBody: "Пока профиль не подтверждён, вы не будете видны в списке выбора пациентов.",
    statReferrals: "Направления",
    statPatients: "Пациенты",
    statCenters: "Центры",
    myPatients: "Мои пациенты",
    all: "Все",
    requestsWord: "заявок",
    openResult: "Открыть результат рентгена",
    lockedResult: "Чтобы увидеть результат, отправьте этому центру запрос на сотрудничество.",
    refEmptyTitle: "Направлений пока нет",
    refEmptyBody: "Появятся здесь, когда пациенты выберут вас при заявке.",
    patientsEmptyTitle: "Пациентов пока нет",
    patientsEmptyBody: "Появятся здесь, когда пациенты выберут вас при заявке.",
    quickReferrals: "Мои быстрые направления",
    centersIntro: "Налаживайте сотрудничество с центрами. После принятия вашего запроса вы сможете видеть результаты рентгена пациентов, направленных в этот центр, прямо в панели.",
    centersPanel: "Центры",
    centersEmptyTitle: "Центров нет",
    centersEmptyBody: "Подтверждённых центров пока нет.",
    dsLockTitle: "Статистика доступна с пакета Silver",
    dsLockBody: "Чтобы видеть просмотры профиля и статистику направлений, повысьте пакет.",
    dsViewPackage: "Посмотреть пакет",
    dsHeading: "Статистика",
    dsViews: "Просмотры профиля (30 дней)",
    dsSent: "Отправленные пациенты",
    dsPartners: "Центры-партнёры",
  },
};

const PANEL_DICTS: Record<Locale, PanelDict> = { az, ru };

export function getPanelDict(locale: Locale): PanelDict {
  return PANEL_DICTS[locale] ?? az;
}
