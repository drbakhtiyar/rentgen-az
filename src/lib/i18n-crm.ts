import type { Locale } from "./i18n";

/**
 * Bilingual (az/ru) dictionary for the CRM subdomain (crm.rentgen.az).
 * Pure module — safe on server and client (client components read the locale
 * via useLocale from the DashboardShell's LocaleProvider).
 */

export type CrmDict = {
  common: {
    min: string; // "dəq"
    notInSystem: string;
    inSystem: string;
    addPatient: string;
    cancel: string;
    save: string;
    del: string;
    close: string;
  };
  today: {
    title: string;
    statToday: string;
    statUpcoming: string;
    statNew: string;
    statPatients: string;
    scheduleTitle: string;
    emptyTitle: string;
    emptyDesc: string;
    smsOut: string;
    smsLowPre: string; // `SMS balansınız azalır (X qalıb).`
    smsLowPost: string;
    smsBuyLink: string;
    slotOffPre: string;
    slotOffLink: string;
    slotOffPost: string;
  };
  calendar: {
    title: string;
    day: string;
    week: string;
    threeDay: string;
    month: string;
    todayBtn: string;
    thisMonth: string;
    prev: string;
    next: string;
    closedDay: string;
    apptWord: string; // "randevu"
    legendNew: string;
    legendConfirmed: string;
    legendCompleted: string;
    legendCancelled: string;
    blockTime: string;
    newAppt: string;
  };
  patients: {
    title: string;
    countWord: string;
    note: string;
    baseTitle: string;
    emptyTitle: string;
    emptyDesc: string;
    thName: string;
    thPhone: string;
    thVisits: string;
    thLast: string;
    thNext: string;
    thStatus: string;
    thSms: string;
    lapsed: string;
    recall: string;
    recallDone: string;
    invite: string;
    inviteDone: string;
    backToList: string;
    visitWord: string;
    referringDoctor: string;
    fileGate: string;
  };
  sms: {
    title: string;
    subtitle: string; // sender note
    statBalance: string;
    statMonth: string;
    statTotal: string;
    campaignTitle: string;
    buyTitle: string;
    buyNote: string;
    historyTitle: string;
    logTitle: string;
    lowZero: string;
    lowPre: string;
    lowPost: string;
  };
  settings: {
    title: string;
    slotTitle: string;
    holidaysTitle: string;
    hoursTitle: string;
    hoursBody: string;
    hoursNone: string;
    hoursEdit: string;
    durTitle: string;
    durBody: string;
    durEdit: string;
  };
  upsell: {
    title: string;
    desc: string;
    f1: string;
    f2: string;
    f3: string;
    goPlatinum: string;
    viewPackages: string;
  };
  forms: {
    nameLabel: string; namePh: string;
    phoneLabel: string; phonePh: string;
    serviceLabel: string; serviceNone: string;
    dateLabel: string; timeLabel: string;
    noteLabel: string; notePh: string;
    confirmedNote: string;
    newTitle: string; editTitle: string;
    add: string; card: string;
    delConfirm: string; delFilesFirst: string;
  };
  block: {
    title: string; desc: string;
    start: string; end: string;
    reasonLabel: string; reasonPh: string;
    submit: string; closed: string; fixed: string; delConfirm: string;
  };
  resched: {
    title: string; question: string; hint: string;
    yes: string; no: string; cancel: string;
  };
  slotForm: {
    toggleTitle: string; toggleDesc: string;
    stepLabel: string; stepHint: string;
    capLabel: string; capHint: string;
    lunchTitle: string; lunchDesc: string;
    start: string; end: string; daysLabel: string;
    days: [string, string, string, string, string, string, string];
    remTitle: string; remDesc: string; hoursBefore: string; hoursWord: string;
    saved: string;
  };
  holidays: {
    desc: string; empty: string;
    dateLabel: string; reasonLabel: string; reasonPh: string; add: string;
  };
  smsBuy: {
    balanceLabel: string; topup: string;
    stockPre: string; stockPost: string;
    smsWord: string; buy: string; outOfStock: string; noMoney: string;
    donePost: string; confirmPre: string; confirmPost: string;
  };
  campaign: {
    audAll: string; audAllHint: string;
    audLapsed: string; audLapsedHint: string;
    audSys: string; audSysHint: string;
    ph: string; counterNote: string; recip: string; balance: string;
    lowPre: string; lowMid: string;
    send: string; sent: string; failed: string; left: string; stopped: string;
  };
  labels: {
    kindReminder: string; kindCampaign: string; kindOther: string;
    kindCenterReq: string; kindPatientStatus: string;
    sentOk: string; sentFail: string;
    orderPending: string; orderPaid: string; orderCancelled: string;
    gift: string; purchase: string; noOps: string; noSms: string;
  };
  assistants: {
    title: string; desc: string; empty: string;
    addBtn: string; first: string; last: string; phone: string;
    sendCode: string; codeLabel: string; confirmBtn: string; back: string;
    otpSentPre: string; otpSentPost: string;
    activeOn: string; activeOff: string; removeConfirm: string;
    ownerOnly: string; loginHint: string; limitNote: string;
  };
};

