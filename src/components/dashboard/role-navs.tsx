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
} from "lucide-react";
import type { NavItem } from "./nav";

export const centerNav: NavItem[] = [
  { label: "İcmal", href: "/merkez", icon: <LayoutDashboard /> },
  { label: "Söhbətlər", href: "/merkez/chat", icon: <MessageSquare /> },
  { label: "Bildirişlər", href: "/merkez/bildirisler", icon: <Bell /> },
  { label: "Profil", href: "/merkez/profil", icon: <Building2 /> },
  { label: "Pasiyentlər", href: "/merkez/pasiyentler", icon: <Users /> },
  { label: "Xidmətlər və qiymətlər", href: "/merkez/xidmetler", icon: <ListChecks /> },
  { label: "Partnyor həkimlər", href: "/merkez/hekimler", icon: <Stethoscope /> },
  { label: "Rəylər", href: "/merkez/reyler", icon: <Star /> },
  { label: "Paket / Balans", href: "/merkez/paket", icon: <Wallet /> },
  { label: "Export / API", href: "/merkez/export", icon: <Download /> },
];

export const doctorNav: NavItem[] = [
  { label: "İcmal", href: "/hekim", icon: <LayoutDashboard /> },
  { label: "Söhbətlər", href: "/hekim/chat", icon: <MessageSquare /> },
  { label: "Bildirişlər", href: "/hekim/bildirisler", icon: <Bell /> },
  { label: "Profil", href: "/hekim/profil", icon: <User /> },
  { label: "Pasiyentlər", href: "/hekim/pasiyentler", icon: <Users /> },
  { label: "Partnyor mərkəzlər", href: "/hekim/merkezler", icon: <Building2 /> },
  { label: "Paket / Balans", href: "/hekim/paket", icon: <Wallet /> },
];

export const patientNav: NavItem[] = [
  { label: "İcmal", href: "/kabinet", icon: <LayoutDashboard /> },
  { label: "Profil", href: "/kabinet/profil", icon: <User /> },
  { label: "Seçilmişlər", href: "/kabinet/secilmisler", icon: <Heart /> },
];

export const adminNav: NavItem[] = [
  { label: "İcmal", href: "/admin", icon: <LayoutDashboard /> },
  { label: "Söhbətlər", href: "/admin/sohbetler", icon: <MessageSquare /> },
  { label: "Mərkəzlər", href: "/admin/merkezler", icon: <Building2 /> },
  { label: "Pasiyentlər", href: "/admin/pasiyentler", icon: <Users /> },
  { label: "Həkimlər", href: "/admin/hekimler", icon: <Stethoscope /> },
  { label: "Müraciətlər", href: "/admin/muracietler", icon: <Inbox /> },
  { label: "Həkim göndərişləri", href: "/admin/gonderisler", icon: <Stethoscope /> },
  { label: "Blog", href: "/admin/blog", icon: <FileText /> },
  { label: "Rəylər", href: "/admin/reyler", icon: <Star /> },
  { label: "Ödənişlər", href: "/admin/odenisler", icon: <Wallet /> },
  { label: "Xidmətlər", href: "/admin/xidmetler", icon: <ListChecks /> },
  { label: "SMS", href: "/admin/sms", icon: <MessageSquare /> },
  { label: "Parametrlər", href: "/admin/parametrler", icon: <Settings /> },
  { label: "Jurnal", href: "/admin/jurnal", icon: <History /> },
];
