import type { FaqItem } from "@/components/faq-accordion";
import type { Locale } from "@/lib/i18n";

/**
 * FAQ məzmunu — 2026-08-10 restrukturu.
 *
 * Sayt əvvəl dental-yönümlü idi; indi bütün görüntüləmə modallıqlarını əhatə
 * edir. Struktur: əvvəl PLATFORMA sualları (sistemin işləməsi), sonra hər
 * modallıq öz bölməsində (çip-naviqasiyalı tək səhifə — bax /faq).
 * Cavablar qısa, tibbi cəhətdən ehtiyatlıdır: diaqnoz/zəmanət iddiası yoxdur,
 * "həkimə müraciət edin" xətti qorunur.
 */

export type FaqSection = {
  key: string;
  title: string;
  /** Çip zolağı üçün qısa ad (tam başlıq bölmə başlığında qalır). */
  chip: string;
  items: FaqItem[];
};

/* ============================== AZ ============================== */

const PLATFORM_AZ: FaqItem[] = [
  {
    question: "Rentgen.az nədir?",
    answer:
      "Rentgen.az Azərbaycanda tibbi görüntüləmə xidmətləri — rentgen, KT, MRT, USM, mammoqrafiya, densitometriya və dental tomoqrafiya — göstərən təsdiqlənmiş mərkəzləri bir araya gətirən platformadır. Xidmətə, şəhərə və qiymətə görə axtarış edib mərkəzlərlə birbaşa əlaqə saxlaya bilərsiniz.",
  },
  {
    question: "Platformadan istifadə pulludur?",
    answer:
      "Xeyr, pasiyentlər üçün Rentgen.az tam pulsuzdur. Siz yalnız seçdiyiniz mərkəzdə müayinənin öz qiymətini ödəyirsiniz.",
  },
  {
    question: "Müayinəyə necə yazılıram?",
    answer:
      "Mərkəzin səhifəsində sorğu formunu doldura, birbaşa zəng edə və ya WhatsApp-la yaza bilərsiniz. Sorğu üçün qeydiyyat məcburi deyil — ad və telefon nömrəsi kifayətdir.",
  },
  {
    question: "Qeydiyyat üçün parol lazımdırmı?",
    answer:
      "Xeyr. Telefon nömrənizi daxil edirsiniz, sizə birdəfəlik təsdiq kodu (OTP) gəlir. Kodu təsdiqlədikdən sonra profiliniz hazırdır — parol yoxdur, yadda saxlamalı heç nə yoxdur.",
  },
  {
    question: "OTP kodu gəlməsə nə etməliyəm?",
    answer:
      "Kod yalnız Azərbaycan mobil nömrələrinə göndərilir. Bir-iki dəqiqə gözləyib yenidən cəhd edin; nömrənin düzgün yazıldığını yoxlayın. Problem davam edərsə, əlaqə səhifəsindən bizə yazın.",
  },
  {
    question: "Mərkəzlər necə təsdiqlənir?",
    answer:
      "Hər mərkəzin profili platformaya əlavə olunduqdan sonra yoxlanılır — əlaqə məlumatları, ünvan və xidmətlər dəqiqləşdirilir. Yalnız bundan sonra mərkəz “təsdiqlənmiş” statusu ilə kataloqda görünür.",
  },
  {
    question: "Qiymətlər haradan gəlir və dəqiqdirmi?",
    answer:
      "Qiymətləri mərkəzlər özləri təqdim edir və yeniləyir. Qiymət göstərilməyibsə, mərkəz onu hələ bildirmeyib — dəqiq məbləği zəng və ya WhatsApp ilə soruşmaq olar. Son qiymət hər zaman mərkəzin özündə təsdiqlənməlidir.",
  },
  {
    question: "Xidmətlər üçün ödəniş platformada olur?",
    answer:
      "Xeyr. Rentgen.az mərkəzləri tapmağa, müqayisə etməyə və əlaqə saxlamağa kömək edir. Ödəniş və müayinə birbaşa seçdiyiniz mərkəzdə həyata keçirilir.",
  },
  {
    question: "Müayinə nəticələrini necə alıram?",
    answer:
      "Nəticəni müayinə olunduğunuz mərkəz təqdim edir — çap, disk və ya elektron formada. Bəzi mərkəzlər nəticə faylını platforma üzərindən də paylaşır; bu halda o, profilinizdə görünür.",
  },
  {
    question: "Müayinə üçün həkim göndərişi mütləqdirmi?",
    answer:
      "Əksər özəl mərkəzlərdə göndərişsiz qəbul mümkündür. Bununla belə, müayinə növünün düzgün seçilməsi və nəticənin düzgün şərh olunması üçün həkim rəyi ilə müraciət etmək tövsiyə olunur.",
  },
];

