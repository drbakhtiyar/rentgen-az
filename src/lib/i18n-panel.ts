import type { Locale } from "./i18n";

/**
 * Bilingual (az/ru) dictionary for the authenticated dashboard panels
 * (center / doctor / patient). Kept separate from the large public i18n.ts so
 * panel copy lives in one focused, easy-to-extend place. Admin panel stays AZ.
 *
 * Pure module — safe to import in both server and client components.
 */

export type PanelDict = {
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
};

const az: PanelDict = {
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
};

const ru: PanelDict = {
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
};

const PANEL_DICTS: Record<Locale, PanelDict> = { az, ru };

export function getPanelDict(locale: Locale): PanelDict {
  return PANEL_DICTS[locale] ?? az;
}
