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
};

const PANEL_DICTS: Record<Locale, PanelDict> = { az, ru };

export function getPanelDict(locale: Locale): PanelDict {
  return PANEL_DICTS[locale] ?? az;
}
