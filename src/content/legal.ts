import type { Locale } from "@/lib/i18n";

export type LegalSection = { h: string; b: string };

export type LegalDoc = {
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  sections: LegalSection[];
  contactHeading: string;
  contactPre: string;
  email: string;
  contactPost: string;
};

const EMAIL = "info@rentgen.az";

// ------------------------------ PRIVACY ------------------------------

const privacyAz: LegalDoc = {
  eyebrow: "Hüquqi",
  title: "Gizlilik siyasəti",
  description:
    "Bu siyasət Rentgen.az platformasından istifadə zamanı şəxsi məlumatlarınızın necə toplandığını, işləndiyini və qorunduğunu izah edir.",
  intro:
    "Rentgen.az (bundan sonra “platforma”) istifadəçilərin məxfiliyinə hörmət edir və şəxsi məlumatların qorunmasına önəm verir. Bu gizlilik siyasəti platformadan istifadə zamanı hansı məlumatların toplandığını və necə istifadə olunduğunu təsvir edir. Platformadan istifadə etməklə bu siyasətin şərtlərini qəbul etmiş olursunuz.",
  sections: [
    {
      h: "1. Toplanan məlumatlar",
      b: "Platformadan istifadə zamanı sizdən aşağıdakı məlumatları toplaya bilərik: ad, telefon nömrəsi, şəhər və ya rayon, eləcə də sorğu göndərərkən könüllü olaraq qeyd etdiyiniz əlavə məlumatlar (məsələn, maraqlandığınız xidmət növü). Bundan əlavə, texniki məlumatlar (brauzer növü, cihaz və IP ünvanı kimi log məlumatları) avtomatik qeydə alına bilər.",
    },
    {
      h: "2. Telefon nömrəsi və OTP kodların işlənməsi",
      b: "Qeydiyyat və giriş parol olmadan, birdəfəlik təsdiq kodu (OTP) vasitəsilə həyata keçirilir. Telefon nömrənizi daxil etdikdə SMS ilə təsdiq kodu göndərilir. OTP kodları yalnız təsdiq prosesi üçün istifadə olunur, məhdud müddət ərzində etibarlıdır və müddət bitdikdən sonra etibarsız sayılır. Telefon nömrəniz hesabınızın əsas identifikatoru kimi saxlanılır.",
    },
    {
      h: "3. Məlumatların istifadə məqsədi",
      b: "Topladığımız məlumatlardan aşağıdakı məqsədlərlə istifadə edirik: hesabınızı yaratmaq və idarə etmək, OTP vasitəsilə kimliyinizi təsdiqləmək, göndərdiyiniz sorğuları müvafiq rentgen mərkəzlərinə ötürmək, sizinlə əlaqə saxlamaq, platformanın funksionallığını təmin etmək və xidmət keyfiyyətini yaxşılaşdırmaq.",
    },
    {
      h: "4. Məlumatların üçüncü tərəflərlə paylaşılması",
      b: "Şəxsi məlumatlarınızı satmırıq. Məlumatlar yalnız xidmətin təmin edilməsi üçün zəruri olan tərəflərlə paylaşıla bilər: təsdiq kodlarının göndərilməsi üçün SMS provayderi, platformanın işləməsi üçün hosting və infrastruktur xidmətləri, eləcə də sorğu göndərdiyiniz rentgen mərkəzləri. Bu tərəflər məlumatları yalnız təyin olunmuş məqsədlər üçün emal edir. Qanunla tələb olunduqda məlumatlar səlahiyyətli orqanlara açıqlana bilər.",
    },
    {
      h: "5. Məlumatların saxlanması və qorunması",
      b: "Məlumatlarınızın icazəsiz əldə edilməsinin, dəyişdirilməsinin və ya məhv edilməsinin qarşısını almaq üçün texniki və təşkilati tədbirlər tətbiq edirik. Məlumatlar yalnız bu siyasətdə qeyd olunan məqsədlər üçün zəruri olan müddət ərzində saxlanılır. İnternet üzərindən heç bir ötürülmə üsulunun tam təhlükəsizliyini zəmanət vermək mümkün olmasa da, məlumatlarınızı qorumaq üçün ağlabatan səylər göstəririk.",
    },
    {
      h: "6. İstifadəçi hüquqları",
      b: "Sizin haqqınızda saxlanılan şəxsi məlumatlara baxmaq, onları düzəltmək və ya silinməsini tələb etmək hüququnuz var. Hesabınızın silinməsini istəyə və ya məlumatlarınızın emalı ilə bağlı sual verə bilərsiniz. Bu hüquqlardan istifadə etmək üçün aşağıda göstərilən əlaqə kanalları vasitəsilə bizimlə əlaqə saxlaya bilərsiniz.",
    },
    {
      h: "7. Cookie və oxşar texnologiyalar",
      b: "Platforma düzgün işləməsi, sessiyanın saxlanması və istifadə təcrübəsinin yaxşılaşdırılması üçün cookie (kukilər) və oxşar texnologiyalardan istifadə edə bilər. Brauzerinizin tənzimləmələri vasitəsilə kukiləri idarə edə və ya söndürə bilərsiniz; lakin bu halda platformanın bəzi funksiyaları məhdudlaşa bilər.",
    },
    {
      h: "8. Siyasətdə dəyişikliklər",
      b: "Bu gizlilik siyasəti vaxtaşırı yenilənə bilər. Dəyişikliklər bu səhifədə dərc olunduğu andan etibarən qüvvəyə minir. Platformadan istifadəni davam etdirməklə yenilənmiş siyasəti qəbul etmiş olursunuz. Mütəmadi olaraq bu səhifəni nəzərdən keçirməyinizi tövsiyə edirik.",
    },
  ],
  contactHeading: "9. Əlaqə",
  contactPre:
    "Gizlilik siyasəti ilə bağlı suallarınız və ya sorğularınız üçün bizimlə e-poçt vasitəsilə əlaqə saxlaya bilərsiniz: ",
  email: EMAIL,
  contactPost: ".",
};