const MRT_AZ: FaqItem[] = [
  {
    question: "MRT zərərlidirmi?",
    answer:
      "MRT rentgen şüası vermir — maqnit sahəsi və radiodalğalarla işləyir. Ona görə şüalanma yükü yoxdur və təkrar müayinələr üçün də təhlükəsiz sayılır.",
  },
  {
    question: "MRT nə qədər çəkir?",
    answer:
      "Nahiyədən asılı olaraq adətən 15–40 dəqiqə. Kontrastlı müayinələr bir qədər uzun ola bilər. Müayinə boyu hərəkətsiz qalmaq nəticənin keyfiyyəti üçün vacibdir.",
  },
  {
    question: "Kimlərə MRT edilmir?",
    answer:
      "Kardiostimulyator, koxlear implant və bəzi metal implantları olanlar mütləq əvvəlcədən həkimə bildirməlidir — müasir cihazların bir qismi MRT-yə uyğundur, sənədini göstərmək lazımdır. Bədəndə metal qəlpə olanlar da xəbərdar etməlidir.",
  },
  {
    question: "Qapalı yerdən qorxuram — MRT edə bilərəmmi?",
    answer:
      "Bəli, əksər hallarda mümkündür. Bəzi mərkəzlərdə daha geniş tunelli aparatlar var; müayinədən əvvəl mərkəzə klaustrofobiyanız barədə deyin — mövqe, qulaqcıq və fasilələrlə proses xeyli rahatlaşır.",
  },
  {
    question: "Kontrast maddə nədir və təhlükəsizdirmi?",
    answer:
      "Kontrast toxumaların daha aydın görünməsi üçün venaya yeridilən maddədir. Ümumilikdə yaxşı keçirilir; böyrək xəstəliyi və ya allergiyası olanlar bunu həkimə əvvəlcədən deməlidir.",
  },
  {
    question: "MRT-yə xüsusi hazırlıq lazımdır?",
    answer:
      "Adi MRT üçün xüsusi hazırlıq tələb olunmur — yalnız bütün metal əşyaları (zinət, saat, kəmər, telefon) çıxarmaq lazımdır. Kontrastlı müayinədə həkim bir neçə saat ac qalmağı istəyə bilər.",
  },
];

const KT_AZ: FaqItem[] = [
  {
    question: "KT (kompüter tomoqrafiyası) nədir?",
    answer:
      "KT rentgen şüaları ilə bədəni qat-qat “kəsiklərlə” görüntüləyən sürətli müayinədir. Sümük strukturları, ağciyər və təcili halların qiymətləndirilməsində xüsusilə güclüdür.",
  },
  {
    question: "KT ilə MRT-nin fərqi nədir?",
    answer:
      "KT rentgen şüası ilə işləyir, bir neçə dəqiqə çəkir və sümük-ağciyəri daha yaxşı göstərir. MRT şüasızdır, 15–40 dəqiqə çəkir və yumşaq toxumaları (beyin, disk, oynaq) daha dəqiq göstərir. Hansının lazım olduğunu klinik vəziyyətə görə həkim seçir.",
  },
  {
    question: "KT-nin şüa dozası təhlükəlidirmi?",
    answer:
      "Müasir aparatlarda doza ciddi nəzarətdədir və göstəriş olduqda diaqnostik fayda riskdən qat-qat böyükdür. Sadəcə KT özbaşına deyil, həkim göstərişi ilə edilməlidir.",
  },
  {
    question: "Kontrastlı KT üçün hazırlıq lazımdır?",
    answer:
      "Bəli — adətən müayinədən 4–6 saat əvvəl yemək dayandırılır və böyrək funksiyası barədə məlumat istənilə bilər. Dəqiq qaydanı yazıldığınız mərkəz bildirəcək.",
  },
  {
    question: "Hamiləlikdə KT olarmı?",
    answer:
      "Qarın və çanaq nahiyəsinin KT-si hamiləlikdə yalnız həyati zərurət olduqda aparılır; mümkün olduqda USM və ya MRT ilə əvəzlənir. Hamiləlik barədə həkimə mütləq əvvəlcədən deyin.",
  },
  {
    question: "KT nəticəsi nə vaxt hazır olur?",
    answer:
      "Görüntülər dərhal alınır; həkim rəyi (yazılı nəticə) adətən bir neçə saatdan bir günə qədər hazırlanır. Dəqiq müddəti mərkəzdən soruşun.",
  },
];

