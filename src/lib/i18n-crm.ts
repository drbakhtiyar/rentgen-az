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
};

const DICTS: Record<Locale, CrmDict> = { az, ru };

export function getCrmDict(locale: Locale): CrmDict {
  return DICTS[locale] ?? az;
}