const privacyRu: LegalDoc = {
  eyebrow: "Правовая информация",
  title: "Политика конфиденциальности",
  description:
    "Эта политика объясняет, как при использовании платформы Rentgen.az собираются, обрабатываются и защищаются ваши персональные данные.",
  intro:
    "Rentgen.az (далее — «платформа») уважает конфиденциальность пользователей и придаёт значение защите персональных данных. Настоящая политика конфиденциальности описывает, какие данные собираются при использовании платформы и как они используются. Используя платформу, вы принимаете условия этой политики.",
  sections: [
    {
      h: "1. Собираемые данные",
      b: "При использовании платформы мы можем собирать следующие данные: имя, номер телефона, город или район, а также дополнительные сведения, которые вы указываете добровольно при отправке заявки (например, интересующий вид услуги). Кроме того, автоматически могут фиксироваться технические данные (тип браузера, устройство и лог-данные, такие как IP-адрес).",
    },
    {
      h: "2. Обработка номера телефона и OTP-кодов",
      b: "Регистрация и вход выполняются без пароля, через одноразовый код подтверждения (OTP). При вводе номера телефона вам по SMS отправляется код подтверждения. OTP-коды используются только для процесса подтверждения, действительны ограниченное время и после истечения срока считаются недействительными. Ваш номер телефона хранится как основной идентификатор аккаунта.",
    },
    {
      h: "3. Цели использования данных",
      b: "Собранные данные мы используем в следующих целях: создание и управление вашим аккаунтом, подтверждение вашей личности через OTP, передача отправленных вами заявок соответствующим рентген-центрам, связь с вами, обеспечение работы платформы и улучшение качества обслуживания.",
    },
    {
      h: "4. Передача данных третьим лицам",
      b: "Мы не продаём ваши персональные данные. Данные могут передаваться только сторонам, необходимым для оказания услуги: SMS-провайдеру для отправки кодов подтверждения, службам хостинга и инфраструктуры для работы платформы, а также рентген-центрам, которым вы отправляете заявку. Эти стороны обрабатывают данные только в установленных целях. При наличии требований закона данные могут быть раскрыты уполномоченным органам.",
    },
    {
      h: "5. Хранение и защита данных",
      b: "Мы применяем технические и организационные меры для предотвращения несанкционированного доступа к вашим данным, их изменения или уничтожения. Данные хранятся только в течение срока, необходимого для целей, указанных в этой политике. Хотя гарантировать полную безопасность любого способа передачи через интернет невозможно, мы прилагаем разумные усилия для защиты ваших данных.",
    },
    {
      h: "6. Права пользователя",
      b: "Вы имеете право просматривать хранящиеся о вас персональные данные, исправлять их или требовать их удаления. Вы можете запросить удаление аккаунта или задать вопрос об обработке ваших данных. Чтобы воспользоваться этими правами, вы можете связаться с нами по указанным ниже каналам связи.",
    },
    {
      h: "7. Cookie и подобные технологии",
      b: "Платформа может использовать cookie (куки) и подобные технологии для корректной работы, сохранения сессии и улучшения удобства использования. Вы можете управлять куки или отключить их в настройках браузера; однако в этом случае некоторые функции платформы могут быть ограничены.",
    },
    {
      h: "8. Изменения в политике",
      b: "Настоящая политика конфиденциальности может периодически обновляться. Изменения вступают в силу с момента их публикации на этой странице. Продолжая пользоваться платформой, вы принимаете обновлённую политику. Рекомендуем регулярно просматривать эту страницу.",
    },
  ],
  contactHeading: "9. Контакты",
  contactPre:
    "По вопросам или запросам, связанным с политикой конфиденциальности, вы можете связаться с нами по электронной почте: ",
  email: EMAIL,
  contactPost: ".",
};