const USM_AZ: FaqItem[] = [
  {
    question: "USM zərərlidirmi?",
    answer:
      "Xeyr. Ultrasəs müayinəsi şüalanma vermir, ağrısızdır və hamiləlik daxil istənilən dövrdə təhlükəsiz sayılır. Ona görə bir çox halda ilk seçim müayinəsidir.",
  },
  {
    question: "Qarın USM-dən əvvəl neçə saat ac qalmalıyam?",
    answer:
      "Adətən 6–8 saat. Yemək öd kisəsini yığır və bağırsaq qazları görüntünü pisləşdirir. Az miqdarda adi su içmək olar; 1–2 gün əvvəldən qaz yaradan qidaları azaltmaq da faydalıdır.",
  },
  {
    question: "Kiçik çanaq USM-i üçün niyə sidik kisəsi dolu olmalıdır?",
    answer:
      "Dolu sidik kisəsi çanaq orqanlarının (uşaqlıq, prostat) daha aydın görünməsinə “akustik pəncərə” yaradır. Müayinədən təxminən 1 saat əvvəl 2–4 stəkan su içib tualetə getməmək tövsiyə olunur.",
  },
  {
    question: "Doppler USM nədir?",
    answer:
      "Doppler damarlarda qan axınının istiqamətini və sürətini göstərən USM növüdür. Boyun, ətraf və qarın damarlarının qiymətləndirilməsində istifadə olunur.",
  },
  {
    question: "Hansı USM növləri hazırlıq tələb etmir?",
    answer:
      "Tiroid (qalxanabənzər vəzi), süd vəzi, oynaq və yumşaq toxuma USM-lərinə istənilən vaxt, hazırlıqsız gəlmək olar.",
  },
  {
    question: "USM nəticəsi dərhal verilirmi?",
    answer:
      "Bəli, əksər hallarda həkim müayinə zamanı qiymətləndirmə aparır və yazılı nəticə elə həmin gün təqdim olunur.",
  },
];

const MAMMO_AZ: FaqItem[] = [
  {
    question: "Mammoqrafiya neçə yaşdan edilməlidir?",
    answer:
      "Ümumi tövsiyə: 40 yaşdan sonra müntəzəm skrininq mammoqrafiyası, 1–2 ildə bir dəfə. Ailəsində süd vəzi xərçəngi olanlarda həkim daha erkən başlamağı məsləhət görə bilər.",
  },
  {
    question: "Mammoqrafiya ağrılıdırmı?",
    answer:
      "Süd vəzi bir neçə saniyəlik yüngülcə sıxılır — bu, xoş olmayan his yarada bilər, amma qısadır. Aybaşı bitdikdən sonrakı həftədə vəzilər daha az həssas olur, müayinəni o dövrə salmaq rahatdır.",
  },
  {
    question: "Mammoqrafiyanın şüası təhlükəlidirmi?",
    answer:
      "Rəqəmsal mammoqrafiyada doza çox kiçikdir və erkən aşkarlamanın faydası bu riskdən dəfələrlə üstündür. Hamiləlik ehtimalı varsa, əvvəlcədən bildirin.",
  },
  {
    question: "Mammoqrafiya ilə süd vəzi USM-inin fərqi nədir?",
    answer:
      "Bunlar bir-birini tamamlayır: mammoqrafiya mikrokalsinatları (ən erkən əlamətlərdən biri) görməkdə üstündür, USM isə sıx toxumada və kistaların qiymətləndirilməsində güclüdür. Gənc yaşda adətən əvvəlcə USM seçilir.",
  },
  {
    question: "Döş implantım var — mammoqrafiya mümkündürmü?",
    answer:
      "Bəli, xüsusi çəkiliş texnikası ilə mümkündür. Yazılarkən implant barədə mərkəzə əvvəlcədən məlumat verin.",
  },
  {
    question: "Nəticədə BI-RADS nə deməkdir?",
    answer:
      "BI-RADS nəticələrin standart qiymətləndirmə şkalasıdır. Hər hansı dəyişiklik aşkarlanıbsa belə, əksəriyyəti xoşxassəli olur — növbəti addımları mammoloqla müzakirə edin.",
  },
];

