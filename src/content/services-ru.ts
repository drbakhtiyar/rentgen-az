/**
 * Russian display names for services + categories. The catalog (names, slugs,
 * categories) lives in Azerbaijani in the DB / constants.ts; this maps the AZ
 * name → RU name for the public UI when the locale is "ru". Unmapped services
 * (e.g. admin-created) gracefully fall back to their AZ name.
 */

/** Category (AZ) → category (RU). */
export const CATEGORY_RU: Record<string, string> = {
  Dental: "Дентальные",
  "Baş və üz": "Голова и лицо",
  Boyun: "Шея",
  Sinə: "Грудная клетка",
  Onurğa: "Позвоночник",
  "Çiyin və yuxarı ətraf": "Плечо и рука",
  "Çanaq və omba": "Таз и бедро",
  "Aşağı ətraf": "Нижняя конечность",
  "Uşaqlar üçün": "Для детей",
  Floroskopiya: "Флюороскопия",
  Mammoqrafiya: "Маммография",
  Densitometriya: "Денситометрия",
  "Kompüter tomoqrafiyası (KT)": "Компьютерная томография (КТ)",
  MRT: "МРТ",
  USM: "УЗИ",
};

/** Service name (AZ) → service name (RU). */
export const SERVICE_NAME_RU: Record<string, string> = {
  // ---- Dental ----
  "Dental rentgen": "Дентальный рентген",
  "Diş rentgeni": "Рентген зуба",
  "Panoramik rentgen": "Панорамный рентген",
  "Sefalometrik rentgen": "Цефалометрический рентген",
  "3D dental tomoqrafiya": "3D дентальная томография",
  "CBCT (konus-şüalı kompüter tomoqrafiya)": "КЛКТ (конусно-лучевая компьютерная томография)",
  "İmplant öncəsi tomoqrafiya": "Предимплантационная томография",
  "Ağıl dişi üçün rentgen": "Рентген зуба мудрости",
  "Ortodontik rentgen": "Ортодонтический рентген",
  "Çənə sümüyü analizi": "Анализ челюстной кости",
  "Sinus və çənə anatomiyası qiymətləndirilməsi": "Оценка анатомии пазух и челюсти",
  // ---- Baş və üz ----
  "Kəllə rentgeni": "Рентген черепа",
  "Burun sümükləri rentgeni": "Рентген костей носа",
  "Üz sümükləri rentgeni": "Рентген костей лица",
  "Göz yuvası (orbita) rentgeni": "Рентген глазницы (орбиты)",
  "Alt çənə rentgeni": "Рентген нижней челюсти",
  "Üst çənə rentgeni": "Рентген верхней челюсти",
  "Temporomandibulyar oynaq (TMJ) rentgeni": "Рентген височно-нижнечелюстного сустава (ВНЧС)",
  "Mastoid rentgeni": "Рентген сосцевидного отростка",
  "Paranazal sinusların rentgeni": "Рентген околоносовых пазух",
  // ---- Boyun ----
  "Boyun rentgeni": "Рентген шеи",
  "Boyun fəqərələri rentgeni": "Рентген шейных позвонков",
  "Boyun yumşaq toxumalarının rentgeni": "Рентген мягких тканей шеи",
  // ---- Sinə ----
  "Ağciyər rentgeni": "Рентген лёгких",
  "Döş qəfəsi rentgeni": "Рентген грудной клетки",
  "Qabırğa rentgeni": "Рентген рёбер",
  "Sternum (döş sümüyü) rentgeni": "Рентген грудины",
  "Körpücük sümüyü rentgeni": "Рентген ключицы",
  // ---- Onurğa ----
  "Boyun onurğası rentgeni": "Рентген шейного отдела позвоночника",
  "Döş onurğası rentgeni": "Рентген грудного отдела позвоночника",
  "Bel onurğası rentgeni": "Рентген поясничного отдела позвоночника",
  "Oma (sakrum) rentgeni": "Рентген крестца",
  "Quyruq sümüyü (koksiks) rentgeni": "Рентген копчика",
  "Tam onurğa rentgeni": "Рентген всего позвоночника",
  "Skolioz rentgeni": "Рентген при сколиозе",
  // ---- Çiyin və yuxarı ətraf ----
  "Çiyin rentgeni": "Рентген плечевого сустава",
  "Kürək sümüyü rentgeni": "Рентген лопатки",
  "Bazu rentgeni": "Рентген плечевой кости",
  "Dirsək rentgeni": "Рентген локтевого сустава",
  "Bilək rentgeni": "Рентген лучезапястного сустава",
  "Əl rentgeni": "Рентген кисти",
  "Barmaq rentgeni": "Рентген пальца",
  // ---- Çanaq və omba ----
  "Çanaq rentgeni": "Рентген таза",
  "Omba oynağı rentgeni": "Рентген тазобедренного сустава",
  "Sakroiliak oynaq rentgeni": "Рентген крестцово-подвздошного сустава",
  // ---- Aşağı ətraf ----
  "Bud rentgeni": "Рентген бедренной кости",
  "Diz rentgeni": "Рентген коленного сустава",
  "Baldır rentgeni": "Рентген голени",
  "Topuq rentgeni": "Рентген голеностопного сустава",
  "Ayaq rentgeni": "Рентген стопы",
  "Ayaq barmaqları rentgeni": "Рентген пальцев стопы",
  "Daban rentgeni": "Рентген пяточной кости",
  // ---- Uşaqlar üçün ----
  "Uşaq skelet rentgeni": "Рентген скелета у детей",
  "Bud-çanaq skrininqi": "Скрининг тазобедренных суставов",
  "Sümük yaşının təyini (Bone Age)": "Определение костного возраста (Bone Age)",
  "Uşaqlarda skolioz rentgeni": "Рентген при сколиозе у детей",
  // ---- Floroskopiya ----
  "Qida borusunun kontrast müayinəsi": "Контрастное исследование пищевода",
  "Mədə-bağırsaq kontrast müayinəsi": "Контрастное исследование желудка и кишечника",
  "Barium udma testi": "Тест с проглатыванием бария",
  "Histerosalpinqoqrafiya (HSG)": "Гистеросальпингография (ГСГ)",
  Venoqrafiya: "Венография",
  Fistuloqrafiya: "Фистулография",
  // ---- Mammoqrafiya ----
  "Rəqəmsal mammoqrafiya": "Цифровая маммография",
  "Skrininq mammoqrafiyası": "Скрининговая маммография",
  "Diaqnostik mammoqrafiya": "Диагностическая маммография",
  "Tomosintez (3D mammoqrafiya)": "Томосинтез (3D маммография)",
  // ---- Densitometriya ----
  "Sümük mineral sıxlığı ölçülməsi (DEXA)": "Измерение минеральной плотности кости (DEXA)",
  "Bel DEXA": "DEXA поясничного отдела",
  "Bud DEXA": "DEXA бедра",
  "Tam bədən DEXA": "DEXA всего тела",
  // ---- Kompüter tomoqrafiyası (KT) ----
  "Baş KT": "КТ головы",
  "Beyin KT": "КТ головного мозга",
  "Sinus KT": "КТ пазух",
  "Temporal sümük KT": "КТ височной кости",
  "Boyun KT": "КТ шеи",
  "Ağciyər KT": "КТ лёгких",
  "Qarın KT": "КТ брюшной полости",
  "Kiçik çanaq KT": "КТ малого таза",
  "Onurğa KT": "КТ позвоночника",
  "Diz KT": "КТ коленного сустава",
  "Ayaq KT": "КТ стопы",
  "Əl KT": "КТ кисти",
  "Ürək KT": "КТ сердца",
  "Koronar KT-angioqrafiya": "Коронарная КТ-ангиография",
  // ---- MRT ----
  "Baş MRT": "МРТ головы",
  "Beyin MRT": "МРТ головного мозга",
  "Hipofiz MRT": "МРТ гипофиза",
  "Boyun MRT": "МРТ шеи",
  "Bel MRT": "МРТ поясничного отдела",
  "Diz MRT": "МРТ коленного сустава",
  "Çiyin MRT": "МРТ плечевого сустава",
  "Qarın MRT": "МРТ брюшной полости",
  "Çanaq MRT": "МРТ таза",
  "Ürək MRT": "МРТ сердца",
  // ---- USM ----
  "Qarın USM": "УЗИ брюшной полости",
  "Tiroid USM": "УЗИ щитовидной железы",
  "Süd vəzi USM": "УЗИ молочных желёз",
  "Doppler USM": "Допплеровское УЗИ",
  "Hamiləlik USM": "УЗИ при беременности",
  "Uşaq USM": "УЗИ детям",
};

/** RU name for an AZ service name (falls back to the AZ name). */
export function serviceNameRu(azName: string): string {
  return SERVICE_NAME_RU[azName] ?? azName;
}

/** RU category label (falls back to the AZ category). */
export function categoryRu(azCategory: string | null | undefined): string {
  if (!azCategory) return "";
  return CATEGORY_RU[azCategory] ?? azCategory;
}
