/** Bilingual copy for the /waitlist demand-test landing page. Decision-support
 * framed throughout — convenience of finding/booking a center, never a clinical claim. */

export type WaitlistLocale = "az" | "ru";

export type AudienceOption = {
  value: "patient" | "doctor" | "center";
  label: string;
};

export type WaitlistCopy = {
  langLabel: string;
  eyebrow: string;
  title: string;
  highlight: string;
  titleEnd: string;
  subtitle: string;
  disclaimer: string;
  ctaScroll: string;
  steps: { title: string; text: string }[];
  stepsEyebrow: string;
  stepsTitle: string;
  formEyebrow: string;
  formTitle: string;
  formSubtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  contactHint: string;
  cityLabel: string;
  cityPlaceholder: string;
  audienceLabel: string;
  audienceOptions: AudienceOption[];
  noteLabel: string;
  notePlaceholder: string;
  submit: string;
  submitting: string;
  privacyNote: string;
};

export const WAITLIST_COPY: Record<WaitlistLocale, WaitlistCopy> = {
  az: {
    langLabel: "AZ",
    eyebrow: "Tezliklə — Rentgen.az Onlayn Qeydiyyat",
    title: "Dental rentgen və CBCT randevusunu",
    highlight: "zəng etmədən",
    titleEnd: "tapın və bron edin",
    subtitle:
      "Mərkəz axtarmaq, zəng vurmaq və növbə gözləmək əvəzinə — xidməti seçin, uyğun vaxtı görün, bir neçə kliklə bron edin. Bu funksiya tezliklə işə düşür — ilk siyahıya yazılın, açılanda xəbər veririk.",
    disclaimer:
      "Qeyd: bu, klinik məsləhət və ya diaqnoz deyil — sadəcə uyğun mərkəzi və randevunu tapmağı asanlaşdıran bir alətdir. Bütün klinik qərarlar həkiminizlə birgə qəbul edilir.",
    ctaScroll: "Siyahıya yazıl",
    stepsEyebrow: "Necə işləyəcək",
    stepsTitle: "3 addımda randevu",
    steps: [
      { title: "Axtarın", text: "Xidmət növü, şəhər və büdcəyə görə mərkəzləri görün." },
      { title: "Müqayisə edin", text: "Boş vaxtları və qiymətləri bir ekranda müqayisə edin." },
      { title: "Bron edin", text: "Zəng etmədən, bir neçə kliklə öz vaxtınızı seçin." },
    ],
    formEyebrow: "Erkən qeydiyyat",
    formTitle: "Açılanda ilk bilən siz olun",
    formSubtitle:
      "Aşağıdakı formanı doldurun — funksiya açılan kimi sizinlə əlaqə saxlayacağıq. Spam yoxdur.",
    nameLabel: "Ad, Soyad",
    namePlaceholder: "Adınız",
    phoneLabel: "Telefon nömrəsi",
    phonePlaceholder: "050 123 45 67",
    emailLabel: "E-poçt",
    emailPlaceholder: "siz@nümunə.az",
    contactHint: "Telefon və ya e-poçtdan ən azı birini daxil edin.",
    cityLabel: "Şəhər",
    cityPlaceholder: "Bakı",
    audienceLabel: "Siz kimsiniz?",
    audienceOptions: [
      { value: "patient", label: "Pasiyent" },
      { value: "doctor", label: "Həkim" },
      { value: "center", label: "Rentgen mərkəzi" },
    ],
    noteLabel: "Qeyd (istəyə bağlı)",
    notePlaceholder: "Hansı xidmətlə maraqlanırsınız?",
    submit: "Siyahıya yazıl",
    submitting: "Göndərilir...",
    privacyNote:
      "Məlumatlarınız yalnız sizinlə əlaqə saxlamaq üçün istifadə olunur, üçüncü tərəflərlə paylaşılmır.",
  },
  ru: {
    langLabel: "RU",
    eyebrow: "Скоро — Rentgen.az Онлайн-запись",
    title: "Находите и бронируйте дентальный рентген и КЛКТ",
    highlight: "без звонков",
    titleEnd: "",
    subtitle:
      "Вместо поиска центра, звонков и ожидания очереди — выберите услугу, посмотрите удобное время и забронируйте в пару кликов. Эта функция скоро запускается — запишитесь первыми, мы сообщим о запуске.",
    disclaimer:
      "Важно: это не медицинская консультация и не постановка диагноза — это инструмент для удобного поиска центра и записи. Все клинические решения принимаются совместно с вашим врачом.",
    ctaScroll: "Записаться в лист ожидания",
    stepsEyebrow: "Как это будет работать",
    stepsTitle: "Запись за 3 шага",
    steps: [
      { title: "Найдите", text: "Смотрите центры по виду услуги, городу и бюджету." },
      { title: "Сравните", text: "Свободное время и цены — на одном экране." },
      { title: "Забронируйте", text: "Выберите удобное время в пару кликов, без звонков." },
    ],
    formEyebrow: "Ранняя регистрация",
    formTitle: "Узнайте о запуске первыми",
    formSubtitle:
      "Заполните форму — мы свяжемся с вами, как только функция станет доступна. Без спама.",
    nameLabel: "Имя, фамилия",
    namePlaceholder: "Ваше имя",
    phoneLabel: "Номер телефона",
    phonePlaceholder: "050 123 45 67",
    emailLabel: "Email",
    emailPlaceholder: "vy@example.az",
    contactHint: "Укажите хотя бы телефон или email.",
    cityLabel: "Город",
    cityPlaceholder: "Баку",
    audienceLabel: "Кто вы?",
    audienceOptions: [
      { value: "patient", label: "Пациент" },
      { value: "doctor", label: "Врач" },
      { value: "center", label: "Рентген-центр" },
    ],
    noteLabel: "Комментарий (по желанию)",
    notePlaceholder: "Какая услуга вас интересует?",
    submit: "Записаться",
    submitting: "Отправка...",
    privacyNote:
      "Ваши данные используются только для связи с вами и не передаются третьим лицам.",
  },
};