const DEXA_AZ: FaqItem[] = [
  {
    question: "Densitometriya (DEXA) nədir?",
    answer:
      "Sümük mineral sıxlığını ölçən aşağı dozalı rentgen müayinəsidir. Osteoporozu sınıq baş verməmişdən illər əvvəl aşkarlaya bilən standart üsuldur.",
  },
  {
    question: "Densitometriya kimlərə lazımdır?",
    answer:
      "65+ qadınlara və 70+ kişilərə, menopauzadan sonrakı qadınlara, kiçik zədədən sınıq keçirənlərə, uzunmüddətli kortikosteroid qəbul edənlərə və ailəsində osteoporoz olanlara tövsiyə olunur. Dəqiq göstərişi həkim müəyyən edir.",
  },
  {
    question: "Müayinə necə keçir?",
    answer:
      "Geyimli halda masaya uzanırsınız, skaner adətən bel və bud-çanaq nahiyəsindən keçir. 10–15 dəqiqə çəkir, tamamilə ağrısızdır; şüa dozası adi rentgendən dəfələrlə azdır.",
  },
  {
    question: "T-bal nəticəsi nə deməkdir?",
    answer:
      "T-bal −1.0 və yuxarı normaldır; −1.0 ilə −2.5 arası osteopeniya (başlanğıc seyrəlmə); −2.5 və aşağı osteoporoz göstəricisidir. Nəticəni endokrinoloq və ya revmatoloqla müzakirə edin.",
  },
  {
    question: "Densitometriyaya hazırlıq lazımdır?",
    answer:
      "Xüsusi hazırlıq yoxdur. Müayinə günü kalsium əlavəsi qəbul etməyin, metal detallı geyimlərdən qaçının. Son günlərdə kontrastlı KT/MRT olubsa, mərkəzə bildirin.",
  },
  {
    question: "Nə qədər tez-tez təkrarlamaq lazımdır?",
    answer:
      "Adətən 1–2 ildə bir dəfə — nəticədən və müalicənin gedişindən asılı olaraq həkim müəyyən edir. Müqayisənin düzgünlüyü üçün təkrar müayinəni mümkünsə eyni aparatda etdirin.",
  },
];

const XRAY_AZ: FaqItem[] = [
  {
    question: "Rentgen zərərlidirmi, ildə neçə dəfə çəkdirmək olar?",
    answer:
      "Müasir rəqəmsal aparatlarda doza aşağıdır və hər müayinə göstərişlə aparıldıqda təhlükəsiz sayılır. “İldə maksimum N dəfə” kimi universal rəqəm yoxdur — qərarı fayda-risk balansına görə həkim verir.",
  },
  {
    question: "Hamiləlikdə rentgen olarmı?",
    answer:
      "Qarından uzaq nahiyələrin (diş, əl, döş qəfəsi) rentgeni qurğuşun önlüklə qorunmaqla mümkündür; qarın-çanaq rentgeni isə yalnız zərurət halında aparılır və çox vaxt USM/MRT ilə əvəzlənir. Hamiləliyi mütləq əvvəlcədən bildirin.",
  },
  {
    question: "Qurğuşun önlük nə üçündür?",
    answer:
      "Rentgen şüasını keçirməyən qoruyucu örtükdür — müayinə olunmayan nahiyələri, xüsusilə qarın və çanağı qoruyur. Lazım bildiyiniz halda mərkəzdən özünüz də istəyə bilərsiniz.",
  },
  {
    question: "Ağciyər rentgeni nəyi göstərir?",
    answer:
      "Pnevmoniya, vərəm, plevrit, bəzi törəmələr və ürək kölgəsinin ölçüsü kimi dəyişiklikləri. Şübhəli hallarda həkim əlavə olaraq ağciyər KT-si təyin edə bilər.",
  },
  {
    question: "Uşaqlara rentgen çəkdirmək olarmı?",
    answer:
      "Bəli, göstəriş olduqda olar — uşaq rejimli aparatlarda doza daha da azaldılır və qoruyucu örtüklər istifadə olunur. Müayinəni yalnız həkim təyinatı ilə etdirin.",
  },
  {
    question: "Rentgen nəticəsi hansı formada verilir?",
    answer:
      "Mərkəzdən asılı olaraq çap olunmuş şəkil, disk/USB və ya elektron fayl (bəzən elə platforma üzərindən) təqdim olunur. Həkim rəyi yazılı əlavə edilir.",
  },
];