// ------------------------------- TERMS -------------------------------

const termsAz: LegalDoc = {
  eyebrow: "Hüquqi",
  title: "İstifadə şərtləri",
  description:
    "Bu şərtlər Rentgen.az platformasından istifadəni tənzimləyir. Platformadan istifadə etməklə aşağıdakı şərtləri qəbul etmiş olursunuz.",
  intro:
    "Aşağıdakı şərtlər Rentgen.az (bundan sonra “platforma”) saytından və xidmətlərindən istifadəni tənzimləyir. Platformaya daxil olmaqla və ya ondan istifadə etməklə bu şərtlərlə razılaşdığınızı təsdiq edirsiniz. Şərtlərlə razılaşmırsınızsa, platformadan istifadə etməyin.",
  sections: [
    {
      h: "1. Platformanın təyinatı",
      b: "Rentgen.az Azərbaycanda dental rentgen və 3D tomoqrafiya xidmətləri göstərən mərkəzləri bir araya gətirən kataloq və əlaqə platformasıdır. Platforma istifadəçilərə mərkəzləri tapmaq, müqayisə etmək və onlarla birbaşa əlaqə saxlamaq imkanı verir. Platforma tibbi məsləhət, diaqnoz və ya müalicə xidməti göstərmir.",
    },
    {
      h: "2. Hesab və OTP giriş",
      b: "Bəzi funksiyalardan istifadə üçün qeydiyyat tələb oluna bilər. Qeydiyyat və giriş telefon nömrəsi və birdəfəlik təsdiq kodu (OTP) vasitəsilə həyata keçirilir. Telefon nömrənizin və hesabınızın təhlükəsizliyinə görə siz məsuliyyət daşıyırsınız. Hesabınızdan icazəsiz istifadə aşkar etdikdə dərhal bizimlə əlaqə saxlamalısınız.",
    },
    {
      h: "3. İstifadəçi öhdəlikləri",
      b: "İstifadəçi platformaya dəqiq və düzgün məlumat təqdim etməyi öhdəsinə götürür. Platformadan qanunsuz məqsədlər üçün, başqalarının hüquqlarını pozaraq və ya sistemin normal işinə mane olacaq şəkildə istifadə etmək qadağandır. Saxta sorğular göndərmək, başqasının adına hərəkət etmək və platformanın təhlükəsizliyini pozmağa cəhd etmək yolverilməzdir.",
    },
    {
      h: "4. Rentgen mərkəzlərinin öhdəlikləri",
      b: "Platformada profil yaradan rentgen mərkəzləri təqdim etdikləri məlumatların (ünvan, əlaqə nömrələri, xidmətlər və iş saatları) doğruluğuna görə məsuliyyət daşıyır. Mərkəzlər müvafiq fəaliyyət icazələrinə malik olmalı və göstərdikləri xidmətləri qüvvədə olan tələblərə uyğun həyata keçirməlidir. Platforma profil məlumatlarını yoxlaya bilər, lakin mərkəzlərin fəaliyyətinə zəmanət vermir.",
    },
    {
      h: "5. Məzmun və əqli mülkiyyət",
      b: "Platformadakı dizayn, mətnlər, loqo, proqram təminatı və digər materiallar Rentgen.az-a və ya müvafiq hüquq sahiblərinə məxsusdur və əqli mülkiyyət qanunvericiliyi ilə qorunur. Bu materialların icazəsiz kopyalanması, yayılması və ya kommersiya məqsədilə istifadəsi qadağandır. Mərkəzlərin təqdim etdiyi məzmuna görə müvafiq mərkəzlər cavabdehdir.",
    },
    {
      h: "6. Tibbi məsuliyyət açıqlaması",
      b: "Platformada yer alan məlumatlar yalnız ümumi məlumatlandırma məqsədi daşıyır və ixtisaslı həkimin məsləhətini, müayinəsini və ya müalicəsini əvəz etmir. Hər hansı sağlamlıq qərarı qəbul etməzdən əvvəl mütləq həkiminizlə məsləhətləşin. Müayinə növü və onun zəruriliyi barədə qərarı yalnız klinik göstərişlərə əsasən həkim verir.",
    },
    {
      h: "7. Məsuliyyətin məhdudlaşdırılması",
      b: "Rentgen.az mərkəzlər və istifadəçilər arasında əlaqə vasitəsi rolunu oynayır. Müayinənin keyfiyyətinə, nəticələrinə və mərkəzlər tərəfindən göstərilən xidmətlərə görə platforma cavabdeh deyil. Ödəniş və müayinə birbaşa seçdiyiniz mərkəzdə həyata keçirilir; platforma bu əməliyyatların tərəfi deyil. Qanunla icazə verilən maksimum həddə, platformadan istifadə nəticəsində yaranan dolayı zərərlərə görə məsuliyyət daşımırıq.",
    },
    {
      h: "8. Şərtlərdə dəyişikliklər",
      b: "Bu istifadə şərtləri vaxtaşırı yenilənə bilər. Dəyişikliklər bu səhifədə dərc olunduğu andan qüvvəyə minir. Platformadan istifadəni davam etdirməklə yenilənmiş şərtləri qəbul etmiş sayılırsınız.",
    },
    {
      h: "9. Tətbiq olunan qanun",
      b: "Bu şərtlər Azərbaycan Respublikasının qanunvericiliyinə uyğun tənzimlənir və şərh olunur. Platformadan istifadə ilə bağlı yarana biləcək mübahisələr Azərbaycan Respublikasının səlahiyyətli məhkəmələrində həll edilir.",
    },
  ],
  contactHeading: "10. Əlaqə",
  contactPre:
    "İstifadə şərtləri ilə bağlı suallarınız üçün bizimlə e-poçt vasitəsilə əlaqə saxlaya bilərsiniz: ",
  email: EMAIL,
  contactPost: ".",
};

