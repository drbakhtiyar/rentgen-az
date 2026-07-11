import type { Locale } from "@/lib/i18n";
import type { Plan } from "@/generated/prisma/client";

/**
 * Single source of truth for the per-plan feature lists shown on /paketler,
 * /bize-qoshul and /hekim-qoshul. Keep AZ in sync with /paketler exactly.
 */

export const CENTER_FEATURES: Record<Locale, Record<Plan, string[]>> = {
  az: {
    FREE: [
      "Baza mərkəz profili",
      "30 GB bulud storage (rentgen faylları)",
      "5 şəkil",
      "Standart axtarış sırası",
      "Aylıq 5 pasiyent müraciəti",
      "Həkimlərlə mesajlaşma",
    ],
    SILVER: [
      "Free-dəki hər şey +",
      "150 GB bulud storage",
      "15 şəkil",
      "Axtarışda prioritet sıralanma",
      "Limitsiz pasiyent müraciəti",
      "Əsas analitika (baxış · zəng · WhatsApp)",
      "Həkimlərlə mesajlaşma",
    ],
    GOLD: [
      "Silver-dəki hər şey +",
      "1 TB bulud storage",
      "Rəylər və reytinq",
      "Həkimlərdən pasiyent yönləndirmələri",
      "«Tövsiyə olunan» nişanı + featured yerləşdirmə",
      "Tam analitika paneli",
      "40 şəkil",
      "Əməkdaşlıq həkimlərinə toplu mesaj",
      "Prioritet dəstək",
    ],
    PLATINUM: [
      "Gold-dakı hər şey +",
      "3 TB bulud storage (hər əlavə 1 TB +29 AZN)",
      "Şəhər / kateqoriya üzrə TOP #1 yerləşdirmə",
      "Limitsiz şəkil",
      "Brendinq (loqo · banner)",
      "Fayl export / API girişi",
      "Fərdi menecer + prioritet dəstək",
    ],
  },
  ru: {
    FREE: [
      "Базовый профиль центра",
      "30 ГБ облачного хранилища (рентген-файлы)",
      "5 фото",
      "Стандартный порядок в поиске",
      "5 заявок пациентов в месяц",
      "Переписка с врачами",
    ],
    SILVER: [
      "Всё из Free +",
      "150 ГБ облачного хранилища",
      "15 фото",
      "Приоритет в поиске",
      "Безлимитные заявки пациентов",
      "Базовая аналитика (просмотры · звонки · WhatsApp)",
      "Переписка с врачами",
    ],
    GOLD: [
      "Всё из Silver +",
      "1 ТБ облачного хранилища",
      "Отзывы и рейтинг",
      "Направления пациентов от врачей",
      "Значок «Рекомендуем» + featured-размещение",
      "Полная панель аналитики",
      "40 фото",
      "Массовое сообщение партнёрским врачам",
      "Приоритетная поддержка",
    ],
    PLATINUM: [
      "Всё из Gold +",
      "3 ТБ облачного хранилища (каждый доп. 1 ТБ +29 AZN)",
      "ТОП #1 размещение по городу / категории",
      "Безлимит фото",
      "Брендинг (логотип · баннер)",
      "Экспорт файлов / доступ к API",
      "Персональный менеджер + приоритетная поддержка",
    ],
  },
};

export const DOCTOR_FEATURES: Record<Locale, Record<Plan, string[]>> = {
  az: {
    FREE: [
      "Baza həkim profili",
      "Pasiyenti mərkəzə yönləndirmə",
      "20 GB storage (pasiyent görüntüləri)",
      "Mərkəzlərlə çat",
      "Standart sıralanma",
    ],
    SILVER: [
      "Free-dəki hər şey +",
      "Təsdiqlənmiş nişan",
      "100 GB storage",
      "Portfolio (şəkillər)",
      "Profil statistikası",
      "Axtarışda prioritet",
    ],
    GOLD: [
      "Silver-dəki hər şey +",
      "500 GB storage",
      "Həkimlər siyahısında üst sıra",
      "Instagram / vebsayt vurğusu",
      "Limitsiz yönləndirmə tarixçəsi",
      "Prioritet dəstək",
    ],
    PLATINUM: [
      "Gold-dakı hər şey +",
      "1 TB storage (+1 TB blok ilə artırıla bilər)",
      "Axtarışda TOP yerləşmə",
      "Tam brendinq (Instagram, sayt, profil banneri + vurğulanmış kart)",
      "Fərdi dəstək",
    ],
  },
  ru: {
    FREE: [
      "Базовый профиль врача",
      "Направление пациента в центр",
      "20 ГБ хранилища (снимки пациентов)",
      "Чат с центрами",
      "Стандартный порядок",
    ],
    SILVER: [
      "Всё из Free +",
      "Значок проверенного",
      "100 ГБ хранилища",
      "Портфолио (фото)",
      "Статистика профиля",
      "Приоритет в поиске",
    ],
    GOLD: [
      "Всё из Silver +",
      "500 ГБ хранилища",
      "Верхняя строка в списке врачей",
      "Акцент на Instagram / сайт",
      "Безлимитная история направлений",
      "Приоритетная поддержка",
    ],
    PLATINUM: [
      "Всё из Gold +",
      "1 ТБ хранилища (расширяется блоками по 1 ТБ)",
      "ТОП-размещение в поиске",
      "Полный брендинг (Instagram, сайт, баннер профиля + выделенная карточка)",
      "Личная поддержка",
    ],
  },
};