const DENTAL_AZ: FaqItem[] = [
  {
    question: "Dental rentgen təhlükəlidirmi?",
    answer:
      "Müasir rəqəmsal dental rentgendə şüalanma dozası çox aşağıdır — bir neçə saatlıq təbii fon şüalanması ilə müqayisə olunur. Müayinə klinik göstəriş olduqda təyin edilir.",
  },
  {
    question: "Panoramik (ortopantomoqrafiya) rentgen nədir?",
    answer:
      "Bütün dişləri, hər iki çənəni və ətraf strukturları bir şəkildə göstərən icmal müayinədir. Müalicə planlaması, ağıl dişləri və ümumi qiymətləndirmə üçün ən çox istifadə olunan çəkilişdir.",
  },
  {
    question: "Sefalometrik rentgen nə üçün təyin olunur?",
    answer:
      "Əsasən ortodontik müalicədən (breket və s.) əvvəl — üz-çənə skeletinin ölçülərini və dişlərin qapanışını qiymətləndirmək üçün. Ortodont müalicə planını bu ölçülərə əsasən qurur.",
  },
  {
    question: "3D tomoqrafiya (CBCT) ilə adi rentgen arasında fərq nədir?",
    answer:
      "Adi rentgen ikiölçülü şəkil verir; CBCT isə çənəni üçölçülü göstərir — sümüyün həcmi, sıxlığı, sinir kanalının yeri dəqiq görünür. İmplant, mürəkkəb çəkiliş və kanal müalicəsində üstünlük CBCT-dədir.",
  },
  {
    question: "İmplantdan əvvəl niyə 3D tomoqrafiya lazımdır?",
    answer:
      "CBCT çənə sümüyünün həcmini və anatomik strukturları (sinir kanalı, sinus) üçölçülü qiymətləndirməyə imkan verir — implantın ölçüsü və yeri məhz buna əsasən planlaşdırılır.",
  },
  {
    question: "Uşaqlarda dental rentgen olarmı?",
    answer:
      "Bəli, göstəriş olduqda — süd dişlərinin kökləri, daimi dişlərin inkişafı və ortodontik qiymətləndirmə üçün. Uşaq rejimində doza böyüklərdən də aşağıdır.",
  },
  {
    question: "Hamiləlikdə diş rentgeni çəkdirmək olarmı?",
    answer:
      "Qurğuşun önlük və boyunluqla mümkündür — dölə çatan doza cüzidir. Kəskin ağrı və infeksiyanı müalicəsiz saxlamaq daha risklidir; hamiləliyi həkimə mütləq bildirin.",
  },
];

const SECTIONS_AZ: FaqSection[] = [
  { key: "platforma", chip: "Platforma", title: "Platforma haqqında", items: PLATFORM_AZ },
  { key: "mrt", chip: "MRT", title: "MRT", items: MRT_AZ },
  { key: "kt", chip: "KT", title: "KT (kompüter tomoqrafiyası)", items: KT_AZ },
  { key: "usm", chip: "USM", title: "USM (ultrasəs)", items: USM_AZ },
  { key: "mammoqrafiya", chip: "Mammoqrafiya", title: "Mammoqrafiya", items: MAMMO_AZ },
  { key: "dexa", chip: "DEXA", title: "Densitometriya (DEXA)", items: DEXA_AZ },
  { key: "rentgen", chip: "Rentgen", title: "Klassik rentgen", items: XRAY_AZ },
  { key: "dental", chip: "Dental", title: "Dental görüntüləmə", items: DENTAL_AZ },
];

/* ============================== RU ============================== */

const PLATFORM_RU: FaqItem[] = [
  {
    question: "Что такое Rentgen.az?",
    answer:
      "Rentgen.az — платформа, объединяющая проверенные центры медицинской визуализации Азербайджана: рентген, КТ, МРТ, УЗИ, маммография, денситометрия и дентальная томография. Ищите по услуге, городу и цене и связывайтесь с центрами напрямую.",
  },
  {
    question: "Платформа платная?",
    answer:
      "Нет, для пациентов Rentgen.az полностью бесплатен. Вы оплачиваете только само обследование в выбранном центре.",
  },
  {
    question: "Как записаться на обследование?",
    answer:
      "На странице центра можно заполнить форму запроса, позвонить или написать в WhatsApp. Регистрация не обязательна — достаточно имени и номера телефона.",
  },
  {
    question: "Нужен ли пароль для регистрации?",
    answer:
      "Нет. Вы вводите номер телефона и получаете одноразовый код (OTP). После подтверждения кода профиль готов — пароля нет.",
  },
  {
    question: "Что делать, если код OTP не приходит?",
    answer:
      "Код отправляется только на азербайджанские мобильные номера. Подождите одну-две минуты и попробуйте снова; проверьте правильность номера. Если проблема сохраняется — напишите нам через страницу контактов.",
  },
  {
    question: "Как проверяются центры?",
    answer:
      "Профиль каждого центра проверяется после добавления на платформу — уточняются контакты, адрес и услуги. Только после этого центр отображается в каталоге со статусом «проверенный».",
  },
  {
    question: "Откуда берутся цены и точны ли они?",
    answer:
      "Цены предоставляют и обновляют сами центры. Если цена не указана — центр её ещё не сообщил; точную сумму можно уточнить звонком или в WhatsApp. Финальную цену всегда подтверждайте в самом центре.",
  },
  {
    question: "Оплата за услуги проходит на платформе?",
    answer:
      "Нет. Rentgen.az помогает найти и сравнить центры и связаться с ними. Оплата и обследование происходят непосредственно в выбранном центре.",
  },
  {
    question: "Как я получу результаты обследования?",
    answer:
      "Результат выдаёт центр, где вы обследовались — в печатном, дисковом или электронном виде. Некоторые центры делятся файлом результата и через платформу; тогда он появится в вашем профиле.",
  },
  {
    question: "Обязательно ли направление врача?",
    answer:
      "В большинстве частных центров приём возможен без направления. Однако для правильного выбора обследования и трактовки результата рекомендуем обращаться с заключением врача.",
  },
];

