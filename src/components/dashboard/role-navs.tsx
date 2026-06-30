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
} from "lucide-react";
import type { NavItem } from "./nav";

export const centerNav: NavItem[] = [
  { label: "İcmal", href: "/merkez", icon: <LayoutDashboard /> },
  { label: "Profil", href: "/merkez/profil", icon: <Building2 /> },
  { label: "Xidmətlər və qiymətlər", href: "/merkez/xidmetler", icon: <ListChecks /> },
];

export const patientNav: NavItem[] = [
  { label: "İcmal", href: "/kabinet", icon: <LayoutDashboard /> },
  { label: "Profil", href: "/kabinet/profil", icon: <User /> },
  { label: "Seçilmişlər", href: "/kabinet/secilmisler", icon: <Heart /> },
];

export const adminNav: NavItem[] = [
  { label: "İcmal", href: "/admin", icon: <LayoutDashboard /> },
  { label: "Mərkəzlər", href: "/admin/merkezler", icon: <Building2 /> },
  { label: "Pasiyentlər", href: "/admin/pasiyentler", icon: <Users /> },
  { label: "Müraciətlər", href: "/admin/muracietler", icon: <Inbox /> },
  { label: "Həkim göndərişləri", href: "/admin/gonderisler", icon: <Stethoscope /> },
  { label: "Blog", href: "/admin/blog", icon: <FileText /> },
  { label: "Parametrlər", href: "/admin/parametrler", icon: <Settings /> },
];
