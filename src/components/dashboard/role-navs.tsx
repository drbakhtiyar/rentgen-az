import {
  LayoutDashboard,
  Building2,
  ListChecks,
  User,
  Users,
  Inbox,
  Stethoscope,
  FileText,
  Settings,
  Heart,
  History,
  Star,
  MessageSquare,
  Bell,
  Wallet,
  Download,
  Trash2,
  UserPlus,
  Handshake,
  CalendarDays,
  MessagesSquare,
  Sparkles,
  UserCog,
} from "lucide-react";
import type { NavItem } from "./nav";

export const centerNav: NavItem[] = [
  { label: "İcmal", href: "/merkez", icon: <LayoutDashboard />, navKey: "icmal" },
  { label: "Söhbətlər", href: "/merkez/chat", icon: <MessageSquare />, navKey: "chat" },
  { label: "Bildirişlər", href: "/merkez/bildirisler", icon: <Bell />, navKey: "bildirisler" },
  { label: "Profil", href: "/merkez/profil", icon: <Building2 />, navKey: "profil" },
  { label: "Pasiyentlər", href: "/merkez/pasiyentler", icon: <Users />, navKey: "pasiyentler" },
  { label: "CRM / Təqvim", href: "https://crm.rentgen.az/teqvim", icon: <CalendarDays />, navKey: "crmLink" },
  { label: "Xidmətlər və qiymətlər", href: "/merkez/xidmetler", icon: <ListChecks />, navKey: "xidmetler" },
  { label: "Partnyor həkimlər", href: "/merkez/hekimler", icon: <Stethoscope />, navKey: "hekimler" },
  { label: "Rəylər", href: "/merkez/reyler", icon: <Star />, navKey: "reyler" },
  { label: "Paket / Balans", href: "/merkez/paket", icon: <Wallet />, navKey: "paket" },
  { label: "Zibil qutusu", href: "/merkez/zibil-qutusu", icon: <Trash2 />, navKey: "zibil" },
  { label: "Export / API", href: "/merkez/export", icon: <Download />, navKey: "export" },
];

// CRM subdomain (crm.rentgen.az) — center-only scheduling app.
export const crmNav: NavItem[] = [
  { label: "Bugün", href: "/crm", icon: <LayoutDashboard />, navKey: "crmToday" },
  { label: "Təqvim", href: "/crm/teqvim", icon: <CalendarDays />, navKey: "crmCalendar" },
  { label: "Pasiyentlər", href: "/crm/pasiyentler", icon: <Users />, navKey: "pasiyentler" },
  { label: "Söhbətlər", href: "/crm/chat", icon: <MessagesSquare />, navKey: "chat" },
  { label: "SMS-lər", href: "/crm/sms", icon: <MessageSquare />, navKey: "crmSms" },
  { label: "Ayarlar", href: "/crm/ayarlar", icon: <Settings />, navKey: "crmSettings" },
  { label: "Jurnal", href: "/crm/jurnal", icon: <History />, navKey: "crmActivity" },
  { label: "Mərkəz paneli", href: "https://rentgen.az/merkez", icon: <Building2 />, navKey: "crmCenterPanel" },
];

export const doctorNav: NavItem[] = [
  { label: "İcmal", href: "/hekim", icon: <LayoutDashboard />, navKey: "icmal" },
  { label: "Söhbətlər", href: "/hekim/chat", icon: <MessageSquare />, navKey: "chat" },
  { label: "Bildirişlər", href: "/hekim/bildirisler", icon: <Bell />, navKey: "bildirisler" },
  { label: "Profil", href: "/hekim/profil", icon: <User />, navKey: "profil" },
  { label: "Pasiyentlər", href: "/hekim/pasiyentler", icon: <Users />, navKey: "pasiyentler" },
  { label: "Partnyor mərkəzlər", href: "/hekim/merkezler", icon: <Building2 />, navKey: "merkezler" },
  { label: "Paket / Balans", href: "/hekim/paket", icon: <Wallet />, navKey: "paket" },
];

export const patientNav: NavItem[] = [
  { label: "İcmal", href: "/kabinet", icon: <LayoutDashboard />, navKey: "icmal" },
  { label: "Bildirişlər", href: "/kabinet/bildirisler", icon: <Bell />, navKey: "bildirisler" },
  { label: "Profil", href: "/kabinet/profil", icon: <User />, navKey: "profil" },
  { label: "Seçilmişlər", href: "/kabinet/secilmisler", icon: <Heart />, navKey: "secilmisler" },
];

export const adminNav: NavItem[] = [
  { label: "İcmal", href: "/admin", icon: <LayoutDashboard /> },
  { label: "Söhbətlər", href: "/admin/sohbetler", icon: <MessageSquare /> },
  { label: "AI Yardımçı", href: "/admin/ai", icon: <Sparkles /> },
  { label: "Mərkəzlər", href: "/admin/merkezler", icon: <Building2 /> },
  { label: "Pasiyentlər", href: "/admin/pasiyentler", icon: <Users /> },
  { label: "Həkimlər", href: "/admin/hekimler", icon: <Stethoscope /> },
  { label: "Asistentlər", href: "/admin/asistentler", icon: <UserCog /> },
  { label: "Müraciətlər", href: "/admin/muracietler", icon: <Inbox /> },
  { label: "Yarımçıq qeydiyyat", href: "/admin/yarimciq-qeydiyyat", icon: <UserPlus /> },
  { label: "Həkim göndərişləri", href: "/admin/gonderisler", icon: <Stethoscope /> },
  { label: "Əməkdaşlıqlar", href: "/admin/emekdashliq", icon: <Handshake /> },
  { label: "Blog", href: "/admin/blog", icon: <FileText /> },
  { label: "Rəylər", href: "/admin/reyler", icon: <Star /> },
  { label: "Ödənişlər", href: "/admin/odenisler", icon: <Wallet /> },
  { label: "Xidmətlər", href: "/admin/xidmetler", icon: <ListChecks /> },
  { label: "SMS", href: "/admin/sms", icon: <MessageSquare /> },
  { label: "Parametrlər", href: "/admin/parametrler", icon: <Settings /> },
  { label: "Jurnal", href: "/admin/jurnal", icon: <History /> },
];