const MRT_RU: FaqItem[] = [
  {
    question: "Вредна ли МРТ?",
    answer:
      "МРТ не использует рентгеновские лучи — только магнитное поле и радиоволны. Лучевой нагрузки нет, метод считается безопасным и для повторных обследований.",
  },
  {
    question: "Сколько длится МРТ?",
    answer:
      "Обычно 15–40 минут в зависимости от зоны. Исследования с контрастом занимают немного больше. Важно лежать неподвижно — от этого зависит качество снимков.",
  },
  {
    question: "Кому нельзя делать МРТ?",
    answer:
      "Обладателям кардиостимулятора, кохлеарного импланта и некоторых металлических имплантов нужно заранее сообщить врачу — часть современных устройств совместима с МРТ, потребуется документ. О металлических осколках в теле тоже необходимо предупредить.",
  },
  {
    question: "У меня клаустрофобия — смогу ли я пройти МРТ?",
    answer:
      "В большинстве случаев да. В некоторых центрах есть аппараты с более широким туннелем; предупредите центр заранее — наушники, паузы и поддержка персонала заметно облегчают процедуру.",
  },
  {
    question: "Что такое контраст и безопасен ли он?",
    answer:
      "Контраст — внутривенное вещество для более чёткой визуализации тканей. Обычно переносится хорошо; о болезнях почек и аллергиях сообщите врачу заранее.",
  },
  {
    question: "Нужна ли подготовка к МРТ?",
    answer:
      "Для обычной МРТ — нет, достаточно снять все металлические предметы (украшения, часы, ремень, телефон). Перед исследованием с контрастом врач может попросить не есть несколько часов.",
  },
];

const KT_RU: FaqItem[] = [
  {
    question: "Что такое КТ (компьютерная томография)?",
    answer:
      "КТ — быстрое исследование, послойно визуализирующее тело с помощью рентгеновских лучей. Особенно информативно для костных структур, лёгких и неотложных состояний.",
  },
  {
    question: "В чём разница между КТ и МРТ?",
    answer:
      "КТ работает на рентгеновских лучах, занимает несколько минут и лучше показывает кости и лёгкие. МРТ без облучения, длится 15–40 минут и точнее показывает мягкие ткани (мозг, диски, суставы). Что нужно именно вам — решает врач.",
  },
  {
    question: "Опасна ли доза облучения при КТ?",
    answer:
      "На современных аппаратах доза строго контролируется, и при наличии показаний диагностическая польза многократно превышает риск. КТ следует делать по назначению врача.",
  },
  {
    question: "Нужна ли подготовка к КТ с контрастом?",
    answer:
      "Да — обычно за 4–6 часов до исследования не едят, могут спросить о функции почек. Точные правила сообщит центр при записи.",
  },
  {
    question: "Можно ли делать КТ при беременности?",
    answer:
      "КТ живота и таза при беременности выполняется только по жизненным показаниям; по возможности заменяется УЗИ или МРТ. Обязательно сообщите о беременности заранее.",
  },
  {
    question: "Когда будет готов результат КТ?",
    answer:
      "Снимки получают сразу; письменное заключение врача обычно готовится от нескольких часов до суток. Точный срок уточните в центре.",
  },
];