const termsRu: LegalDoc = {
  eyebrow: "Правовая информация",
  title: "Условия использования",
  description:
    "Эти условия регулируют использование платформы Rentgen.az. Используя платформу, вы принимаете приведённые ниже условия.",
  intro:
    "Приведённые ниже условия регулируют использование сайта и услуг Rentgen.az (далее — «платформа»). Заходя на платформу или используя её, вы подтверждаете своё согласие с этими условиями. Если вы не согласны с условиями, не используйте платформу.",
  sections: [
    {
      h: "1. Назначение платформы",
      b: "Rentgen.az — это каталог и платформа связи, объединяющая центры дентального рентгена и 3D-томографии в Азербайджане. Платформа даёт пользователям возможность находить центры, сравнивать их и связываться с ними напрямую. Платформа не оказывает медицинских консультаций, не ставит диагнозы и не проводит лечение.",
    },
    {
      h: "2. Аккаунт и вход по OTP",
      b: "Для использования некоторых функций может потребоваться регистрация. Регистрация и вход выполняются через номер телефона и одноразовый код подтверждения (OTP). Вы несёте ответственность за безопасность вашего номера телефона и аккаунта. При обнаружении несанкционированного использования аккаунта вы должны немедленно связаться с нами.",
    },
    {
      h: "3. Обязанности пользователя",
      b: "Пользователь обязуется предоставлять платформе точную и достоверную информацию. Запрещается использовать платформу в незаконных целях, нарушая права других лиц или мешая нормальной работе системы. Недопустимо отправлять ложные заявки, действовать от имени другого лица и пытаться нарушить безопасность платформы.",
    },
    {
      h: "4. Обязанности рентген-центров",
      b: "Рентген-центры, создающие профиль на платформе, несут ответственность за достоверность предоставленной информации (адрес, контактные номера, услуги и часы работы). Центры должны иметь соответствующие разрешения на деятельность и оказывать заявленные услуги в соответствии с действующими требованиями. Платформа может проверять данные профиля, но не гарантирует деятельность центров.",
    },
    {
      h: "5. Контент и интеллектуальная собственность",
      b: "Дизайн, тексты, логотип, программное обеспечение и другие материалы на платформе принадлежат Rentgen.az или соответствующим правообладателям и защищены законодательством об интеллектуальной собственности. Несанкционированное копирование, распространение или использование этих материалов в коммерческих целях запрещено. За контент, предоставленный центрами, отвечают соответствующие центры.",
    },
    {
      h: "6. Медицинский отказ от ответственности",
      b: "Информация на платформе носит исключительно общий информационный характер и не заменяет консультацию, обследование или лечение у квалифицированного врача. Прежде чем принимать какое-либо решение о здоровье, обязательно проконсультируйтесь с вашим врачом. Решение о виде обследования и его необходимости принимает только врач на основании клинических показаний.",
    },
    {
      h: "7. Ограничение ответственности",
      b: "Rentgen.az выступает средством связи между центрами и пользователями. Платформа не несёт ответственности за качество обследования, его результаты и услуги, оказываемые центрами. Оплата и обследование производятся напрямую в выбранном вами центре; платформа не является стороной этих операций. В максимально допустимой законом степени мы не несём ответственности за косвенный ущерб, возникший в результате использования платформы.",
    },
    {
      h: "8. Изменения условий",
      b: "Настоящие условия использования могут периодически обновляться. Изменения вступают в силу с момента их публикации на этой странице. Продолжая пользоваться платформой, вы считаетесь принявшими обновлённые условия.",
    },
    {
      h: "9. Применимое право",
      b: "Настоящие условия регулируются и толкуются в соответствии с законодательством Азербайджанской Республики. Споры, которые могут возникнуть в связи с использованием платформы, разрешаются в уполномоченных судах Азербайджанской Республики.",
    },
  ],
  contactHeading: "10. Контакты",
  contactPre:
    "По вопросам, связанным с условиями использования, вы можете связаться с нами по электронной почте: ",
  email: EMAIL,
  contactPost: ".",
};

export function getPrivacy(locale: Locale): LegalDoc {
  return locale === "ru" ? privacyRu : privacyAz;
}

export function getTerms(locale: Locale): LegalDoc {
  return locale === "ru" ? termsRu : termsAz;
}
