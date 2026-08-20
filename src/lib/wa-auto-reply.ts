import "server-only";

/**
 * Qarşı tərəfin AVTOMATİK cavabını tanıyır (WhatsApp Business greeting/away
 * mesajı, IVR-vari şablon, digər botlar).
 *
 * Niyə (2026-08-15): qiymət dəvətləri göndəriləndə klinikaların öz robotu
 * dərhal "Mesajınız ən qısa zamanda cavablandırılacaq" tipli mesaj qaytarırdı,
 * bizim bot da onlara nəzakət cavabı yazırdı → mənasız robot-robot yazışması.
 * Bir söhbətdə eyni şablon iki dəfə gəldi, bot iki dəfə cavab verdi; başqa
 * birində bot absurd "Rica etmirəm, gözləyirəm" cümləsi qurdu.
 *
 * Qərar: belə mesajlara CAVAB VERİLMİR. Mesaj yalnız söhbətə güzgülənir —
 * operator lazım bilsə özü yazır. Səssiz qalmaq təhlükəsizdir: qarşı tərəfdə
 * insan yoxdur, cavab yazsaq onların robotu yenidən işə düşə bilər.
 */

/** Bir dənəsi kifayətdir — bunlar yalnız avtomatik cavablarda olur. */
const STRONG: RegExp[] = [
  // AZ: "… ilə əlaqə saxladığınız üçün təşəkkür", "yazdığınız üçün təşəkkür edirik"
  /(əlaqə saxlad|yazd[ıi][gqğ][ıi]n[ıi]z|yazd[ıi][ğg][ıi]n[ıi]z|müraciət etdiyiniz|bizə yazd)[^.!?]{0,50}(üçün|görə)[^.!?]{0,25}təşəkkür/iu,
  // AZ: "mesajınız/sualınız … cavablandırılacaq"
  /(mesaj[ıi]n[ıi]z|sual[ıi]n[ıi]z|müraciətiniz)[^.!?]{0,70}cavabland[ıi]r[ıi]lacaq/iu,
  /(ən )?q[ıi]sa zamanda[^.!?]{0,50}(cavab|əlaqə saxlan)/iu,
  // 2026-08-20: MediYus keysi — "Mesajınız üçün təşəkkür edirik. Biz hal-hazırda
  // cavablaya bilməsək də, tezliklə cavab verəcəyik." heç birinə düşmürdü.
  /(mesaj|müraciət|sual)[ıi]n[ıi]z[^.!?]{0,40}(üçün|görə)[^.!?]{0,25}təşəkkür/iu,
  /tezliklə[^.!?]{0,40}cavab/iu,
  /hal-haz[ıi]rda[^.!?]{0,40}cavab[^.!?]{0,30}bilmə/iu,
  /operator(umuz)? tərəfindən[^.!?]{0,50}cavab/iu,
  /bu (mesaj|cavab) avtomatik/iu,
  // RU
  /спасибо[^.!?]{0,50}(за обращение|что написали|за ваше сообщение|за ваш запрос)/iu,
  /(ответим|свяжемся с вами)[^.!?]{0,50}(в ближайшее время|в течение|скоро)/iu,
  /ваше сообщение[^.!?]{0,50}(получено|принято|будет обработано)/iu,
  /это автоматическ(ое|ий) (сообщение|ответ)/iu,
  // TR / EN
  /mesaj[ıi]n[ıi]z (al[ıi]nm[ıi]şt[ıi]r|bize ulaşt)/iu,
  /en k[ıi]sa sürede (dönüş|cevap)/iu,
  /thank you for (contacting|reaching out|messaging|your message)/iu,
  /we('| wi)ll (get back to you|reply|respond)/iu,
  /this is an automated (message|reply|response)/iu,
];

/** İkisi bir yerdə olsa avtomatik sayılır (təkbaşına insan da yaza bilər). */
const WEAK: RegExp[] = [
  /iş (saatlar[ıi]m[ıi]z|rejimimiz|qrafikimiz)/iu,
  /sizə necə kömək edə bilər(ik|əm)\s*[?!]/iu,
  /чем (мы )?мож(ем|ет)[^.!?]{0,20}помочь\s*[?!]/iu,
  /(режим|часы) работы/iu,
  /\b\d{1,2}[:.]\d{2}\s*[-–—]\s*\d{1,2}[:.]\d{2}\b/u,
  /(ad|ad[ıi]n[ıi]z)[,\s]+soyad/iu,
  /müraciətinizi yaz[ıi]l[ıi] formada/iu,
  /our (working|business) hours/iu,
];

export type AutoReplyCheck = { auto: boolean; reason: string | null };

/**
 * Mətn qarşı tərəfin avtomatik cavabıdırmı?
 * Çox qısa mesajlar ("salam", "1", "hə") heç vaxt avtomatik sayılmır —
 * onlar real dialoqdur.
 */
export function isAutoReply(text: string): AutoReplyCheck {
  const t = (text ?? "").trim();
  if (t.length < 25) return { auto: false, reason: null };

  for (const re of STRONG) {
    if (re.test(t)) return { auto: true, reason: "şablon-cavab" };
  }
  const weakHits = WEAK.filter((re) => re.test(t)).length;
  if (weakHits >= 2) return { auto: true, reason: "şablon-əlamətləri" };

  return { auto: false, reason: null };
}