const USM_RU: FaqItem[] = [
  {
    question: "Вредно ли УЗИ?",
    answer:
      "Нет. Ультразвуковое исследование не даёт облучения, безболезненно и считается безопасным в любой период, включая беременность. Поэтому часто является методом первого выбора.",
  },
  {
    question: "Сколько часов не есть перед УЗИ брюшной полости?",
    answer:
      "Обычно 6–8 часов. Еда сокращает желчный пузырь, а газы в кишечнике ухудшают картинку. Немного обычной воды можно; за 1–2 дня стоит сократить газообразующие продукты.",
  },
  {
    question: "Почему на УЗИ малого таза нужен полный мочевой пузырь?",
    answer:
      "Полный пузырь создаёт «акустическое окно» для чёткой визуализации органов таза (матка, простата). Примерно за час до исследования выпейте 2–4 стакана воды и не мочитесь.",
  },
  {
    question: "Что такое допплер-УЗИ?",
    answer:
      "Допплер — вид УЗИ, показывающий направление и скорость кровотока в сосудах. Используется для оценки сосудов шеи, конечностей и брюшной полости.",
  },
  {
    question: "Какие виды УЗИ не требуют подготовки?",
    answer:
      "УЗИ щитовидной железы, молочных желёз, суставов и мягких тканей — приходите в любое время без подготовки.",
  },
  {
    question: "Результат УЗИ выдают сразу?",
    answer:
      "Да, в большинстве случаев врач оценивает картину во время исследования, и письменное заключение выдаётся в тот же день.",
  },
];

const MAMMO_RU: FaqItem[] = [
  {
    question: "С какого возраста делать маммографию?",
    answer:
      "Общая рекомендация: регулярный скрининг с 40 лет, раз в 1–2 года. При семейной истории рака молочной железы врач может рекомендовать начать раньше.",
  },
  {
    question: "Маммография — это больно?",
    answer:
      "Железа на несколько секунд слегка сжимается — это может быть неприятно, но быстро проходит. В первую неделю после менструации грудь менее чувствительна — удобнее планировать на этот период.",
  },
  {
    question: "Опасно ли облучение при маммографии?",
    answer:
      "Доза при цифровой маммографии очень мала, а польза раннего выявления многократно её превышает. При возможной беременности предупредите заранее.",
  },
  {
    question: "Чем маммография отличается от УЗИ молочных желёз?",
    answer:
      "Методы дополняют друг друга: маммография лучше видит микрокальцинаты (один из самых ранних признаков), УЗИ сильнее при плотной ткани и оценке кист. В молодом возрасте обычно сначала выбирают УЗИ.",
  },
  {
    question: "У меня грудные импланты — маммография возможна?",
    answer:
      "Да, со специальной техникой съёмки. Сообщите центру об имплантах заранее при записи.",
  },
  {
    question: "Что означает BI-RADS в заключении?",
    answer:
      "BI-RADS — стандартная шкала оценки результатов. Даже при выявленных изменениях большинство из них доброкачественные — обсудите дальнейшие шаги с маммологом.",
  },
];

const DEXA_RU: FaqItem[] = [
  {
    question: "Что такое денситометрия (DEXA)?",
    answer:
      "Низкодозовое рентгеновское исследование, измеряющее минеральную плотность костей. Стандартный метод выявления остеопороза за годы до возможного перелома.",
  },
  {
    question: "Кому нужна денситометрия?",
    answer:
      "Женщинам 65+ и мужчинам 70+, женщинам после менопаузы, перенёсшим перелом от небольшой травмы, длительно принимающим кортикостероиды и при семейной истории остеопороза. Точные показания определяет врач.",
  },
  {
    question: "Как проходит исследование?",
    answer:
      "Вы лежите на столе в одежде, сканер проходит над поясницей и тазобедренной областью. Занимает 10–15 минут, полностью безболезненно; доза во много раз ниже обычного рентгена.",
  },
  {
    question: "Что означает T-показатель?",
    answer:
      "T-балл −1.0 и выше — норма; от −1.0 до −2.5 — остеопения (начальное разрежение); −2.5 и ниже — остеопороз. Обсудите результат с эндокринологом или ревматологом.",
  },
  {
    question: "Нужна ли подготовка к денситометрии?",
    answer:
      "Специальной подготовки нет. В день исследования не принимайте препараты кальция и избегайте одежды с металлическими деталями. Если недавно была КТ/МРТ с контрастом — сообщите центру.",
  },
  {
    question: "Как часто повторять?",
    answer:
      "Обычно раз в 1–2 года — в зависимости от результата и лечения, по решению врача. Для корректного сравнения повторное исследование лучше проходить на том же аппарате.",
  },
];