const az: CrmDict = {
  common: {
    min: "dəq",
    notInSystem: "sistemdə deyil",
    inSystem: "sistemdə",
    addPatient: "Pasiyent əlavə et",
    cancel: "Ləğv et",
    save: "Yadda saxla",
    del: "Sil",
    close: "Bağla",
  },
  today: {
    title: "Bugün",
    statToday: "Bugünkü randevular",
    statUpcoming: "Gələcək randevular",
    statNew: "Yeni (təsdiq gözləyir)",
    statPatients: "Ümumi pasiyent",
    scheduleTitle: "Bugünkü cədvəl",
    emptyTitle: "Bu gün üçün randevu yoxdur",
    emptyDesc: "Yeni pasiyent əlavə edin və ya pasiyentlər saytdan yazıldıqca burada görünəcək.",
    smsOut: "SMS balansınız bitib — xatırlatma və çağırış SMS-ləri göndərilmir.",
    smsLowPre: "SMS balansınız azalır (",
    smsLowPost: " qalıb).",
    smsBuyLink: "SMS-lər bölməsindən paket alın.",
    slotOffPre: "Onlayn slot rezervasiyası söndürülüb. Pasiyentlərin saytda real boş vaxtlarınızı görüb birbaşa yazılması üçün ",
    slotOffLink: "Ayarlar",
    slotOffPost: "-dan aktiv edin.",
  },
  calendar: {
    title: "Təqvim",
    day: "Gün",
    week: "Həftə",
    threeDay: "3 gün",
    month: "Ay",
    todayBtn: "Bu gün",
    thisMonth: "Bu ay",
    prev: "Əvvəlki",
    next: "Növbəti",
    closedDay: "Bu gün mərkəz bağlıdır (iş günü deyil).",
    apptWord: "randevu",
    legendNew: "Yeni",
    legendConfirmed: "Təsdiqli",
    legendCompleted: "Tamamlanıb",
    legendCancelled: "Ləğv",
    blockTime: "Vaxt blokla",
    newAppt: "Yeni qəbul",
  },
  patients: {
    title: "Pasiyentlər",
    countWord: "pasiyent",
    note: "Sistemdə qeydiyyatdan keçmiş pasiyentlərin kartına rentgen faylları yükləmək və saytın tam imkanlarından istifadə etmək olar. Əl ilə əlavə edilmiş (sistemdə olmayan) pasiyentlərə fayl yüklənmir.",
    baseTitle: "Pasiyent bazası",
    emptyTitle: "Hələ pasiyent yoxdur",
    emptyDesc: "Əl ilə pasiyent əlavə edin və ya pasiyentlər saytdan yazıldıqca burada toplanacaq.",
    thName: "Ad",
    thPhone: "Telefon",
    thVisits: "Ziyarət",
    thLast: "Son",
    thNext: "Növbəti",
    thStatus: "Status",
    thSms: "SMS",
    lapsed: "gəlmir",
    recall: "Çağır",
    recallDone: "Göndərildi",
    invite: "Dəvət et",
    inviteDone: "Dəvət olundu",
    backToList: "Pasiyentlər",
    visitWord: "randevu",
    referringDoctor: "Göndərən həkim:",
    fileGate: "Fayl yükləmək üçün randevunu «Tamamlandı» edin.",
  },
  sms: {
    title: "SMS-lər",
    subtitle: "Xatırlatma, çağırış və dəvət SMS-ləri balansınızdan gedir · göndərən adı:",
    statBalance: "Qalıq balans",
    statMonth: "Bu ay göndərilən",
    statTotal: "Ümumi göndərilən",
    campaignTitle: "Kampaniya (toplu SMS)",
    buyTitle: "SMS paketi al",
    buyNote: "Ödəniş balansınızdan çıxılır və SMS-lər dərhal yüklənir. Balansı Paket / Balans səhifəsindən (Payriff ilə) artıra bilərsiniz.",
    historyTitle: "Balans tarixçəsi",
    logTitle: "Göndərilən SMS-lər (son 50)",
    lowZero: "SMS balansınız bitib — xatırlatma və çağırış SMS-ləri göndərilmir. Paket alın.",
    lowPre: "SMS balansınız azalır (",
    lowPost: " qalıb). Fasiləsiz işləmək üçün yeni paket alın.",
  },
  settings: {
    title: "Ayarlar",
    slotTitle: "Slot rezervasiyası",
    holidaysTitle: "Qeyri-iş günləri",
    hoursTitle: "İş saatları",
    hoursBody: "Cədvəl mərkəzin profilindəki iş günləri və saatlarına əsaslanır.",
    hoursNone: "İş saatları təyin edilməyib",
    hoursEdit: "Profildə iş saatlarını dəyiş",
    durTitle: "Xidmət müddətləri",
    durBody: "Hər xidmətin göstərilmə müddəti randevunun cədvəldə nə qədər vaxt tutacağını təyin edir. Müddətləri xidmətlərin qiymətləri ilə birlikdə mərkəz panelində təyin edin.",
    durEdit: "Xidmət və müddətləri idarə et",
  },
  upsell: {
    title: "CRM yalnız Platinum paketdə",
    desc: "Onlayn randevu təqvimi, pasiyent bazası və saytdan birbaşa slot rezervasiyası Platinum paketinə daxildir. Paketi yüksəldərək CRM-i aktivləşdirin.",
    f1: "Randevu təqvimi",
    f2: "Pasiyent bazası",
    f3: "Onlayn slot rezervasiyası",
    goPlatinum: "Platinum-a keç",
    viewPackages: "Paketlərə bax",
  },
  forms: {
    nameLabel: "Ad, soyad *", namePh: "Pasiyentin adı",
    phoneLabel: "Telefon *", phonePh: "050 000 00 00",
    serviceLabel: "Xidmət", serviceNone: "— Seçilməyib —",
    dateLabel: "Tarix", timeLabel: "Saat",
    noteLabel: "Qeyd", notePh: "İstəyə bağlı",
    confirmedNote: "Təsdiqlənib (vaxt tam bağlanır)",
    newTitle: "Yeni qəbul", editTitle: "Randevunu redaktə et",
    add: "Əlavə et", card: "Kart",
    delConfirm: "Bu randevunu silmək?", delFilesFirst: "Bu randevuda fayllar var. Əvvəlcə faylları silin.",
  },
  block: {
    title: "Vaxt blokla", desc: "Seçilmiş vaxt aralığı bağlanır — pasiyentlər ora yazıla bilməz (fasilə, nahar, tətil).",
    start: "Başlanğıc *", end: "Bitmə *",
    reasonLabel: "Səbəb", reasonPh: "Nahar, tətil və s. (istəyə bağlı)",
    submit: "Blokla", closed: "Bağlı", fixed: "sabit", delConfirm: "Bu bloku silmək?",
  },
  resched: {
    title: "Vaxtı dəyiş", question: "Yeni vaxt pasientlə razılaşdırılıb?",
    hint: "«Bəli» → randevu təsdiqlənmiş olur. «Xeyr» → təsdiqlənməmişə keçir.",
    yes: "Bəli, razılaşdırılıb", no: "Xeyr", cancel: "Ləğv",
  },
  slotForm: {
    toggleTitle: "Onlayn slot rezervasiyası",
    toggleDesc: "Aktiv olanda pasiyentlər saytda mərkəzinizin real boş vaxtlarını görüb birbaşa yazılır. Söndürülsə, köhnə sərbəst vaxt rejimi işləyir.",
    stepLabel: "Slot addımı (dəqiqə)", stepHint: "Cədvəldə vaxtların hansı addımla göstərildiyi (məs. 30 dəq).",
    capLabel: "Eyni vaxtda tutum (kabinet/aparat sayı)", capHint: "Bir vaxtda neçə pasiyent qəbul edə bilərsiniz.",
    lunchTitle: "Nahar fasiləsi",
    lunchDesc: "Fiks nahar vaxtı. Doldurularsa seçilmiş günlərdə bu aralıq avtomatik bloklanır — hər gün ayrıca blok yaratmağa ehtiyac qalmır.",
    start: "Başlanğıc", end: "Bitmə", daysLabel: "Günlər",
    days: ["B.e", "Ç.a", "Ç", "C.a", "Cümə", "Şənbə", "Bazar"],
    remTitle: "Randevu xatırlatması (SMS)",
    remDesc: "Aktiv olanda pasiyentə randevudan əvvəl avtomatik SMS xatırlatma göndərilir.",
    hoursBefore: "Neçə saat əvvəl", hoursWord: "saat əvvəl",
    saved: "Saxlanıldı",
  },
  holidays: {
    desc: "Bayram və digər qeyri-iş günləri. Əlavə edilən gün təqvimdə tam bağlanır — pasiyentlər həmin günə yazıla bilməz.",
    empty: "Hələ qeyri-iş günü əlavə edilməyib.",
    dateLabel: "Tarix", reasonLabel: "Səbəb", reasonPh: "Bayram, təmir və s. (istəyə bağlı)", add: "Əlavə et",
  },
  smsBuy: {
    balanceLabel: "Balansınız:", topup: "Balans artır →",
    stockPre: "Hazırda stokda maksimum ", stockPost: " SMS almaq mümkündür — stok tezliklə artırılacaq.",
    smsWord: "SMS", buy: "Al", outOfStock: "Stokda yoxdur", noMoney: "Balans kifayət etmir",
    donePost: " SMS balansınıza əlavə olundu.",
    confirmPre: " SMS paketi alınsın? Balansdan ", confirmPost: " ₼ çıxılacaq.",
  },
  campaign: {
    audAll: "Bütün pasiyentlər", audAllHint: "bazadakı hər kəs",
    audLapsed: "Gəlməyənlər", audLapsedHint: "90+ gün aktivliyi olmayan",
    audSys: "Sistemdə olanlar", audSysHint: "qeydiyyatlı pasiyentlər",
    ph: "Kampaniya mətni — məs.: Bu həftə panoramik rentgen 20% endirimlə! Randevu üçün zəng edin.",
    counterNote: "uzun mətn operator tərəfdə bir neçə SMS kimi hesablana bilər",
    recip: "Alıcı:", balance: "Balans:",
    lowPre: "Balans auditoriyadan azdır — göndəriş balans bitəndə dayanacaq (", lowMid: "/",
    send: "Kampaniyanı göndər", sent: "Göndərildi:", failed: "alınmadı:", left: "limit səbəbiylə qaldı:", stopped: "balans bitdiyi üçün dayandı",
  },
  labels: {
    kindReminder: "Xatırlatma / Çağırış", kindCampaign: "Kampaniya", kindOther: "Dəvət / Digər",
    kindCenterReq: "Randevu bildirişi", kindPatientStatus: "Status bildirişi",
    sentOk: "Göndərildi", sentFail: "Alınmadı",
    orderPending: "Gözləyir", orderPaid: "Ödənilib", orderCancelled: "Ləğv edilib",
    gift: "hədiyyə", purchase: "alış", noOps: "Hələ əməliyyat yoxdur.", noSms: "Hələ SMS göndərilməyib.",
  },
  assistants: {
    title: "Asistentlər",
    desc: "Asistentlər mərkəzin adından CRM-də gündəlik iş görür (randevu, pasiyent, fayl). Saytın heç bir yerində görünmürlər; Ayarlar və ödənişlər onlara bağlıdır.",
    empty: "Hələ asistent əlavə edilməyib.",
    addBtn: "Asistent əlavə et", first: "Ad", last: "Soyad", phone: "Telefon",
    sendCode: "Kod göndər", codeLabel: "Təsdiq kodu", confirmBtn: "Təsdiqlə", back: "Geri",
    otpSentPre: "Təsdiq kodu ", otpSentPost: " nömrəsinə göndərildi — asistent kodu sizə desin.",
    activeOn: "Aktiv", activeOff: "Deaktiv", removeConfirm: "Asistent silinsin? Girişi dərhal dayanacaq.",
    ownerOnly: "Bu bölmə yalnız mərkəz sahibinə açıqdır.",
    loginHint: "Asistent crm.rentgen.az ünvanına daxil olub yalnız öz nömrəsi ilə (OTP) giriş edir.",
    limitNote: "Hər mərkəzə maksimum 1 asistent əlavə etmək olar.",
  },
};

const ru: CrmDict = {
  common: {
    min: "мин",
    notInSystem: "не в системе",
    inSystem: "в системе",
    addPatient: "Добавить пациента",
    cancel: "Отмена",
    save: "Сохранить",
    del: "Удалить",
    close: "Закрыть",
  },
  today: {
    title: "Сегодня",
    statToday: "Записи на сегодня",
    statUpcoming: "Предстоящие записи",
    statNew: "Новые (ждут подтверждения)",
    statPatients: "Всего пациентов",
    scheduleTitle: "Расписание на сегодня",
    emptyTitle: "На сегодня записей нет",
    emptyDesc: "Добавьте пациента вручную — записи с сайта будут появляться здесь.",
    smsOut: "SMS-баланс исчерпан — напоминания и приглашения не отправляются.",
    smsLowPre: "SMS-баланс заканчивается (осталось ",
    smsLowPost: ").",
    smsBuyLink: "Купите пакет в разделе SMS.",
    slotOffPre: "Онлайн-бронирование слотов выключено. Чтобы пациенты видели свободное время и записывались напрямую, включите его в разделе ",
    slotOffLink: "Настройки",
    slotOffPost: ".",
  },
  calendar: {
    title: "Календарь",
    day: "День",
    week: "Неделя",
    threeDay: "3 дня",
    month: "Месяц",
    todayBtn: "Сегодня",
    thisMonth: "Этот месяц",
    prev: "Назад",
    next: "Вперёд",
    closedDay: "Сегодня центр закрыт (нерабочий день).",
    apptWord: "записей",
    legendNew: "Новая",
    legendConfirmed: "Подтверждена",
    legendCompleted: "Завершена",
    legendCancelled: "Отмена",
    blockTime: "Заблокировать время",
    newAppt: "Новая запись",
  },
  patients: {
    title: "Пациенты",
    countWord: "пациентов",
    note: "В карту зарегистрированных пациентов можно загружать рентген-файлы и использовать все возможности сайта. Пациентам, добавленным вручную (не в системе), файлы не загружаются.",
    baseTitle: "База пациентов",
    emptyTitle: "Пациентов пока нет",
    emptyDesc: "Добавьте пациента вручную — записи с сайта будут собираться здесь.",
    thName: "Имя",
    thPhone: "Телефон",
    thVisits: "Визиты",
    thLast: "Последний",
    thNext: "Следующий",
    thStatus: "Статус",
    thSms: "SMS",
    lapsed: "не приходит",
    recall: "Пригласить",
    recallDone: "Отправлено",
    invite: "В систему",
    inviteDone: "Приглашён",
    backToList: "Пациенты",
    visitWord: "записей",
    referringDoctor: "Направивший врач:",
    fileGate: "Чтобы загрузить файлы, отметьте запись «Завершена».",
  },
  sms: {
    title: "SMS",
    subtitle: "Напоминания, приглашения и рассылки идут с вашего баланса · имя отправителя:",
    statBalance: "Остаток",
    statMonth: "Отправлено за месяц",
    statTotal: "Отправлено всего",
    campaignTitle: "Кампания (массовая рассылка)",
    buyTitle: "Купить SMS-пакет",
    buyNote: "Оплата списывается с баланса, SMS зачисляются сразу. Пополнить баланс можно на странице Пакет / Баланс (через Payriff).",
    historyTitle: "История баланса",
    logTitle: "Отправленные SMS (последние 50)",
    lowZero: "SMS-баланс исчерпан — напоминания и приглашения не отправляются. Купите пакет.",
    lowPre: "SMS-баланс заканчивается (осталось ",
    lowPost: "). Купите новый пакет, чтобы не прерываться.",
  },
  settings: {
    title: "Настройки",
    slotTitle: "Бронирование слотов",
    holidaysTitle: "Нерабочие дни",
    hoursTitle: "Часы работы",
    hoursBody: "Расписание основано на рабочих днях и часах из профиля центра.",
    hoursNone: "Часы работы не заданы",
    hoursEdit: "Изменить часы в профиле",
    durTitle: "Длительность услуг",
    durBody: "Длительность каждой услуги определяет, сколько времени запись занимает в расписании. Задайте её вместе с ценами в панели центра.",
    durEdit: "Управлять услугами и длительностью",
  },
  upsell: {
    title: "CRM доступен только в пакете Platinum",
    desc: "Онлайн-календарь записи, база пациентов и прямое бронирование слотов с сайта входят в пакет Platinum. Обновите пакет, чтобы активировать CRM.",
    f1: "Календарь записи",
    f2: "База пациентов",
    f3: "Онлайн-бронирование слотов",
    goPlatinum: "Перейти на Platinum",
    viewPackages: "Смотреть пакеты",
  },
  forms: {
    nameLabel: "Имя, фамилия *", namePh: "Имя пациента",
    phoneLabel: "Телефон *", phonePh: "050 000 00 00",
    serviceLabel: "Услуга", serviceNone: "— Не выбрано —",
    dateLabel: "Дата", timeLabel: "Время",
    noteLabel: "Заметка", notePh: "По желанию",
    confirmedNote: "Подтверждено (время закрепляется)",
    newTitle: "Новая запись", editTitle: "Редактировать запись",
    add: "Добавить", card: "Карта",
    delConfirm: "Удалить эту запись?", delFilesFirst: "У записи есть файлы. Сначала удалите файлы.",
  },
  block: {
    title: "Заблокировать время", desc: "Выбранный интервал закрывается — пациенты не смогут записаться (перерыв, обед, отпуск).",
    start: "Начало *", end: "Конец *",
    reasonLabel: "Причина", reasonPh: "Обед, отпуск и т.п. (по желанию)",
    submit: "Заблокировать", closed: "Закрыто", fixed: "фикс.", delConfirm: "Удалить этот блок?",
  },
  resched: {
    title: "Изменить время", question: "Новое время согласовано с пациентом?",
    hint: "«Да» → запись подтверждена. «Нет» → переходит в неподтверждённые.",
    yes: "Да, согласовано", no: "Нет", cancel: "Отмена",
  },
  slotForm: {
    toggleTitle: "Онлайн-бронирование слотов",
    toggleDesc: "Когда включено, пациенты видят реальное свободное время центра на сайте и записываются напрямую. Если выключено — работает прежний свободный режим.",
    stepLabel: "Шаг слота (минуты)", stepHint: "С каким шагом показывается время в расписании (напр. 30 мин).",
    capLabel: "Вместимость (кабинеты/аппараты)", capHint: "Сколько пациентов можно принять одновременно.",
    lunchTitle: "Обеденный перерыв",
    lunchDesc: "Фиксированное время обеда. Если задано, интервал автоматически блокируется в выбранные дни — не нужно создавать блок каждый день.",
    start: "Начало", end: "Конец", daysLabel: "Дни",
    days: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    remTitle: "Напоминание о записи (SMS)",
    remDesc: "Когда включено, пациенту автоматически отправляется SMS-напоминание перед записью.",
    hoursBefore: "За сколько часов", hoursWord: "часов до",
    saved: "Сохранено",
  },
  holidays: {
    desc: "Праздники и другие нерабочие дни. Добавленный день полностью закрывается в календаре — пациенты не смогут записаться.",
    empty: "Нерабочих дней пока нет.",
    dateLabel: "Дата", reasonLabel: "Причина", reasonPh: "Праздник, ремонт и т.п. (по желанию)", add: "Добавить",
  },
  smsBuy: {
    balanceLabel: "Ваш баланс:", topup: "Пополнить →",
    stockPre: "Сейчас в наличии максимум ", stockPost: " SMS — запас скоро пополнится.",
    smsWord: "SMS", buy: "Купить", outOfStock: "Нет в наличии", noMoney: "Недостаточно баланса",
    donePost: " SMS зачислены на ваш баланс.",
    confirmPre: " SMS — купить пакет? С баланса спишется ", confirmPost: " ₼.",
  },
  campaign: {
    audAll: "Все пациенты", audAllHint: "все из базы",
    audLapsed: "Не приходят", audLapsedHint: "нет активности 90+ дней",
    audSys: "В системе", audSysHint: "зарегистрированные пациенты",
    ph: "Текст кампании — напр.: На этой неделе панорамный рентген со скидкой 20%! Звоните для записи.",
    counterNote: "длинный текст может тарифицироваться оператором как несколько SMS",
    recip: "Получатели:", balance: "Баланс:",
    lowPre: "Баланс меньше аудитории — отправка остановится, когда баланс закончится (", lowMid: "/",
    send: "Отправить кампанию", sent: "Отправлено:", failed: "не доставлено:", left: "осталось из-за лимита:", stopped: "остановлено — баланс исчерпан",
  },
  labels: {
    kindReminder: "Напоминание / Приглашение", kindCampaign: "Кампания", kindOther: "Инвайт / Другое",
    kindCenterReq: "Уведомление о записи", kindPatientStatus: "Смена статуса",
    sentOk: "Отправлено", sentFail: "Не доставлено",
    orderPending: "Ожидает", orderPaid: "Оплачено", orderCancelled: "Отменено",
    gift: "подарок", purchase: "покупка", noOps: "Операций пока нет.", noSms: "SMS ещё не отправлялись.",
  },
  assistants: {
    title: "Ассистенты",
    desc: "Ассистенты работают в CRM от имени центра (записи, пациенты, файлы). Они нигде не видны на сайте; настройки и платежи им недоступны.",
    empty: "Ассистентов пока нет.",
    addBtn: "Добавить ассистента", first: "Имя", last: "Фамилия", phone: "Телефон",
    sendCode: "Отправить код", codeLabel: "Код подтверждения", confirmBtn: "Подтвердить", back: "Назад",
    otpSentPre: "Код отправлен на ", otpSentPost: " — пусть ассистент продиктует его вам.",
    activeOn: "Активен", activeOff: "Отключён", removeConfirm: "Удалить ассистента? Доступ прекратится сразу.",
    ownerOnly: "Раздел доступен только владельцу центра.",
    loginHint: "Ассистент заходит на crm.rentgen.az и входит только по своему номеру (OTP).",
    limitNote: "На каждый центр можно добавить максимум 1 ассистента.",
  },
};

const DICTS: Record<Locale, CrmDict> = { az, ru };

export function getCrmDict(locale: Locale): CrmDict {
  return DICTS[locale] ?? az;
}