const XRAY_RU: FaqItem[] = [
  {
    question: "Вреден ли рентген и сколько раз в год можно?",
    answer:
      "На современных цифровых аппаратах доза низкая, и каждое обоснованное исследование считается безопасным. Универсального «максимум N раз в год» нет — решение принимает врач по балансу пользы и риска.",
  },
  {
    question: "Можно ли делать рентген при беременности?",
    answer:
      "Рентген зон, удалённых от живота (зубы, кисть, грудная клетка), возможен со свинцовым фартуком; рентген живота и таза — только по необходимости, чаще заменяется УЗИ/МРТ. Обязательно сообщите о беременности.",
  },
  {
    question: "Зачем нужен свинцовый фартук?",
    answer:
      "Это защитное покрытие, не пропускающее рентгеновские лучи — закрывает необследуемые зоны, прежде всего живот и таз. При желании можете сами попросить его в центре.",
  },
  {
    question: "Что показывает рентген лёгких?",
    answer:
      "Пневмонию, туберкулёз, плеврит, некоторые образования, размеры тени сердца. В сомнительных случаях врач может дополнительно назначить КТ лёгких.",
  },
  {
    question: "Можно ли делать рентген детям?",
    answer:
      "Да, при наличии показаний — в детском режиме доза дополнительно снижается, используются защитные покрытия. Делайте только по назначению врача.",
  },
  {
    question: "В каком виде выдают результат рентгена?",
    answer:
      "В зависимости от центра: распечатанный снимок, диск/USB или электронный файл (иногда прямо через платформу). Письменное заключение врача прилагается.",
  },
];

const DENTAL_RU: FaqItem[] = [
  {
    question: "Опасен ли дентальный рентген?",
    answer:
      "Доза современного цифрового дентального рентгена очень мала — сравнима с несколькими часами естественного фонового облучения. Исследование назначается при клинических показаниях.",
  },
  {
    question: "Что такое панорамный (ортопантомограмма) рентген?",
    answer:
      "Обзорный снимок, показывающий все зубы, обе челюсти и окружающие структуры на одном изображении. Самое частое исследование для планирования лечения и оценки зубов мудрости.",
  },
  {
    question: "Для чего назначается цефалометрический рентген?",
    answer:
      "В основном перед ортодонтическим лечением (брекеты и т.п.) — для оценки размеров лицевого скелета и прикуса. По этим измерениям ортодонт строит план лечения.",
  },
  {
    question: "В чём разница между 3D-томографией (КЛКТ) и обычным рентгеном?",
    answer:
      "Обычный рентген даёт двухмерный снимок; КЛКТ показывает челюсть в 3D — точно видны объём и плотность кости, положение нервного канала. При имплантации, сложных удалениях и лечении каналов преимущество за КЛКТ.",
  },
  {
    question: "Зачем перед имплантацией нужна 3D-томография?",
    answer:
      "КЛКТ позволяет объёмно оценить кость челюсти и анатомические структуры (нервный канал, синус) — именно по ней планируются размер и позиция импланта.",
  },
  {
    question: "Можно ли делать дентальный рентген детям?",
    answer:
      "Да, по показаниям — для оценки корней молочных зубов, развития постоянных зубов и ортодонтической диагностики. В детском режиме доза ещё ниже, чем у взрослых.",
  },
  {
    question: "Можно ли делать рентген зуба при беременности?",
    answer:
      "Со свинцовым фартуком и воротником — можно: доза, достигающая плода, ничтожна. Оставлять острую боль и инфекцию без лечения рискованнее; обязательно сообщите врачу о беременности.",
  },
];

const SECTIONS_RU: FaqSection[] = [
  { key: "platforma", chip: "Платформа", title: "О платформе", items: PLATFORM_RU },
  { key: "mrt", chip: "МРТ", title: "МРТ", items: MRT_RU },
  { key: "kt", chip: "КТ", title: "КТ (компьютерная томография)", items: KT_RU },
  { key: "usm", chip: "УЗИ", title: "УЗИ", items: USM_RU },
  { key: "mammoqrafiya", chip: "Маммография", title: "Маммография", items: MAMMO_RU },
  { key: "dexa", chip: "DEXA", title: "Денситометрия (DEXA)", items: DEXA_RU },
  { key: "rentgen", chip: "Рентген", title: "Классический рентген", items: XRAY_RU },
  { key: "dental", chip: "Дентал", title: "Дентальная визуализация", items: DENTAL_RU },
];

/* ============================ Exports ============================ */

export function getFaqSections(locale: Locale): FaqSection[] {
  return locale === "ru" ? SECTIONS_RU : SECTIONS_AZ;
}

/** Homepage teaser — platformanın ilk 6 sualı. */
export function getHomeFaq(locale: Locale): FaqItem[] {
  return (locale === "ru" ? PLATFORM_RU : PLATFORM_AZ).slice(0, 6);
}

/** Full flat list (JSON-LD üçün) for the given locale. */
export function getAllFaq(locale: Locale): FaqItem[] {
  return getFaqSections(locale).flatMap((s) => s.items);
}

/** Backward-compatible default (AZ) — used for structured data (SEO). */
export const HOME_FAQ = PLATFORM_AZ.slice(0, 6);
